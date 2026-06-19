import type { SupabaseClient } from "@supabase/supabase-js";
import { computeStudentAnalytics, computeActivityDays } from "./analytics";
import { getPlanMeta } from "@/lib/plans";
import type {
  ActivityFeedRow,
  AdminCombinationListResponse,
  AdminExamListResponse,
  AdminProfile,
  AdminUserListResponse,
  CefrDistributionItem,
  CefrLevel,
  Combination,
  CombinationSubmission,
  CombinationTasks,
  CreateCombinationInput,
  CreateExamInput,
  CreateUserInput,
  DashboardFilter,
  DashboardStats,
  Exam,
  ExamSearchParams,
  StudentAuditData,
  SubmissionsByDay,
  SubmissionWithEvaluation,
  UpdateCombinationInput,
  UpdateExamInput,
  UpdateUserInput,
  UserSearchParams,
} from "./types";
import type { ActivityDay } from "@/components/organisms/student/ConsistencyTracker";

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

  if (data.role === "student") {
    const meta = getPlanMeta(data.assigned_plan);
    await adminSupabase.from("payments").insert({
      user_id: authData.user.id,
      student_name: data.full_name,
      student_email: data.email,
      plan: data.assigned_plan,
      plan_price: meta.price,
      commission: meta.commission,
      payment_status: "confirmed",
    });
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

export async function listCombinations(
  supabase: SupabaseClient,
  params: { search?: string; exam_type?: string; page: number; pageSize: number }
): Promise<AdminCombinationListResponse> {
  const { page, pageSize, search, exam_type } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("combinations")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search) query = query.ilike("title", `%${search}%`);
  if (exam_type) query = query.eq("exam_type", exam_type);

  const { data, count } = await query;

  return {
    combinations: (data ?? []) as Combination[],
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function createCombination(
  supabase: SupabaseClient,
  data: CreateCombinationInput
): Promise<Combination> {
  const { data: combo, error } = await supabase
    .from("combinations")
    .insert({
      title: data.title,
      exam_type: data.exam_type,
      global_duration: data.global_duration,
      tasks: data.tasks as unknown as CombinationTasks,
    })
    .select()
    .single();

  if (error || !combo) throw new Error(error?.message ?? "Failed to create combination");
  return combo as Combination;
}

export async function updateCombination(
  supabase: SupabaseClient,
  combinationId: string,
  data: UpdateCombinationInput
): Promise<Combination> {
  const { data: combo, error } = await supabase
    .from("combinations")
    .update(data as unknown as CombinationTasks)
    .eq("id", combinationId)
    .select()
    .single();

  if (error || !combo) throw new Error(error?.message ?? "Failed to update combination");
  return combo as Combination;
}

export async function deleteCombination(
  supabase: SupabaseClient,
  combinationId: string
): Promise<void> {
  const { error } = await supabase
    .from("combinations")
    .delete()
    .eq("id", combinationId);
  if (error) throw new Error(error.message);
}

// ─── Dashboard query helpers ─────────────────────────────────────────────────

function getFilterRange(filter: DashboardFilter, date?: string): { gte?: string; lt?: string } {
  if (filter === "custom" && date) {
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return { gte: start.toISOString(), lt: end.toISOString() };
  }

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  if (filter === "today") {
    return { gte: todayStart.toISOString() };
  }
  if (filter === "yesterday") {
    const start = new Date(todayStart);
    start.setDate(start.getDate() - 1);
    return { gte: start.toISOString(), lt: todayStart.toISOString() };
  }
  if (filter === "before_yesterday") {
    const start = new Date(todayStart);
    start.setDate(start.getDate() - 2);
    const end = new Date(todayStart);
    end.setDate(end.getDate() - 1);
    return { gte: start.toISOString(), lt: end.toISOString() };
  }
  return {};
}

function getPrevRange(filter: DashboardFilter, date?: string): { gte?: string; lt?: string } {
  if (filter === "all" || filter === "custom") {
    if (filter === "custom" && date) {
      // previous day
      const d = new Date(`${date}T00:00:00.000Z`);
      d.setUTCDate(d.getUTCDate() - 1);
      const prevDate = d.toISOString().slice(0, 10);
      return getFilterRange("custom", prevDate);
    }
    return {};
  }
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  if (filter === "today") {
    const start = new Date(todayStart);
    start.setDate(start.getDate() - 1);
    return { gte: start.toISOString(), lt: todayStart.toISOString() };
  }
  if (filter === "yesterday") {
    const start = new Date(todayStart);
    start.setDate(start.getDate() - 2);
    const end = new Date(todayStart);
    end.setDate(end.getDate() - 1);
    return { gte: start.toISOString(), lt: end.toISOString() };
  }
  if (filter === "before_yesterday") {
    const start = new Date(todayStart);
    start.setDate(start.getDate() - 3);
    const end = new Date(todayStart);
    end.setDate(end.getDate() - 2);
    return { gte: start.toISOString(), lt: end.toISOString() };
  }
  return {};
}

async function countInRange(
  supabase: SupabaseClient,
  table: string,
  range: { gte?: string; lt?: string },
  extraFilter?: { column: string; value: string }
): Promise<number> {
  let q = supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  if (range.gte) q = q.gte("created_at", range.gte);
  if (range.lt) q = q.lt("created_at", range.lt);
  if (extraFilter) q = q.eq(extraFilter.column, extraFilter.value);
  const { count } = await q;
  return count ?? 0;
}

export async function getDashboardStats(
  supabase: SupabaseClient,
  filter: DashboardFilter,
  date?: string
): Promise<DashboardStats> {
  const curr = getFilterRange(filter, date);
  const prev = getPrevRange(filter, date);

  const [studentsCount, studentsPrev, submissionsCount, submissionsPrev, combinationsCount, combinationsPrev] =
    await Promise.all([
      countInRange(supabase, "profiles", curr, { column: "role", value: "student" }),
      countInRange(supabase, "profiles", prev, { column: "role", value: "student" }),
      countInRange(supabase, "combination_submissions", curr),
      countInRange(supabase, "combination_submissions", prev),
      countInRange(supabase, "combinations", curr),
      countInRange(supabase, "combinations", prev),
    ]);

  return {
    studentsCount,
    studentsPrev,
    submissionsCount,
    submissionsPrev,
    combinationsCount,
    combinationsPrev,
  };
}

export async function getDashboardFeed(
  supabase: SupabaseClient,
  filter: DashboardFilter,
  page: number,
  date?: string
): Promise<{ rows: ActivityFeedRow[]; total: number }> {
  const range = getFilterRange(filter, date);
  const from = (page - 1) * 20;
  const to = from + 19;

  let q = supabase
    .from("combination_submissions")
    .select(
      `id, created_at, user_id,
       combination:combinations ( id, title ),
       profile:profiles ( id, full_name, email, assigned_plan, simulations_remaining, simulations_quota, expires_at )`,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (range.gte) q = q.gte("created_at", range.gte);
  if (range.lt) q = q.lt("created_at", range.lt);

  const { data, count } = await q;

  const rows: ActivityFeedRow[] = (data ?? []).map((row: Record<string, unknown>) => {
    const combo = Array.isArray(row.combination) ? row.combination[0] : row.combination as Record<string, unknown>;
    const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile as Record<string, unknown>;
    return {
      submissionId: row.id as string,
      userId: row.user_id as string,
      fullName: profile?.full_name as string ?? "",
      email: profile?.email as string ?? "",
      assignedPlan: (profile?.assigned_plan as ActivityFeedRow["assignedPlan"]) ?? "PLAN_5000",
      simulationsRemaining: (profile?.simulations_remaining as number) ?? 0,
      simulationsQuota: (profile?.simulations_quota as number) ?? 0,
      combinationTitle: combo?.title as string ?? "",
      createdAt: row.created_at as string,
      expiresAt: profile?.expires_at as string ?? "",
    };
  });

  return { rows, total: count ?? 0 };
}

export async function getDashboardChartData(
  supabase: SupabaseClient,
  filter: DashboardFilter,
  date?: string
): Promise<{ byDay: SubmissionsByDay[]; cefrDistribution: CefrDistributionItem[] }> {
  const range = getFilterRange(filter, date);

  let subsQuery = supabase
    .from("combination_submissions")
    .select("created_at")
    .eq("is_completed", true)
    .limit(1000);

  if (range.gte) subsQuery = subsQuery.gte("created_at", range.gte);
  if (range.lt) subsQuery = subsQuery.lt("created_at", range.lt);

  const { data: subsData } = await subsQuery;

  const dayMap = new Map<string, number>();
  for (const row of subsData ?? []) {
    const d = (row.created_at as string).slice(0, 10);
    dayMap.set(d, (dayMap.get(d) ?? 0) + 1);
  }
  const byDay: SubmissionsByDay[] = Array.from(dayMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const { data: evalData } = await supabase
    .from("evaluations")
    .select("cefr_level");

  const levelMap = new Map<string, number>();
  for (const row of evalData ?? []) {
    const lvl = row.cefr_level as string;
    levelMap.set(lvl, (levelMap.get(lvl) ?? 0) + 1);
  }
  const cefrOrder: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const cefrDistribution: CefrDistributionItem[] = cefrOrder
    .filter((l) => levelMap.has(l))
    .map((l) => ({ level: l, count: levelMap.get(l)! }));

  return { byDay, cefrDistribution };
}

export async function getCombinationActivityDays(
  supabase: SupabaseClient,
  studentId: string
): Promise<{ activityDays: ActivityDay[]; streak: number; totalCompleted: number }> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("combination_submissions")
    .select("*")
    .eq("user_id", studentId)
    .gte("created_at", sevenDaysAgo.toISOString());

  const subs = (data ?? []) as CombinationSubmission[];
  const activityDays = computeActivityDays(subs);

  const { count: totalCompleted } = await supabase
    .from("combination_submissions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", studentId)
    .eq("is_completed", true);

  // Compute streak by walking back from today
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 30; i++) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const dayStr = day.toISOString().slice(0, 10);
    const hadActivity = subs.some((s) => s.created_at.slice(0, 10) === dayStr);
    if (hadActivity) {
      streak++;
    } else {
      break;
    }
  }

  return { activityDays, streak, totalCompleted: totalCompleted ?? 0 };
}
