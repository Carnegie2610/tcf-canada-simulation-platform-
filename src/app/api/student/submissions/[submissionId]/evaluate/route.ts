import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { DiagnosticReportSchema } from "@/lib/schemas";

export const maxDuration = 60;

export async function POST(
  _request: NextRequest,
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

  // RLS ensures only the owner can read this submission
  const { data: submission, error: subError } = await supabase
    .from("submissions")
    .select("id, user_id, user_draft, is_completed, exam:exams(title, section, exam_type)")
    .eq("id", submissionId)
    .eq("user_id", user.id)
    .single();

  if (subError || !submission) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (!submission.is_completed) {
    return NextResponse.json({ error: "submission_not_locked" }, { status: 400 });
  }

  // Guard: don't re-evaluate
  const { data: existing } = await supabase
    .from("evaluations")
    .select("id")
    .eq("submission_id", submissionId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "already_evaluated" }, { status: 409 });
  }

  // Check ai_corrections_enabled on profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("ai_corrections_enabled")
    .eq("id", user.id)
    .single();

  if (!profile?.ai_corrections_enabled) {
    return NextResponse.json({ error: "ai_corrections_disabled" }, { status: 403 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ai_not_configured" }, { status: 503 });
  }

  const examInfo = Array.isArray(submission.exam) ? submission.exam[0] : submission.exam;
  const prompt = buildEvaluationPrompt(submission.user_draft as string, examInfo as { title: string; section: string; exam_type: string });

  const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!anthropicResponse.ok) {
    return NextResponse.json({ error: "ai_request_failed" }, { status: 502 });
  }

  const aiData = await anthropicResponse.json() as { content: Array<{ type: string; text: string }> };
  const rawText = aiData.content?.[0]?.text ?? "";

  // Extract JSON from the response
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

  const validated = DiagnosticReportSchema.safeParse(parsed);
  if (!validated.success) {
    return NextResponse.json({ error: "ai_schema_mismatch" }, { status: 502 });
  }

  const report = validated.data;

  // Service role client bypasses RLS for evaluation INSERT
  const adminSupabase = createSupabaseAdminClient();
  const { data: evaluation, error: evalError } = await adminSupabase
    .from("evaluations")
    .insert({
      submission_id: submissionId,
      cefr_level: report.cefrLevel,
      global_score: report.globalScore,
      grammar_score: report.criteriaMetrics.grammarScore,
      lexical_score: report.criteriaMetrics.lexicalScore,
      coherence_score: report.criteriaMetrics.coherenceScore,
      json_feedback: { corrections: report.corrections },
      model_answer_c2: report.modelAnswerC2,
    })
    .select()
    .single();

  if (evalError || !evaluation) {
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({ evaluation });
}

function buildEvaluationPrompt(
  userDraft: string,
  exam: { title: string; section: string; exam_type: string }
): string {
  return `You are an expert ${exam.exam_type} Canada examiner evaluating a French written expression submission for the ${exam.section} section (topic: "${exam.title}").

Evaluate the following candidate text and return a JSON object ONLY (no prose before or after) matching this exact schema:

{
  "cefrLevel": "A1"|"A2"|"B1"|"B2"|"C1"|"C2",
  "globalScore": number (0-100),
  "criteriaMetrics": {
    "grammarScore": number (0-20),
    "lexicalScore": number (0-20),
    "coherenceScore": number (0-20)
  },
  "corrections": [
    {
      "originalSegment": "exact phrase from text",
      "correctedSegment": "corrected version",
      "errorType": "Grammaire"|"Orthographe"|"Syntaxe"|"Vocabulaire"|"Ponctuation",
      "explanationFr": "explication en français"
    }
  ],
  "modelAnswerC2": "full C2-level rewrite of the text in French"
}

Candidate text:
---
${userDraft}
---

Return JSON only.`;
}
