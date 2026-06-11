import type { SupabaseClient } from "@supabase/supabase-js";
import { computeStudentAnalytics } from "@/lib/admin/analytics";
import type {
  AdminProfile,
  Combination,
  CombinationSubmission,
  Exam,
  StudentAuditData,
  SubmissionWithEvaluation,
} from "@/lib/admin/types";

export interface ExamWithSubmission {
  exam: Exam;
  submission: SubmissionWithEvaluation | null;
}

export async function listExamsWithStatus(
  supabase: SupabaseClient,
  userId: string
): Promise<ExamWithSubmission[]> {
  const [{ data: exams }, { data: rawSubs }] = await Promise.all([
    supabase.from("exams").select("*").order("created_at", { ascending: true }),
    supabase
      .from("submissions")
      .select(
        `
        id, user_id, exam_id, user_draft, word_count, is_completed, completed_at, created_at,
        exam:exams ( id, title, section, exam_type ),
        evaluation:evaluations (
          id, submission_id, cefr_level, global_score,
          grammar_score, lexical_score, coherence_score,
          json_feedback, model_answer_c2, created_at
        )
      `
      )
      .eq("user_id", userId),
  ]);

  const submissionMap = new Map<string, SubmissionWithEvaluation>();
  for (const s of rawSubs ?? []) {
    const row = s as Record<string, unknown>;
    submissionMap.set(row.exam_id as string, {
      id: row.id as string,
      user_id: row.user_id as string,
      exam_id: row.exam_id as string,
      user_draft: row.user_draft as string,
      word_count: row.word_count as number,
      is_completed: row.is_completed as boolean,
      completed_at: row.completed_at as string | null,
      created_at: row.created_at as string,
      exam: row.exam as SubmissionWithEvaluation["exam"],
      evaluation: Array.isArray(row.evaluation)
        ? (row.evaluation[0] ?? null)
        : (row.evaluation as SubmissionWithEvaluation["evaluation"]),
    });
  }

  return (exams ?? []).map((exam) => ({
    exam: exam as Exam,
    submission: submissionMap.get(exam.id) ?? null,
  }));
}

export async function getStudentData(
  supabase: SupabaseClient,
  userId: string
): Promise<StudentAuditData | null> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError || !profile) return null;

  const { data: rawSubs } = await supabase
    .from("submissions")
    .select(
      `
      id, user_id, exam_id, user_draft, word_count, is_completed, completed_at, created_at,
      exam:exams ( id, title, section, exam_type ),
      evaluation:evaluations (
        id, submission_id, cefr_level, global_score,
        grammar_score, lexical_score, coherence_score,
        json_feedback, model_answer_c2, created_at
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const submissions: SubmissionWithEvaluation[] = (rawSubs ?? []).map(
    (s: Record<string, unknown>) => ({
      id: s.id as string,
      user_id: s.user_id as string,
      exam_id: s.exam_id as string,
      user_draft: s.user_draft as string,
      word_count: s.word_count as number,
      is_completed: s.is_completed as boolean,
      completed_at: s.completed_at as string | null,
      created_at: s.created_at as string,
      exam: s.exam as SubmissionWithEvaluation["exam"],
      evaluation: Array.isArray(s.evaluation)
        ? (s.evaluation[0] ?? null)
        : (s.evaluation as SubmissionWithEvaluation["evaluation"]),
    })
  );

  const analytics = computeStudentAnalytics(submissions, []);

  return { profile: profile as AdminProfile, submissions, analytics };
}

export async function getSubmissionDetail(
  supabase: SupabaseClient,
  submissionId: string
): Promise<SubmissionWithEvaluation | null> {
  const { data: raw, error } = await supabase
    .from("submissions")
    .select(
      `
      id, user_id, exam_id, user_draft, word_count, is_completed, completed_at, created_at,
      exam:exams ( id, title, section, exam_type ),
      evaluation:evaluations (
        id, submission_id, cefr_level, global_score,
        grammar_score, lexical_score, coherence_score,
        json_feedback, model_answer_c2, created_at
      )
    `
    )
    .eq("id", submissionId)
    .single();

  if (error || !raw) return null;

  const s = raw as Record<string, unknown>;
  return {
    id: s.id as string,
    user_id: s.user_id as string,
    exam_id: s.exam_id as string,
    user_draft: s.user_draft as string,
    word_count: s.word_count as number,
    is_completed: s.is_completed as boolean,
    completed_at: s.completed_at as string | null,
    created_at: s.created_at as string,
    exam: s.exam as SubmissionWithEvaluation["exam"],
    evaluation: Array.isArray(s.evaluation)
      ? (s.evaluation[0] ?? null)
      : (s.evaluation as SubmissionWithEvaluation["evaluation"]),
  };
}

export interface CombinationWithSubmission {
  combination: Combination;
  submission: CombinationSubmission | null;
}

export async function listCombinationsWithStatus(
  supabase: SupabaseClient,
  userId: string
): Promise<CombinationWithSubmission[]> {
  const [{ data: combinations }, { data: rawSubs }] = await Promise.all([
    supabase
      .from("combinations")
      .select("*")
      .order("created_at", { ascending: true }),
    supabase
      .from("combination_submissions")
      .select("*")
      .eq("user_id", userId),
  ]);

  const subMap = new Map<string, CombinationSubmission>();
  for (const s of rawSubs ?? []) {
    const row = s as Record<string, unknown>;
    subMap.set(row.combination_id as string, row as unknown as CombinationSubmission);
  }

  return (combinations ?? []).map((c) => ({
    combination: c as Combination,
    submission: subMap.get(c.id) ?? null,
  }));
}
