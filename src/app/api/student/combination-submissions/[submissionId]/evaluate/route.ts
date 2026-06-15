import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { CombinationEvaluationSchema } from "@/lib/schemas";
import { callAI } from "@/lib/ai/providers";
import type { Combination, CombinationSubmission } from "@/lib/admin/types";

export const maxDuration = 120;

const SYSTEM_PROMPT = `You are the Lead Senior Examiner for the TCF Canada writing module at OBJECTIF 4C2. Your role is to evaluate student drafts with extreme rigor, consistency, and professional accuracy.

### STRICT EVALUATION RULES & GRADING METRICS
You must grade the submitted exam across three distinct tasks. Do not deviate from these strict score allocations:
1. Tâche 1 (Courriel amical): Graded strictly out of 4 points. Maximum possible score is 4.0.
2. Tâche 2 (Article de Blog): Graded strictly out of 7 points. Maximum possible score is 7.0.
3. Tâche 3 (Synthèse & Argumentation): Graded strictly out of 9 points. Maximum possible score is 9.0.

The Global Score (score_final) is the absolute mathematical sum of the three tasks:
Global Score = Score_Tâche1 + Score_Tâche2 + Score_Tâche3 (e.g., 1.8 + 2.1 + 4.95 = 8.85, rounded to 8.8/20).

### CEFR & APPRECIATION MAPPING MATRIX
Based on the Global Score out of 20, assign the overall CEFR level and qualitative appreciation tag strictly according to this matrix:
- Score >= 18.0: level "C2", appreciation "Excellent"
- 15.0 <= Score < 18.0: level "C1", appreciation "Excellent"
- 12.0 <= Score < 15.0: level "B2", appreciation "Suffisant"
- 9.0 <= Score < 12.0: level "B1", appreciation "Moyen"
- 6.0 <= Score < 9.0: level "A2", appreciation "Insuffisant"
- Score < 6.0: level "A1", appreciation "Insuffisant"

### REQUIRED TASKS PARADIGM
For each of the three tasks, you must analyze and output these exact fields:
- "score": A string representation of the grade earned out of the task's maximum limit (e.g., "1.8/4", "2.1/7", "4.95/9").
- "consigne": The exact prompt instructions of the task.
- "votre_texte": The verbatim draft written by the student.
- "comprehension_du_sujet": Analyze whether the student understood the prompt's context or went off-topic.
- "respect_de_methodologie": Evaluate structural rules (e.g., salutations, word counts, paragraph distribution, connectivity).
- "niveau_linguistique": Review syntactic maturity, vocabulary richness, and grammar level suitability.
- "appreciation_generale": Summarize strengths and constructive advice.
- "correction_orthographique": An array of spelling, grammar, or preposition errors. For each error, provide:
  * "erreur": The exact erroneous string from the student text.
  * "correction": The corrected word or phrase.
  * "type": The error category (e.g., "accord", "préposition", "conjugaison", "orthographe").
  * "explication": A brief, professional grammatical explanation of why it was wrong and how to fix it.
  * If no errors are found, return an empty array: [].
- "version_corrigee_et_amelioree": Rewrite the student's text to elevate it to a native C1/C2 band, preserving their original intent but upgrading flow and vocabulary.

### RESPONSE FORMAT CONSTRAINT
You must output ONLY a valid, minified JSON object matching the exact schema below. Do not include markdown code block wraps (like \`\`\`json), commentary, or leading/trailing text outside the JSON object.

### TARGET JSON OUTPUT SCHEMA
{"global_metrics":{"score_final":"string","niveau_cecr":"string","appreciation":"string"},"task_1_evaluation":{"score":"string","consigne":"string","votre_texte":"string","comprehension_du_sujet":"string","respect_de_methodologie":"string","niveau_linguistique":"string","appreciation_generale":"string","correction_orthographique":[{"erreur":"string","correction":"string","type":"string","explication":"string"}],"version_corrigee_et_amelioree":"string"},"task_2_evaluation":{"score":"string","consigne":"string","votre_texte":"string","comprehension_du_sujet":"string","respect_de_methodologie":"string","niveau_linguistique":"string","appreciation_generale":"string","correction_orthographique":[{"erreur":"string","correction":"string","type":"string","explication":"string"}],"version_corrigee_et_amelioree":"string"},"task_3_evaluation":{"score":"string","consigne":"string","votre_texte":"string","comprehension_du_sujet":"string","respect_de_methodologie":"string","niveau_linguistique":"string","appreciation_generale":"string","correction_orthographique":[{"erreur":"string","correction":"string","type":"string","explication":"string"}],"version_corrigee_et_amelioree":"string"}}`;

function buildUserPrompt(
  combination: Combination,
  sub: CombinationSubmission
): string {
  const t1 = combination.tasks.tache_1;
  const t2 = combination.tasks.tache_2;
  const t3 = combination.tasks.tache_3;

  return `Please evaluate the following candidate's written production exam. Analyze each task carefully according to the system rules and return the structured JSON output.

---
### EXAM: ${combination.title} (${combination.exam_type} Canada)

#### TÂCHE 1 (COURRIEL AMICAL)
- Word Constraints: ${t1.minWords} words minimum / ${t1.maxWords} words maximum
- Prompt Question:
"${t1.question}"
- Candidate's Submitted Text:
"${sub.draft_task_1}"

---
#### TÂCHE 2 (ARTICLE DE BLOG)
- Word Constraints: ${t2.minWords} words minimum / ${t2.maxWords} words maximum
- Prompt Question:
"${t2.question}"
- Candidate's Submitted Text:
"${sub.draft_task_2}"

---
#### TÂCHE 3 (SYNTHÈSE ET ARGUMENTATION)
- Word Constraints: ${t3.minWords} words minimum / ${t3.maxWords} words maximum
- Prompt Question:
"${t3.question}"
- Candidate's Submitted Text:
"${sub.draft_task_3}"
---

Remember, output only raw, minified JSON. Evaluate each of the three tasks separately using the required schema fields, calculate the mathematical sum score_final out of 20, map the CEFR level, and return the response.`;
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

  // Fetch submission (RLS enforces ownership)
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

  // Guard: prevent re-evaluation
  const { data: existing } = await supabase
    .from("combination_evaluations")
    .select("id")
    .eq("submission_id", submissionId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "already_evaluated" }, { status: 409 });
  }

  // Check ai_corrections_enabled
  const { data: profile } = await supabase
    .from("profiles")
    .select("ai_corrections_enabled")
    .eq("id", user.id)
    .single();

  if (!profile?.ai_corrections_enabled) {
    return NextResponse.json({ error: "ai_corrections_disabled" }, { status: 403 });
  }

  // Fetch combination for task questions/limits
  const { data: rawCombination } = await supabase
    .from("combinations")
    .select("*")
    .eq("id", sub.combination_id)
    .single();

  if (!rawCombination) {
    return NextResponse.json({ error: "combination_not_found" }, { status: 404 });
  }

  const combination = rawCombination as Combination;

  const userPrompt = buildUserPrompt(combination, sub);

  let rawText: string;
  try {
    rawText = await callAI(SYSTEM_PROMPT, userPrompt);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    if (msg === "no_ai_provider_configured") {
      return NextResponse.json({ error: "ai_not_configured" }, { status: 503 });
    }
    return NextResponse.json({ error: "ai_request_failed" }, { status: 502 });
  }

  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
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
    return NextResponse.json({ error: "ai_schema_mismatch" }, { status: 502 });
  }

  const report = validated.data;
  const scoreNum = parseFloat(report.global_metrics.score_final.replace("/20", "").trim());

  const adminSupabase = createSupabaseAdminClient();
  const { data: evaluation, error: evalError } = await adminSupabase
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
