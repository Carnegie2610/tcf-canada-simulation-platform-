import type { SupabaseClient } from "@supabase/supabase-js";
import { computeStudentAnalytics } from "./analytics";
import type {
  AdminExamListResponse,
  AdminProfile,
  AdminUserListResponse,
  CreateExamInput,
  CreateUserInput,
  Exam,
  ExamSearchParams,
  StudentAuditData,
  SubmissionWithEvaluation,
  UpdateExamInput,
  UpdateUserInput,
  UserSearchParams,
} from "./types";

export async function getStudentAuditData(
  supabase: SupabaseClient,
  studentId: string
): Promise<StudentAuditData | null> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", studentId)
    .single();

  if (profileError || !profile) return null;

  const { data: rawSubmissions } = await supabase
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
    .eq("user_id", studentId)
    .order("created_at", { ascending: false });

  const submissions: SubmissionWithEvaluation[] = (rawSubmissions ?? []).map(
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

  let cohortScores: number[] = [];
  if (profile.cohort_tag) {
    const { data: cohortData } = await supabase
      .from("profiles")
      .select("id")
      .eq("cohort_tag", profile.cohort_tag)
      .neq("id", studentId);

    const cohortIds = (cohortData ?? []).map((p: { id: string }) => p.id);

    if (cohortIds.length > 0) {
      const { data: cohortEvals } = await supabase
        .from("submissions")
        .select("evaluations ( global_score )")
        .in("user_id", cohortIds)
        .eq("is_completed", true);

      cohortScores = (cohortEvals ?? []).flatMap(
        (s: { evaluations: Array<{ global_score: number }> | { global_score: number } | null }) => {
          if (!s.evaluations) return [];
          return Array.isArray(s.evaluations)
            ? s.evaluations.map((e) => e.global_score)
            : [s.evaluations.global_score];
        }
      );
    }
  }

  const analytics = computeStudentAnalytics(submissions, cohortScores);

  return { profile: profile as AdminProfile, submissions, analytics };
}

export async function listUsers(
  supabase: SupabaseClient,
  params: UserSearchParams
): Promise<AdminUserListResponse> {
  const { page, pageSize, search } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search) {
    query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
  }

  const { data, count } = await query;

  return {
    users: (data ?? []) as AdminProfile[],
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function createUser(
  adminSupabase: SupabaseClient,
  data: CreateUserInput
): Promise<AdminProfile> {
  const { data: authData, error: authError } =
    await adminSupabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });

  if (authError || !authData.user) {
    throw new Error(authError?.message ?? "Failed to create auth user");
  }

  const { data: profile, error: profileError } = await adminSupabase
    .from("profiles")
    .insert({
      id: authData.user.id,
      email: data.email,
      full_name: data.full_name,
      role: data.role,
      assigned_plan: data.assigned_plan,
      simulations_quota: data.simulations_quota,
      simulations_remaining: data.simulations_quota,
      ai_corrections_enabled: data.ai_corrections_enabled,
      expires_at: data.expires_at,
      cohort_tag: data.cohort_tag,
    })
    .select()
    .single();

  if (profileError || !profile) {
    throw new Error(profileError?.message ?? "Failed to create profile");
  }

  return profile as AdminProfile;
}

export async function updateUser(
  supabase: SupabaseClient,
  userId: string,
  data: UpdateUserInput
): Promise<AdminProfile> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", userId)
    .select()
    .single();

  if (error || !profile) {
    throw new Error(error?.message ?? "Failed to update user");
  }

  return profile as AdminProfile;
}

export async function deleteUser(
  adminSupabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { error } = await adminSupabase.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
}

export async function listExams(
  supabase: SupabaseClient,
  params: ExamSearchParams
): Promise<AdminExamListResponse> {
  const { page, pageSize, search, section, exam_type } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("exams")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search) query = query.ilike("title", `%${search}%`);
  if (section) query = query.eq("section", section);
  if (exam_type) query = query.eq("exam_type", exam_type);

  const { data, count } = await query;

  return {
    exams: (data ?? []) as Exam[],
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function createExam(
  supabase: SupabaseClient,
  data: CreateExamInput
): Promise<Exam> {
  const { data: exam, error } = await supabase
    .from("exams")
    .insert(data)
    .select()
    .single();

  if (error || !exam) throw new Error(error?.message ?? "Failed to create exam");
  return exam as Exam;
}

export async function updateExam(
  supabase: SupabaseClient,
  examId: string,
  data: UpdateExamInput
): Promise<Exam> {
  const { data: exam, error } = await supabase
    .from("exams")
    .update(data)
    .eq("id", examId)
    .select()
    .single();

  if (error || !exam) throw new Error(error?.message ?? "Failed to update exam");
  return exam as Exam;
}

export async function deleteExam(
  supabase: SupabaseClient,
  examId: string
): Promise<void> {
  const { error } = await supabase.from("exams").delete().eq("id", examId);
  if (error) throw new Error(error.message);
}
