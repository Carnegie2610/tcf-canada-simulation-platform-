import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  OralTaskEvalSchema,
  buildOralTaskJsonSchema,
  type OralTaskEval,
} from "@/lib/schemas";
import { callAI, callTranscription, type AiResult } from "@/lib/ai/providers";
import { ORAL_EVALUATION_DEFAULT } from "@/lib/ai/prompts";
import type { OralSubmission } from "@/lib/student/queries";
import type { OralCombination } from "@/lib/admin/types";

// STT (transcription) + LLM scoring are chained sequentially per task rather than a single
// AI call, so the per-task pipeline runs long than the combination route's single-stage calls.
// A failed task is retried once in-process (see below), so the worst case is ~2x a single pass.
export const maxDuration = 180;

const AUDIO_BUCKET = "oral-recordings";

type TaskNumber = 1 | 2 | 3;

const TASK_META: Record<
  TaskNumber,
  { key: "tache_1" | "tache_2" | "tache_3"; label: string; jsonKey: string; maxScore: number }
> = {
  1: { key: "tache_1", label: "TÂCHE 1", jsonKey: "task_1_evaluation", maxScore: 4 },
  2: { key: "tache_2", label: "TÂCHE 2", jsonKey: "task_2_evaluation", maxScore: 7 },
  3: { key: "tache_3", label: "TÂCHE 3", jsonKey: "task_3_evaluation", maxScore: 9 },
};

function audioPathForTask(sub: OralSubmission, taskNumber: TaskNumber): string | null {
  if (taskNumber === 1) return sub.audio_path_task_1;
  if (taskNumber === 2) return sub.audio_path_task_2;
  return sub.audio_path_task_3;
}

// Official Objectif 4C2 structure checklist per task, used to ground the
// "respect_de_methodologie" scoring criterion — without this, the model has no
// concrete definition of "correct structure" for each task type and falls back
// to a vague, generic impression instead of checking specific required elements.
const TASK_METHODOLOGY_CHECKLIST: Record<TaskNumber, string> = {
  1: `- Identité : nom, prénom, âge, situation matrimoniale et famille, nationalité, région d'origine
- Langues parlées
- Adresse : ville de résidence et quartier
- Parcours académique et professionnel
- Traits de personnalité
- Loisirs
- Projets (y compris, le cas échéant, le lien avec l'immigration/retour au pays d'origine)
- Formule de clôture (ex : "Merci")`,
  2: `- Salutation adaptée au registre demandé par le sujet (formel ou informel selon l'interlocuteur précisé)
- Introduction adéquate en lien avec le sujet
- Environ 12 questions pertinentes, couvrant les éléments mis en exergue entre parenthèses dans le sujet
- Remerciement courtois pour les informations obtenues
- Formule de politesse pour conclure (ex : "Au plaisir de vous revoir")`,
  3: `- Introduction structurée selon la méthodologie classique de l'argumentation
- Prise de position claire sur le sujet
- Au moins 2 arguments développés, chacun illustré par un exemple concret
- Conclusion : synthèse de la position, et si possible ouverture du débat`,
};

function buildTaskUserPrompt(
  taskNumber: TaskNumber,
  combination: OralCombination,
  transcript: string
): string {
  const meta = TASK_META[taskNumber];
  const task = combination.tasks[meta.key];

  return `Évalue UNIQUEMENT la Tâche ${taskNumber} du candidat, pour l'examen oral : ${combination.title} (${combination.exam_type} Canada).

- Consigne : "${task.question}"
- Temps de préparation accordé : ${task.prepTimeSeconds} secondes
- Temps de parole accordé : ${task.speakingTimeSeconds} secondes
- Barème de cette tâche : notée sur ${meta.maxScore} points (le score global sur 20 est la somme des 3 tâches, pas une moyenne)
- Transcription de la réponse orale du candidat (obtenue par reconnaissance vocale automatique, à prendre telle quelle) : "${transcript}"

GRILLE DE STRUCTURE ATTENDUE pour la Tâche ${taskNumber} (sers-t'en pour renseigner "respect_de_methodologie" — vérifie chaque élément un par un) :
${TASK_METHODOLOGY_CHECKLIST[taskNumber]}

IMPORTANT : reprends la transcription ci-dessus mot pour mot dans le champ "transcript" — ne la reformule jamais et ne la corrige jamais.

IMPORTANT : ignore les 2 autres tâches. Retourne uniquement du JSON minifié valide de la forme {"${meta.jsonKey}": { ... }}, avec exactement les champs définis dans OUTPUT SCHEMA pour cette clé. Aucun texte, aucune autre clé.`;
}

interface TaskEvalResult {
  taskNumber: TaskNumber;
  transcriptionResult: { provider: string; model: string; durationMs: number };
  aiResult: AiResult;
  data: OralTaskEval;
}

/**
 * Synthetic zero-score result for a task the student never recorded (e.g. the
 * global attempt timer ran out before they got to it). No STT/LLM call is made —
 * an unrecorded task has nothing to transcribe or score.
 */
function missingTaskResult(taskNumber: TaskNumber, combination: OralCombination): OralTaskEval {
  const meta = TASK_META[taskNumber];
  const task = combination.tasks[meta.key];
  return {
    score: `0/${meta.maxScore}`,
    consigne: task.question,
    transcript: "",
    comprehension_du_sujet: "Non évalué : tâche non enregistrée.",
    respect_de_methodologie: "Non évalué : tâche non enregistrée.",
    niveau_linguistique: "Non évalué : tâche non enregistrée.",
    fluidite: "Non évalué : tâche non enregistrée.",
    prononciation_et_intonation: "Non évalué : tâche non enregistrée.",
    appreciation_generale: "Cette tâche n'a pas été enregistrée avant la fin du temps imparti.",
    pertinence_verdict: "",
    points_forts: [],
    priorites_a_travailler: ["Enregistrer une réponse pour cette tâche lors d'une prochaine tentative."],
    erreurs_recurrentes: [],
    registre_et_tonalite: "",
    connecteurs_logiques: { utilises: [], manquants: [] },
    exercice_recommande: "",
    comparaison_niveau_vise: "",
  };
}

/**
 * Synthetic zero-score result for a task whose audio was recorded and uploaded but
 * transcribed to nothing — a silent/inaudible take (mic muted, student never spoke,
 * recording stopped instantly). Distinct from missingTaskResult so the student can
 * tell "you didn't record this" apart from "we got your file but heard nothing".
 *
 * Deliberately NOT an error: a single inaudible take used to throw, exhaust the
 * retry pass, and abort the whole submission — costing the student their other
 * (perfectly good) tasks and their quota. Scoring just this task zero lets the rest
 * of the evaluation complete and reach them.
 */
function emptyTranscriptResult(taskNumber: TaskNumber, combination: OralCombination): OralTaskEval {
  const meta = TASK_META[taskNumber];
  const task = combination.tasks[meta.key];
  const notice = "Non évalué : aucun son exploitable détecté dans l'enregistrement.";
  return {
    score: `0/${meta.maxScore}`,
    consigne: task.question,
    transcript: "",
    comprehension_du_sujet: notice,
    respect_de_methodologie: notice,
    niveau_linguistique: notice,
    fluidite: notice,
    prononciation_et_intonation: notice,
    appreciation_generale:
      "Votre enregistrement a bien été reçu, mais aucune parole n'a pu y être détectée. " +
      "Vérifiez que votre microphone est activé et audible, puis refaites cette tâche lors d'une prochaine tentative.",
    pertinence_verdict: "",
    points_forts: [],
    priorites_a_travailler: [
      "Vérifier le micro (autorisation du navigateur, volume, micro non coupé) avant de démarrer.",
      "Après l'enregistrement, réécouter l'extrait proposé pour confirmer que votre voix est audible.",
    ],
    erreurs_recurrentes: [],
    registre_et_tonalite: "",
    connecteurs_logiques: { utilises: [], manquants: [] },
    exercice_recommande: "",
    comparaison_niveau_vise: "",
  };
}

async function evaluateTask(
  taskNumber: TaskNumber,
  systemPrompt: string,
  combination: OralCombination,
  sub: OralSubmission,
  adminClient: ReturnType<typeof createSupabaseAdminClient>
): Promise<TaskEvalResult> {
  const audioPath = audioPathForTask(sub, taskNumber);
  if (!audioPath) {
    throw new Error(`task_${taskNumber}_audio_missing`);
  }

  const { data: audioBlob, error: downloadError } = await adminClient.storage
    .from(AUDIO_BUCKET)
    .download(audioPath);

  if (downloadError || !audioBlob) {
    console.error(`[evaluate] task ${taskNumber} audio download failed:`, downloadError);
    throw new Error(`task_${taskNumber}_audio_download_failed`);
  }

  const filename = audioPath.split("/").pop() ?? `task_${taskNumber}.webm`;
  const transcription = await callTranscription(audioBlob, filename);
  const transcript = transcription.text.trim();

  // A silent take transcribes to "" deterministically (HTTP 200, empty text), so
  // retrying it would just burn another STT call for the same empty answer — score
  // it zero here and let the other tasks finish instead of failing the submission.
  if (transcript.length === 0) {
    console.warn(
      `[evaluate-oral] task ${taskNumber} produced an empty transcript — scoring 0`,
      { submissionId: sub.id, audioPath, audioBytes: audioBlob.size }
    );
    return {
      taskNumber,
      transcriptionResult: {
        provider: transcription.provider,
        model: transcription.model,
        durationMs: transcription.durationMs,
      },
      // No LLM call is made — there is nothing to score.
      aiResult: { provider: "none", model: "none", durationMs: 0, text: "" },
      data: emptyTranscriptResult(taskNumber, combination),
    };
  }

  const userPrompt = buildTaskUserPrompt(taskNumber, combination, transcript);
  const jsonKey = TASK_META[taskNumber].jsonKey;
  const aiResult = await callAI(systemPrompt, userPrompt, buildOralTaskJsonSchema(jsonKey));

  const jsonMatch = aiResult.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`task_${taskNumber}_parse_failed`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error(`task_${taskNumber}_parse_failed`);
  }

  const parsedObj = parsed as Record<string, unknown>;
  // Accept either {"task_N_evaluation": {...}} (requested shape) or a flat object (model variance).
  const inner = jsonKey in parsedObj ? parsedObj[jsonKey] : parsed;

  const validated = OralTaskEvalSchema.safeParse(inner);
  if (!validated.success) {
    console.error(`[evaluate-oral] task ${taskNumber} schema mismatch:`, validated.error.issues, {
      provider: aiResult.provider,
      model: aiResult.model,
      responseKeys: Object.keys(parsedObj),
      responseLength: aiResult.text.length,
    });
    throw new Error(`task_${taskNumber}_schema_mismatch`);
  }

  // The transcript is produced by STT, not the LLM — trust the actual STT output over
  // whatever the model echoed back, in case it paraphrased despite the instruction not to.
  const data: OralTaskEval = { ...validated.data, transcript };

  return {
    taskNumber,
    transcriptionResult: {
      provider: transcription.provider,
      model: transcription.model,
      durationMs: transcription.durationMs,
    },
    aiResult,
    data,
  };
}

function parseTaskScore(scoreStr: string): number {
  const n = parseFloat(scoreStr.replace(/\/\d+/, "").trim());
  return isNaN(n) ? 0 : n;
}

function resolveCefr(score: number): { cefrLevel: string; appreciation: string } {
  if (score >= 18.0) return { cefrLevel: "C2", appreciation: "Atteint" };
  if (score >= 16.0) return { cefrLevel: "C1+", appreciation: "Atteint" };
  if (score >= 14.0) return { cefrLevel: "C1", appreciation: "Atteint" };
  if (score >= 12.0) return { cefrLevel: "B2+", appreciation: "Non Atteint" };
  if (score >= 10.0) return { cefrLevel: "B2", appreciation: "Non Atteint" };
  if (score >= 7.0) return { cefrLevel: "B1+", appreciation: "Non Atteint" };
  if (score >= 6.0) return { cefrLevel: "B1", appreciation: "Non Atteint" };
  return { cefrLevel: "A2", appreciation: "Non Atteint" };
}

async function logAiApiCalls(
  results: PromiseSettledResult<TaskEvalResult>[],
  failedTaskNumbers: TaskNumber[]
): Promise<void> {
  const adminClient = createSupabaseAdminClient();
  const rows: Array<{
    submission_type: string;
    provider: string;
    model: string;
    success: boolean;
    duration_ms?: number;
  }> = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      rows.push({
        submission_type: "oral",
        provider: result.value.transcriptionResult.provider,
        model: result.value.transcriptionResult.model,
        success: true,
        duration_ms: result.value.transcriptionResult.durationMs,
      });
      // Provider "none" marks a stage that was deliberately skipped (e.g. no LLM
      // scoring call for an inaudible take) — not a real API call to bill or chart.
      if (result.value.aiResult.provider !== "none") {
        rows.push({
          submission_type: "oral",
          provider: result.value.aiResult.provider,
          model: result.value.aiResult.model,
          success: true,
          duration_ms: result.value.aiResult.durationMs,
        });
      }
    }
  }

  for (const _taskNumber of failedTaskNumbers) {
    rows.push({
      submission_type: "oral",
      provider: "unknown",
      model: "unknown",
      success: false,
    });
  }

  if (rows.length === 0) return;

  try {
    const { error } = await adminClient.from("ai_api_calls").insert(rows);
    if (error) console.error("[evaluate-oral] ai_api_calls insert failed:", error);
  } catch (err) {
    console.error("[evaluate-oral] ai_api_calls insert failed:", err);
  }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { submissionId } = await params;

  const { data: rawSub } = await supabase
    .from("oral_submissions")
    .select("*")
    .eq("id", submissionId)
    .eq("user_id", user.id)
    .single();

  if (!rawSub) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const sub = rawSub as OralSubmission;

  if (!sub.is_completed) {
    return NextResponse.json({ error: "submission_not_locked" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("oral_evaluations")
    .select("id")
    .eq("submission_id", submissionId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "already_evaluated" }, { status: 409 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("ai_corrections_enabled")
    .eq("id", user.id)
    .single();

  if (!profile?.ai_corrections_enabled) {
    return NextResponse.json({ error: "ai_corrections_disabled" }, { status: 403 });
  }

  const { data: rawCombination } = await supabase
    .from("oral_combinations")
    .select("*")
    .eq("id", sub.oral_combination_id)
    .single();

  if (!rawCombination) {
    return NextResponse.json({ error: "combination_not_found" }, { status: 404 });
  }

  const combination = rawCombination as OralCombination;

  const adminClient = createSupabaseAdminClient();

  // Fetch prompt from DB (admin-editable, single shared prompt), fall back to hardcoded default.
  const { data: promptRow } = await adminClient
    .from("ai_prompts")
    .select("prompt_text")
    .eq("prompt_key", "oral_evaluation")
    .maybeSingle();
  const systemPrompt = promptRow?.prompt_text ?? ORAL_EVALUATION_DEFAULT;

  // Mark pipeline as processing before kicking off the STT+scoring pipeline.
  await supabase
    .from("oral_submissions")
    .update({ pipeline_status: "processing" })
    .eq("id", submissionId);

  const allTaskNumbers: TaskNumber[] = [1, 2, 3];
  const missingTaskNumbers = allTaskNumbers.filter((n) => !audioPathForTask(sub, n));
  const taskNumbers = allTaskNumbers.filter((n) => audioPathForTask(sub, n));

  const runAll = (numbers: TaskNumber[]) =>
    Promise.allSettled(
      numbers.map((n) => evaluateTask(n, systemPrompt, combination, sub, adminClient))
    );

  const firstPass = await runAll(taskNumbers);

  const firstFailedNumbers = taskNumbers.filter(
    (_, idx) => firstPass[idx].status === "rejected"
  );

  const finalResults: Map<TaskNumber, TaskEvalResult> = new Map();
  for (let i = 0; i < taskNumbers.length; i++) {
    const r = firstPass[i];
    if (r.status === "fulfilled") {
      finalResults.set(taskNumbers[i], r.value);
    }
  }

  // Unrecorded tasks (attempt timed out before the student got to them) are
  // scored zero directly — no STT/LLM call, no retry, nothing to log.
  for (const n of missingTaskNumbers) {
    finalResults.set(n, {
      taskNumber: n,
      transcriptionResult: { provider: "none", model: "none", durationMs: 0 },
      aiResult: { provider: "none", model: "none", durationMs: 0, text: "" },
      data: missingTaskResult(n, combination),
    });
  }

  let secondPass: PromiseSettledResult<TaskEvalResult>[] = [];
  const stillFailedNumbers: TaskNumber[] = [];
  const stillFailedMessages: string[] = [];

  if (firstFailedNumbers.length > 0) {
    // Mark failed while we retry — auto-retry re-uses the already-stored audio, no additional
    // quota charge (verify_and_consume_quota already ran when the submission was created).
    await supabase
      .from("oral_submissions")
      .update({ pipeline_status: "failed" })
      .eq("id", submissionId);

    console.error("[evaluate-oral] initial pass failed for tasks:", firstFailedNumbers, {
      submissionId,
    });

    secondPass = await runAll(firstFailedNumbers);

    for (let i = 0; i < firstFailedNumbers.length; i++) {
      const r = secondPass[i];
      if (r.status === "fulfilled") {
        finalResults.set(firstFailedNumbers[i], r.value);
      } else {
        stillFailedNumbers.push(firstFailedNumbers[i]);
        stillFailedMessages.push(
          r.reason instanceof Error ? r.reason.message : String(r.reason)
        );
      }
    }
  }

  // Log every AI call made across both passes (transcription + scoring per successful task,
  // one failure marker per task that never succeeded).
  await logAiApiCalls([...firstPass, ...secondPass], stillFailedNumbers);

  if (stillFailedNumbers.length > 0) {
    console.error("[evaluate-oral] retry exhausted for tasks:", stillFailedNumbers, {
      submissionId,
      messages: stillFailedMessages,
    });
    // pipeline_status stays "failed" (set above); is_completed is left untouched so the
    // stored audio remains available for a future manual retry of this same endpoint.
    const notConfigured = stillFailedMessages.some(
      (m) => m === "no_ai_provider_configured" || m === "openai_key_not_configured"
    );
    if (notConfigured) {
      return NextResponse.json({ error: "ai_not_configured" }, { status: 503 });
    }
    const anySchemaOrParse = stillFailedMessages.some(
      (m) => m.includes("_schema_mismatch") || m.includes("_parse_failed")
    );
    return NextResponse.json(
      {
        error: anySchemaOrParse ? "ai_schema_mismatch" : "ai_request_failed",
        detail: stillFailedMessages,
      },
      { status: 502 }
    );
  }

  const task1 = finalResults.get(1) as TaskEvalResult;
  const task2 = finalResults.get(2) as TaskEvalResult;
  const task3 = finalResults.get(3) as TaskEvalResult;

  // Each task is scored on its own barème (Tâche 1 = /4, Tâche 2 = /7, Tâche 3 = /9), summing
  // to 20 — the global score is the straight sum, not an average.
  const scoreNum =
    Math.round(
      (parseTaskScore(task1.data.score) +
        parseTaskScore(task2.data.score) +
        parseTaskScore(task3.data.score)) *
        10
    ) / 10;

  const { cefrLevel, appreciation } = resolveCefr(scoreNum);

  const { data: evaluation, error: evalError } = await adminClient
    .from("oral_evaluations")
    .insert({
      submission_id: submissionId,
      global_score: scoreNum,
      cefr_level: cefrLevel,
      appreciation: appreciation,
      task_1_evaluation: task1.data,
      task_2_evaluation: task2.data,
      task_3_evaluation: task3.data,
      transcript_task_1: task1.data.transcript,
      transcript_task_2: task2.data.transcript,
      transcript_task_3: task3.data.transcript,
    })
    .select()
    .single();

  if (evalError || !evaluation) {
    console.error("[evaluate-oral] DB insert failed:", evalError);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  await adminClient
    .from("oral_submissions")
    .update({ pipeline_status: "completed", completed_at: new Date().toISOString() })
    .eq("id", submissionId);

  return NextResponse.json({ ok: true, evaluationId: evaluation.id });
}
