import type { SupabaseClient } from "@supabase/supabase-js";
import { computeStudentAnalytics } from "@/lib/admin/analytics";
import { mapCombinationSubmission, mapOralSubmission } from "@/lib/admin/queries";
import type {
  AdminProfile,
  Combination,
  CombinationSubmission,
  Exam,
  OralCombination,
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

  // Analytics (CEFR trajectory, completed/in-progress counts) must reflect ALL simulation
  // types, not just standalone single-exam attempts — most students only ever use the
  // combination (EE) and oral (EO) flows, so folding only `submissions` in here left the
  // trajectory chart and stats permanently empty for them. The row list below (`submissions`,
  // returned as-is) stays single-exam-only since its detail links only resolve for that type;
  // combo/oral attempts already have their own card sections higher up the history page.
  const [{ data: rawCombinationSubmissions }, { data: rawOralSubmissions }] = await Promise.all([
    supabase
      .from("combination_submissions")
      .select(
        `
        id, user_id, combination_id, draft_task_1, draft_task_2, draft_task_3,
        word_count_1, word_count_2, word_count_3, is_completed, completed_at, created_at,
        combination:combinations ( id, title, exam_type ),
        evaluation:combination_evaluations (
          id, submission_id, global_score, cefr_level, appreciation,
          task_1_evaluation, task_2_evaluation, task_3_evaluation, created_at
        )
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("oral_submissions")
      .select(
        `
        id, user_id, oral_combination_id, is_completed, completed_at, created_at,
        combination:oral_combinations ( id, title, exam_type ),
        evaluation:oral_evaluations (
          id, submission_id, global_score, cefr_level, appreciation,
          task_1_evaluation, task_2_evaluation, task_3_evaluation, created_at
        )
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  const combinationSubmissions: SubmissionWithEvaluation[] = (
    rawCombinationSubmissions ?? []
  ).map(mapCombinationSubmission);
  const oralSubmissions: SubmissionWithEvaluation[] = (rawOralSubmissions ?? []).map(
    mapOralSubmission
  );

  // Three views of the same data: combined for the "Tout" filter, and one per
  // skill so each filter shows figures that actually match what it's listing —
  // previously the Expression Écrite filter silently included oral results.
  const eeForAnalytics = [...submissions, ...combinationSubmissions];
  const allForAnalytics = [...eeForAnalytics, ...oralSubmissions];

  const analytics = computeStudentAnalytics(allForAnalytics, []);
  const analyticsEe = computeStudentAnalytics(eeForAnalytics, []);
  const analyticsEo = computeStudentAnalytics(oralSubmissions, []);

  return {
    profile: profile as AdminProfile,
    submissions,
    analytics,
    analyticsEe,
    analyticsEo,
  };
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

export interface OralSubmission {
  id: string;
  user_id: string;
  oral_combination_id: string;
  audio_path_task_1: string | null;
  audio_path_task_2: string | null;
  audio_path_task_3: string | null;
  pipeline_status: "pending" | "processing" | "failed" | "completed";
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface OralCombinationWithSubmission {
  combination: OralCombination;
  submission: OralSubmission | null;
}

export async function listOralCombinationsWithStatus(
  supabase: SupabaseClient,
  userId: string
): Promise<OralCombinationWithSubmission[]> {
  const [{ data: combinations }, { data: rawSubs }] = await Promise.all([
    supabase
      .from("oral_combinations")
      .select("*")
      .order("created_at", { ascending: true }),
    supabase
      .from("oral_submissions")
      .select("*")
      .eq("user_id", userId),
  ]);

  const subMap = new Map<string, OralSubmission>();
  for (const s of rawSubs ?? []) {
    const row = s as Record<string, unknown>;
    subMap.set(row.oral_combination_id as string, row as unknown as OralSubmission);
  }

  return (combinations ?? []).map((c) => ({
    combination: c as OralCombination,
    submission: subMap.get(c.id) ?? null,
  }));
}

export interface CompletedCombinationWithEvaluation {
  combination: Combination;
  submission: CombinationSubmission;
  evaluation: {
    id: string;
    global_score: number;
    cefr_level: string;
    appreciation: string;
  } | null;
}

export async function listCompletedCombinationsWithEvaluation(
  supabase: SupabaseClient,
  userId: string
): Promise<CompletedCombinationWithEvaluation[]> {
  const { data: rawSubs } = await supabase
    .from("combination_submissions")
    .select("*")
    .eq("user_id", userId)
    .eq("is_completed", true)
    .order("completed_at", { ascending: false });

  if (!rawSubs || rawSubs.length === 0) return [];

  const subs = rawSubs as CombinationSubmission[];
  const combinationIds = subs.map((s) => s.combination_id);
  const submissionIds = subs.map((s) => s.id);

  const [{ data: rawCombinations }, { data: rawEvals }] = await Promise.all([
    supabase.from("combinations").select("*").in("id", combinationIds),
    supabase
      .from("combination_evaluations")
      .select("id, submission_id, global_score, cefr_level, appreciation")
      .in("submission_id", submissionIds),
  ]);

  const combinationMap = new Map<string, Combination>();
  for (const c of rawCombinations ?? []) {
    combinationMap.set((c as Combination).id, c as Combination);
  }

  const evalMap = new Map<string, CompletedCombinationWithEvaluation["evaluation"]>();
  for (const e of rawEvals ?? []) {
    const row = e as Record<string, unknown>;
    evalMap.set(row.submission_id as string, {
      id: row.id as string,
      global_score: row.global_score as number,
      cefr_level: row.cefr_level as string,
      appreciation: row.appreciation as string,
    });
  }

  return subs
    .filter((s) => combinationMap.has(s.combination_id))
    .map((s) => ({
      combination: combinationMap.get(s.combination_id)!,
      submission: s,
      evaluation: evalMap.get(s.id) ?? null,
    }));
}

export interface CompletedOralCombinationWithEvaluation {
  combination: OralCombination;
  submission: OralSubmission;
  evaluation: {
    id: string;
    global_score: number;
    cefr_level: string;
    appreciation: string;
  } | null;
}

export async function listCompletedOralCombinationsWithEvaluation(
  supabase: SupabaseClient,
  userId: string
): Promise<CompletedOralCombinationWithEvaluation[]> {
  const { data: rawSubs } = await supabase
    .from("oral_submissions")
    .select("*")
    .eq("user_id", userId)
    .eq("is_completed", true)
    .order("completed_at", { ascending: false });

  if (!rawSubs || rawSubs.length === 0) return [];

  const subs = rawSubs as OralSubmission[];
  const combinationIds = subs.map((s) => s.oral_combination_id);
  const submissionIds = subs.map((s) => s.id);

  const [{ data: rawCombinations }, { data: rawEvals }] = await Promise.all([
    supabase.from("oral_combinations").select("*").in("id", combinationIds),
    supabase
      .from("oral_evaluations")
      .select("id, submission_id, global_score, cefr_level, appreciation")
      .in("submission_id", submissionIds),
  ]);

  const combinationMap = new Map<string, OralCombination>();
  for (const c of rawCombinations ?? []) {
    combinationMap.set((c as OralCombination).id, c as OralCombination);
  }

  const evalMap = new Map<string, CompletedOralCombinationWithEvaluation["evaluation"]>();
  for (const e of rawEvals ?? []) {
    const row = e as Record<string, unknown>;
    evalMap.set(row.submission_id as string, {
      id: row.id as string,
      global_score: row.global_score as number,
      cefr_level: row.cefr_level as string,
      appreciation: row.appreciation as string,
    });
  }

  return subs
    .filter((s) => combinationMap.has(s.oral_combination_id))
    .map((s) => ({
      combination: combinationMap.get(s.oral_combination_id)!,
      submission: s,
      evaluation: evalMap.get(s.id) ?? null,
    }));
}

export interface OralResultDetail {
  submission: OralSubmission;
  combination: OralCombination;
  evaluation: {
    id: string;
    global_score: number;
    cefr_level: string;
    appreciation: string;
    task_1_evaluation: Record<string, unknown>;
    task_2_evaluation: Record<string, unknown>;
    task_3_evaluation: Record<string, unknown>;
    created_at: string;
  } | null;
}

export async function getOralResultDetail(
  supabase: SupabaseClient,
  submissionId: string,
  userId: string
): Promise<OralResultDetail | null> {
  const { data: rawSub } = await supabase
    .from("oral_submissions")
    .select("*")
    .eq("id", submissionId)
    .eq("user_id", userId)
    .single();

  if (!rawSub) return null;

  const sub = rawSub as OralSubmission;

  const [{ data: rawCombination }, { data: rawEval }] = await Promise.all([
    supabase.from("oral_combinations").select("*").eq("id", sub.oral_combination_id).single(),
    supabase
      .from("oral_evaluations")
      .select("*")
      .eq("submission_id", submissionId)
      .maybeSingle(),
  ]);

  if (!rawCombination) return null;

  return {
    submission: sub,
    combination: rawCombination as OralCombination,
    evaluation: (rawEval as OralResultDetail["evaluation"]) ?? null,
  };
}

export interface CombinationResultDetail {
  submission: CombinationSubmission;
  combination: Combination;
  evaluation: {
    id: string;
    global_score: number;
    cefr_level: string;
    appreciation: string;
    task_1_evaluation: Record<string, unknown>;
    task_2_evaluation: Record<string, unknown>;
    task_3_evaluation: Record<string, unknown>;
    created_at: string;
  } | null;
}

export async function getCombinationResultDetail(
  supabase: SupabaseClient,
  submissionId: string,
  userId: string
): Promise<CombinationResultDetail | null> {
  const { data: rawSub } = await supabase
    .from("combination_submissions")
    .select("*")
    .eq("id", submissionId)
    .eq("user_id", userId)
    .single();

  if (!rawSub) return null;

  const sub = rawSub as CombinationSubmission;

  const [{ data: rawCombination }, { data: rawEval }] = await Promise.all([
    supabase.from("combinations").select("*").eq("id", sub.combination_id).single(),
    supabase
      .from("combination_evaluations")
      .select("*")
      .eq("submission_id", submissionId)
      .maybeSingle(),
  ]);

  if (!rawCombination) return null;

  return {
    submission: sub,
    combination: rawCombination as Combination,
    evaluation: rawEval as CombinationResultDetail["evaluation"] ?? null,
  };
}
