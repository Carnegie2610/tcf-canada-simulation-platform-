import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { CombinationTaskEvalSchema } from "@/lib/schemas";
import { callAI } from "@/lib/ai/providers";
import {
  TACHE_1_EVALUATION_DEFAULT,
  TACHE_2_EVALUATION_DEFAULT,
  TACHE_3_EVALUATION_DEFAULT,
} from "@/lib/ai/prompts";
import type { Combination, CombinationSubmission } from "@/lib/admin/types";

export const maxDuration = 120;

const CEFR_BANDS: { min: number; max: number; niveau_cecr: string; appreciation: string }[] = [
  { min: 18.0, max: 20.0, niveau_cecr: "C2",  appreciation: "Atteint" },
  { min: 16.0, max: 18.0, niveau_cecr: "C1+", appreciation: "Atteint" },
  { min: 14.0, max: 16.0, niveau_cecr: "C1",  appreciation: "Atteint" },
  { min: 12.0, max: 14.0, niveau_cecr: "B2+", appreciation: "Non Atteint" },
  { min: 10.0, max: 12.0, niveau_cecr: "B2",  appreciation: "Non Atteint" },
  { min: 7.0,  max: 10.0, niveau_cecr: "B1+", appreciation: "Non Atteint" },
  { min: 6.0,  max:  7.0, niveau_cecr: "B1",  appreciation: "Non Atteint" },
  { min: 0,    max:  6.0, niveau_cecr: "A2",  appreciation: "Non Atteint" },
];

function mapCefr(score: number): { niveau_cecr: string; appreciation: string } {
  for (const band of CEFR_BANDS) {
    if (score >= band.min && score <= band.max) return band;
  }
  return { niveau_cecr: "A2", appreciation: "Non Atteint" };
}

function parseScore(scoreStr: string): number {
  const num = parseFloat(scoreStr.split("/")[0].trim());
  return isNaN(num) ? 0 : num;
}

function buildTaskUserPrompt(
  taskLabel: string,
  taskData: { minWords: number; maxWords: number; question: string },
  draft: string
): string {
  return `Please evaluate the following candidate's written production for ${taskLabel}. Return only the structured JSON output as instructed.

- Word Constraints: ${taskData.minWords} words minimum / ${taskData.maxWords} words maximum
- Prompt Question:
"${taskData.question}"
- Candidate's Submitted Text:
"${draft}"

Output only raw, minified JSON matching the required schema.`;
}

async function fetchPrompt(promptKey: string, fallback: string): Promise<string> {
  const adminClient = createSupabaseAdminClient();
  const { data } = await adminClient
    .from("ai_prompts")
    .select("prompt_text")
    .eq("prompt_key", promptKey)
    .maybeSingle();
  return data?.prompt_text ?? fallback;
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
  const t1 = combination.tasks.tache_1;
  const t2 = combination.tasks.tache_2;
  const t3 = combination.tasks.tache_3;

  // Fetch all 3 prompts and build user prompts in parallel
  const [prompt1, prompt2, prompt3] = await Promise.all([
    fetchPrompt("tache_1_evaluation", TACHE_1_EVALUATION_DEFAULT),
    fetchPrompt("tache_2_evaluation", TACHE_2_EVALUATION_DEFAULT),
    fetchPrompt("tache_3_evaluation", TACHE_3_EVALUATION_DEFAULT),
  ]);

  const userPrompt1 = buildTaskUserPrompt("TÂCHE 1 (MESSAGE)", t1, sub.draft_task_1);
  const userPrompt2 = buildTaskUserPrompt("TÂCHE 2 (RÉDACTION)", t2, sub.draft_task_2);
  const userPrompt3 = buildTaskUserPrompt("TÂCHE 3 (RÉDACTION)", t3, sub.draft_task_3);

  // Call AI for all 3 tasks in parallel
  let aiResults: Awaited<ReturnType<typeof callAI>>[];
  try {
    aiResults = await Promise.all([
      callAI(prompt1, userPrompt1),
      callAI(prompt2, userPrompt2),
      callAI(prompt3, userPrompt3),
    ]);
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

  // Parse and validate each task result
  const taskResults = [];
  for (const aiResult of aiResults) {
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
    const validated = CombinationTaskEvalSchema.safeParse(parsed);
    if (!validated.success) {
      return NextResponse.json({ error: "ai_schema_mismatch" }, { status: 502 });
    }
    taskResults.push(validated.data);
  }

  const [task1Eval, task2Eval, task3Eval] = taskResults;

  // Compute global score and CEFR
  const score1 = parseScore(task1Eval.score);
  const score2 = parseScore(task2Eval.score);
  const score3 = parseScore(task3Eval.score);
  const globalScore = Math.round((score1 + score2 + score3) * 10) / 10;
  const { niveau_cecr, appreciation } = mapCefr(globalScore);

  // Log AI usage for all 3 calls
  void Promise.all(
    aiResults.map((r) =>
      createSupabaseAdminClient()
        .from("ai_api_calls")
        .insert({
          submission_type: "combination",
          provider: r.provider,
          model: r.model,
          success: true,
          duration_ms: r.durationMs,
        })
    )
  ).catch(console.error);

  const adminSupabase = createSupabaseAdminClient();
  const { data: evaluation, error: evalError } = await adminSupabase
    .from("combination_evaluations")
    .insert({
      submission_id: submissionId,
      global_score: globalScore,
      cefr_level: niveau_cecr,
      appreciation,
      task_1_evaluation: task1Eval,
      task_2_evaluation: task2Eval,
      task_3_evaluation: task3Eval,
    })
    .select()
    .single();

  if (evalError || !evaluation) {
    console.error("[evaluate] DB insert failed:", evalError);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, evaluationId: evaluation.id });
}
