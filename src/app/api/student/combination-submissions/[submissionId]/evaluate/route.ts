import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { CombinationTaskEvalSchema, type CombinationTaskEval } from "@/lib/schemas";
import { callAI, type AiResult } from "@/lib/ai/providers";
import { COMBINATION_EVALUATION_DEFAULT } from "@/lib/ai/prompts";
import type { Combination, CombinationSubmission } from "@/lib/admin/types";

export const maxDuration = 120;

type TaskNumber = 1 | 2 | 3;

const TASK_META: Record<
  TaskNumber,
  { key: "tache_1" | "tache_2" | "tache_3"; label: string; jsonKey: string }
> = {
  1: { key: "tache_1", label: "MESSAGE", jsonKey: "task_1_evaluation" },
  2: { key: "tache_2", label: "RÉDACTION BLOG", jsonKey: "task_2_evaluation" },
  3: { key: "tache_3", label: "RÉDACTION ARGUMENTATION", jsonKey: "task_3_evaluation" },
};

function draftForTask(sub: CombinationSubmission, taskNumber: TaskNumber): string {
  if (taskNumber === 1) return sub.draft_task_1;
  if (taskNumber === 2) return sub.draft_task_2;
  return sub.draft_task_3;
}

function buildTaskUserPrompt(
  taskNumber: TaskNumber,
  combination: Combination,
  sub: CombinationSubmission
): string {
  const meta = TASK_META[taskNumber];
  const task = combination.tasks[meta.key];
  const draft = draftForTask(sub, taskNumber);

  return `Évalue UNIQUEMENT la Tâche ${taskNumber} — ${meta.label} du candidat, pour l'examen : ${combination.title} (${combination.exam_type} Canada).

- Contraintes : ${task.minWords} mots minimum / ${task.maxWords} mots maximum
- Consigne : "${task.question}"
- Texte soumis : "${draft}"

IMPORTANT : ignore les 2 autres tâches et les métriques globales (global_metrics) décrites dans le prompt système — elles ne s'appliquent pas à cet appel. Retourne uniquement du JSON minifié valide de la forme {"${meta.jsonKey}": { ... }}, avec exactement les champs définis dans OUTPUT SCHEMA pour cette clé. Aucun texte, aucune autre clé.`;
}

interface TaskEvalResult {
  taskNumber: TaskNumber;
  aiResult: AiResult;
  data: CombinationTaskEval;
}

async function evaluateTask(
  taskNumber: TaskNumber,
  systemPrompt: string,
  combination: Combination,
  sub: CombinationSubmission
): Promise<TaskEvalResult> {
  const userPrompt = buildTaskUserPrompt(taskNumber, combination, sub);
  const aiResult = await callAI(systemPrompt, userPrompt);

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
  const jsonKey = TASK_META[taskNumber].jsonKey;
  // Accept either {"task_N_evaluation": {...}} (requested shape) or a flat object (model variance).
  const inner = jsonKey in parsedObj ? parsedObj[jsonKey] : parsed;

  const validated = CombinationTaskEvalSchema.safeParse(inner);
  if (!validated.success) {
    console.error(`[evaluate] task ${taskNumber} schema mismatch:`, validated.error.issues, {
      provider: aiResult.provider,
      model: aiResult.model,
      responseKeys: Object.keys(parsedObj),
      responseLength: aiResult.text.length,
    });
    throw new Error(`task_${taskNumber}_schema_mismatch`);
  }

  return { taskNumber, aiResult, data: validated.data };
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

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { submissionId } = await params;

  const { data: rawSub } = await supabase
    .from("combination_submissions")
    .select("*")
    .eq("id", submissionId)
    .eq("user_id", user.id)
    .single();

  if (!rawSub) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const sub = rawSub as CombinationSubmission;

  if (!sub.is_completed) {
    return NextResponse.json({ error: "submission_not_locked" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("combination_evaluations")
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
    .from("combinations")
    .select("*")
    .eq("id", sub.combination_id)
    .single();

  if (!rawCombination) {
    return NextResponse.json({ error: "combination_not_found" }, { status: 404 });
  }

  const combination = rawCombination as Combination;

  // Fetch prompt from DB (admin-editable, single shared prompt), fall back to hardcoded default.
  // Shared across all 3 per-task calls below — the user prompt tells the model which task to focus on.
  const adminClient = createSupabaseAdminClient();
  const { data: promptRow } = await adminClient
    .from("ai_prompts")
    .select("prompt_text")
    .eq("prompt_key", "combination_evaluation")
    .maybeSingle();
  const systemPrompt = promptRow?.prompt_text ?? COMBINATION_EVALUATION_DEFAULT;

  const settled = await Promise.allSettled([
    evaluateTask(1, systemPrompt, combination, sub),
    evaluateTask(2, systemPrompt, combination, sub),
    evaluateTask(3, systemPrompt, combination, sub),
  ]);

  // Log one ai_api_calls row per task-level AI call (there are now 3 real provider calls per submission).
  for (const result of settled) {
    if (result.status === "fulfilled") {
      void Promise.resolve(
        createSupabaseAdminClient()
          .from("ai_api_calls")
          .insert({
            submission_type: "combination",
            provider: result.value.aiResult.provider,
            model: result.value.aiResult.model,
            success: true,
            duration_ms: result.value.aiResult.durationMs,
          })
      ).catch(console.error);
    } else {
      void Promise.resolve(
        createSupabaseAdminClient()
          .from("ai_api_calls")
          .insert({
            submission_type: "combination",
            provider: "unknown",
            model: "unknown",
            success: false,
          })
      ).catch(console.error);
    }
  }

  const failed = settled.filter(
    (r): r is PromiseRejectedResult => r.status === "rejected"
  );

  if (failed.length > 0) {
    const messages = failed.map((f) =>
      f.reason instanceof Error ? f.reason.message : String(f.reason)
    );
    console.error("[evaluate] one or more task evaluations failed:", messages, { submissionId });
    const notConfigured = messages.some((m) => m === "no_ai_provider_configured");
    if (notConfigured) {
      return NextResponse.json({ error: "ai_not_configured" }, { status: 503 });
    }
    const anySchemaOrParse = messages.some(
      (m) => m.includes("_schema_mismatch") || m.includes("_parse_failed")
    );
    return NextResponse.json(
      { error: anySchemaOrParse ? "ai_schema_mismatch" : "ai_request_failed", detail: messages },
      { status: 502 }
    );
  }

  const fulfilled = settled as PromiseFulfilledResult<TaskEvalResult>[];
  const byTask = new Map(fulfilled.map((f) => [f.value.taskNumber, f.value.data]));
  const task1 = byTask.get(1) as CombinationTaskEval;
  const task2 = byTask.get(2) as CombinationTaskEval;
  const task3 = byTask.get(3) as CombinationTaskEval;

  const scoreNum =
    Math.round(
      (parseTaskScore(task1.score) + parseTaskScore(task2.score) + parseTaskScore(task3.score)) * 10
    ) / 10;

  const { cefrLevel, appreciation } = resolveCefr(scoreNum);

  const { data: evaluation, error: evalError } = await createSupabaseAdminClient()
    .from("combination_evaluations")
    .insert({
      submission_id: submissionId,
      global_score: scoreNum,
      cefr_level: cefrLevel,
      appreciation: appreciation,
      task_1_evaluation: task1,
      task_2_evaluation: task2,
      task_3_evaluation: task3,
    })
    .select()
    .single();

  if (evalError || !evaluation) {
    console.error("[evaluate] DB insert failed:", evalError);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, evaluationId: evaluation.id });
}
