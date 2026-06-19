import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { CombinationEvaluationSchema } from "@/lib/schemas";
import { callAI } from "@/lib/ai/providers";
import { COMBINATION_EVALUATION_DEFAULT } from "@/lib/ai/prompts";
import type { Combination, CombinationSubmission } from "@/lib/admin/types";

export const maxDuration = 120;

function buildUserPrompt(combination: Combination, sub: CombinationSubmission): string {
  const t1 = combination.tasks.tache_1;
  const t2 = combination.tasks.tache_2;
  const t3 = combination.tasks.tache_3;

  return `Évalue la production écrite suivante du candidat pour les 3 tâches. Analyse chaque tâche selon les règles du système et retourne l'objet JSON structuré.

---
### EXAMEN : ${combination.title} (${combination.exam_type} Canada)

#### TÂCHE 1 — MESSAGE
- Contraintes : ${t1.minWords} mots minimum / ${t1.maxWords} mots maximum
- Consigne : "${t1.question}"
- Texte soumis : "${sub.draft_task_1}"

---
#### TÂCHE 2 — RÉDACTION BLOG
- Contraintes : ${t2.minWords} mots minimum / ${t2.maxWords} mots maximum
- Consigne : "${t2.question}"
- Texte soumis : "${sub.draft_task_2}"

---
#### TÂCHE 3 — RÉDACTION ARGUMENTATION
- Contraintes : ${t3.minWords} mots minimum / ${t3.maxWords} mots maximum
- Consigne : "${t3.question}"
- Texte soumis : "${sub.draft_task_3}"

---
Retourne uniquement du JSON minifié valide couvrant les 3 évaluations et les métriques globales.`;
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

  // Fetch prompt from DB, fall back to hardcoded default
  const adminClient = createSupabaseAdminClient();
  const { data: promptRow } = await adminClient
    .from("ai_prompts")
    .select("prompt_text")
    .eq("prompt_key", "combination_evaluation")
    .maybeSingle();
  const systemPrompt = promptRow?.prompt_text ?? COMBINATION_EVALUATION_DEFAULT;

  const userPrompt = buildUserPrompt(combination, sub);

  let aiResult: import("@/lib/ai/providers").AiResult;
  try {
    aiResult = await callAI(systemPrompt, userPrompt);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("[evaluate] AI call failed:", msg, {
      provider: process.env.ACTIVE_AI_PROVIDER ?? "auto",
      submissionId,
    });
    void Promise.resolve(
      createSupabaseAdminClient()
        .from("ai_api_calls")
        .insert({ submission_type: "combination", provider: "unknown", model: "unknown", success: false })
    ).catch(console.error);
    if (msg === "no_ai_provider_configured") {
      return NextResponse.json({ error: "ai_not_configured" }, { status: 503 });
    }
    return NextResponse.json({ error: "ai_request_failed", detail: msg }, { status: 502 });
  }

  const jsonMatch = aiResult.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: "ai_parse_failed" }, { status: 502 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    return NextResponse.json({ error: "ai_parse_failed" }, { status: 502 });
  }

  const validated = CombinationEvaluationSchema.safeParse(parsed);
  if (!validated.success) {
    console.error("[evaluate] schema mismatch:", validated.error.issues);
    return NextResponse.json({ error: "ai_schema_mismatch" }, { status: 502 });
  }

  const report = validated.data;
  const scoreNum = parseFloat(report.global_metrics.score_final.replace("/20", "").trim());

  void Promise.resolve(
    createSupabaseAdminClient()
      .from("ai_api_calls")
      .insert({
        submission_type: "combination",
        provider: aiResult.provider,
        model: aiResult.model,
        success: true,
        duration_ms: aiResult.durationMs,
      })
  ).catch(console.error);

  const { data: evaluation, error: evalError } = await createSupabaseAdminClient()
    .from("combination_evaluations")
    .insert({
      submission_id: submissionId,
      global_score: isNaN(scoreNum) ? 0 : scoreNum,
      cefr_level: report.global_metrics.niveau_cecr,
      appreciation: report.global_metrics.appreciation,
      task_1_evaluation: report.task_1_evaluation,
      task_2_evaluation: report.task_2_evaluation,
      task_3_evaluation: report.task_3_evaluation,
    })
    .select()
    .single();

  if (evalError || !evaluation) {
    console.error("[evaluate] DB insert failed:", evalError);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, evaluationId: evaluation.id });
}
