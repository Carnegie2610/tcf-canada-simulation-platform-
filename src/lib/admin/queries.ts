import type { SupabaseClient } from "@supabase/supabase-js";
import { computeStudentAnalytics, computeActivityDays } from "./analytics";
import { getPlanMeta } from "@/lib/plans";
import type {
  ActivityFeedRow,
  AdminCombinationListResponse,
  AdminExamListResponse,
  AdminOralCombinationListResponse,
  AdminProfile,
  AdminUserListResponse,
  AssignedPlan,
  CefrDistributionItem,
  CefrLevel,
  Combination,
  CombinationSubmission,
  CombinationTasks,
  CreateCombinationInput,
  CreateExamInput,
  CreateOralCombinationInput,
  CreateUserInput,
  DashboardFilter,
  DashboardStats,
  ErrorType,
  Evaluation,
  Exam,
  ExamSearchParams,
  ExamType,
  FeedbackCorrection,
  OralCombination,
  OralTasks,
  StudentAuditData,
  SubmissionsByDay,
  SubmissionWithEvaluation,
  UpdateCombinationInput,
  UpdateExamInput,
  UpdateOralCombinationInput,
  UpdateUserInput,
  UserSearchParams,
} from "./types";
import type { CombinationTaskEval } from "@/lib/schemas";
import type { ActivityDay } from "@/components/organisms/student/ConsistencyTracker";

const ERROR_TYPES: ReadonlySet<string> = new Set([
  "Grammaire",
  "Orthographe",
  "Syntaxe",
  "Vocabulaire",
  "Ponctuation",
]);

function toErrorType(type: string): ErrorType {
  return (ERROR_TYPES.has(type) ? type : "Orthographe") as ErrorType;
}

const CEFR_LEVELS: ReadonlySet<string> = new Set(["A1", "A2", "B1", "B2", "C1", "C2"]);

// Combination evaluations use an extended CECRL scale with "+" tiers (e.g. "C1+", "B2+")
// that the legacy audit UI doesn't know about — fold them onto their base level.
function toBaseCefrLevel(level: string): CefrLevel {
  const base = level.replace("+", "");
  return (CEFR_LEVELS.has(base) ? base : "B1") as CefrLevel;
}

function parseTaskEvalScore(scoreStr: string): number {
  const n = parseFloat(scoreStr.replace(/\/\d+/, "").trim());
  return isNaN(n) ? 0 : n;
}

// Combination/oral task scores are marked out of different maxima (4 / 7 / 9) while the audit
// UI's ScorePill always renders grammar/lexical/coherence out of 20 — rescale onto /20.
function taskScoreOn20(scoreStr: string, maxScore: number): number {
  const raw = parseTaskEvalScore(scoreStr);
  return Math.round((raw / maxScore) * 20 * 10) / 10;
}

export function mapCombinationSubmission(row: Record<string, unknown>): SubmissionWithEvaluation {
  const rawCombination = row.combination as
    | { id: string; title: string; exam_type: ExamType }
    | { id: string; title: string; exam_type: ExamType }[]
    | null;
  const combination = Array.isArray(rawCombination) ? rawCombination[0] : rawCombination;

  const rawEvaluation = row.evaluation as Record<string, unknown> | Record<string, unknown>[] | null;
  const evalRow = Array.isArray(rawEvaluation) ? (rawEvaluation[0] ?? null) : rawEvaluation;

  const draftParts = [
    { label: "Tâche 1", text: (row.draft_task_1 as string) ?? "" },
    { label: "Tâche 2", text: (row.draft_task_2 as string) ?? "" },
    { label: "Tâche 3", text: (row.draft_task_3 as string) ?? "" },
  ];
  const user_draft = draftParts
    .filter((p) => p.text.trim().length > 0)
    .map((p) => `— ${p.label} —\n${p.text}`)
    .join("\n\n");

  const word_count =
    ((row.word_count_1 as number) ?? 0) +
    ((row.word_count_2 as number) ?? 0) +
    ((row.word_count_3 as number) ?? 0);

  let evaluation: Evaluation | null = null;
  if (evalRow) {
    const task1 = evalRow.task_1_evaluation as CombinationTaskEval;
    const task2 = evalRow.task_2_evaluation as CombinationTaskEval;
    const task3 = evalRow.task_3_evaluation as CombinationTaskEval;

    const corrections: FeedbackCorrection[] = [task1, task2, task3].flatMap((task) =>
      (task.correction_orthographique ?? []).map((c) => ({
        originalSegment: c.erreur,
        correctedSegment: c.correction,
        errorType: toErrorType(c.type),
        explanationFr: c.explication,
      }))
    );

    evaluation = {
      id: evalRow.id as string,
      submission_id: evalRow.submission_id as string,
      cefr_level: toBaseCefrLevel(evalRow.cefr_level as string),
      global_score: (evalRow.global_score as number) * 5, // 0-20 combination scale -> 0-100
      grammar_score: taskScoreOn20(task1.score, 4),
      lexical_score: taskScoreOn20(task2.score, 7),
      coherence_score: taskScoreOn20(task3.score, 9),
      json_feedback: { corrections },
      model_answer_c2: [task1, task2, task3]
        .map((t, i) => `— Tâche ${i + 1} —\n${t.version_corrigee_et_amelioree}`)
        .join("\n\n"),
      created_at: evalRow.created_at as string,
    };
  }

  return {
    id: row.id as string,
    user_id: row.user_id as string,
    exam_id: combination?.id ?? (row.combination_id as string),
    user_draft,
    word_count,
    is_completed: row.is_completed as boolean,
    completed_at: row.completed_at as string | null,
    created_at: row.created_at as string,
    exam: {
      id: combination?.id ?? (row.combination_id as string),
      title: combination?.title ?? "Combinaison inconnue",
      section: "COMBINE",
      exam_type: combination?.exam_type ?? "TCF",
    },
    sourceType: "combination",
    evaluation,
  };
}

// Oral evaluations have no per-error orthographic corrections or model-answer text
// (that's a written-only concept) — those fields are left empty for the merged shape.
export function mapOralSubmission(row: Record<string, unknown>): SubmissionWithEvaluation {
  const rawCombination = row.combination as
    | { id: string; title: string; exam_type: ExamType }
    | { id: string; title: string; exam_type: ExamType }[]
    | null;
  const combination = Array.isArray(rawCombination) ? rawCombination[0] : rawCombination;

  const rawEvaluation = row.evaluation as Record<string, unknown> | Record<string, unknown>[] | null;
  const evalRow = Array.isArray(rawEvaluation) ? (rawEvaluation[0] ?? null) : rawEvaluation;

  const task1 = evalRow?.task_1_evaluation as Record<string, unknown> | undefined;
  const task2 = evalRow?.task_2_evaluation as Record<string, unknown> | undefined;
  const task3 = evalRow?.task_3_evaluation as Record<string, unknown> | undefined;

  let evaluation: Evaluation | null = null;
  if (evalRow && task1 && task2 && task3) {
    evaluation = {
      id: evalRow.id as string,
      submission_id: evalRow.submission_id as string,
      cefr_level: toBaseCefrLevel(evalRow.cefr_level as string),
      global_score: (evalRow.global_score as number) * 5, // 0-20 oral scale -> 0-100
      grammar_score: taskScoreOn20(task1.score as string, 4),
      lexical_score: taskScoreOn20(task2.score as string, 7),
      coherence_score: taskScoreOn20(task3.score as string, 9),
      json_feedback: { corrections: [] },
      model_answer_c2: "",
      created_at: evalRow.created_at as string,
    };
  }

  return {
    id: row.id as string,
    user_id: row.user_id as string,
    exam_id: combination?.id ?? (row.oral_combination_id as string),
    user_draft: "",
    word_count: 0,
    is_completed: row.is_completed as boolean,
    completed_at: row.completed_at as string | null,
    created_at: row.created_at as string,
    exam: {
      id: combination?.id ?? (row.oral_combination_id as string),
      title: combination?.title ?? "Combinaison orale inconnue",
      section: "COMBINE",
      exam_type: combination?.exam_type ?? "TCF",
    },
    sourceType: "oral",
    oralTasks: {
      task1: {
        question: (task1?.consigne as string) ?? "",
        transcript: (task1?.transcript as string) ?? "",
        audioPath: (row.audio_path_task_1 as string) ?? null,
      },
      task2: {
        question: (task2?.consigne as string) ?? "",
        transcript: (task2?.transcript as string) ?? "",
        audioPath: (row.audio_path_task_2 as string) ?? null,
      },
      task3: {
        question: (task3?.consigne as string) ?? "",
        transcript: (task3?.transcript as string) ?? "",
        audioPath: (row.audio_path_task_3 as string) ?? null,
      },
    },
    evaluation,
  };
}

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

  const { data: rawCombinationSubmissions } = await supabase
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
    .eq("user_id", studentId)
    .order("created_at", { ascending: false });

  const combinationSubmissions: SubmissionWithEvaluation[] = (
    rawCombinationSubmissions ?? []
  ).map(mapCombinationSubmission);

  const { data: rawOralSubmissions } = await supabase
    .from("oral_submissions")
    .select(
      `
      id, user_id, oral_combination_id, is_completed, completed_at, created_at,
      audio_path_task_1, audio_path_task_2, audio_path_task_3,
      combination:oral_combinations ( id, title, exam_type ),
      evaluation:oral_evaluations (
        id, submission_id, global_score, cefr_level, appreciation,
        task_1_evaluation, task_2_evaluation, task_3_evaluation, created_at
      )
    `
    )
    .eq("user_id", studentId)
    .order("created_at", { ascending: false });

  const oralSubmissions: SubmissionWithEvaluation[] = (
    rawOralSubmissions ?? []
  ).map(mapOralSubmission);

  const allSubmissions = [...submissions, ...combinationSubmissions, ...oralSubmissions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
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

  const analytics = computeStudentAnalytics(allSubmissions, cohortScores);

  return { profile: profile as AdminProfile, submissions: allSubmissions, analytics };
}

export async function listUsers(
  supabase: SupabaseClient,
  params: UserSearchParams
): Promise<AdminUserListResponse> {
  const { page, pageSize, search, status, role, cohort_tag } = params;
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

  if (role) {
    query = query.eq("role", role);
  }

  if (cohort_tag) {
    query = query.eq("cohort_tag", cohort_tag);
  }

  // Status filters use plain comparisons rather than .or() — supabase-js only
  // supports one top-level or() per query, and `search` above already claims it.
  if (status) {
    const now = new Date().toISOString();
    if (status === "expired") {
      query = query.lt("expires_at", now);
    } else if (status === "active") {
      query = query.gte("expires_at", now);
    } else if (status === "expiring") {
      const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte("expires_at", now).lte("expires_at", in7Days);
    } else if (status === "exhausted") {
      // Nothing left on either skill — an expiry date alone doesn't qualify.
      query = query.eq("ee_simulations_remaining", 0).eq("eo_simulations_remaining", 0);
    }
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
      assigned_plan_ee: data.assigned_plan_ee,
      assigned_plan_eo: data.assigned_plan_eo,
      ee_simulations_quota: data.ee_simulations_quota,
      ee_simulations_remaining: data.ee_simulations_quota,
      eo_simulations_quota: data.eo_simulations_quota,
      eo_simulations_remaining: data.eo_simulations_quota,
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
    // EE and EO packs are picked independently — log one payment row per pack
    // actually chosen, each with that pack's own real price/commission, so the
    // commissions dashboard's EE/EO totals stay unambiguous.
    const rows = [data.assigned_plan_ee, data.assigned_plan_eo]
      .filter((plan): plan is AssignedPlan => plan != null)
      .map((plan) => {
        const meta = getPlanMeta(plan);
        return {
          user_id: authData.user.id,
          student_name: data.full_name,
          student_email: data.email,
          plan,
          plan_price: meta.price,
          commission: meta.commission,
          payment_status: "confirmed",
        };
      });

    if (rows.length > 0) {
      await adminSupabase.from("payments").insert(rows);
    }
  }

  return profile as AdminProfile;
}

export async function updateUser(
  supabase: SupabaseClient,
  userId: string,
  data: UpdateUserInput,
  /**
   * Service-role client, used only to log a sale when a pack changes. Required
   * because `payments` is RLS-restricted to super_admins — without it a regular
   * admin's upgrade would update the profile but silently record no revenue.
   */
  adminSupabase?: SupabaseClient
): Promise<AdminProfile> {
  // `bill_plan_change` is a UI signal, not a column — strip it before the update.
  const { bill_plan_change: billPlanChange, ...profileFields } = data;

  // Read the packs as they stand *before* writing, so a sale is logged only when a
  // pack genuinely changes. Trusting the client's idea of the old value would let a
  // stale form double-bill a student.
  const { data: before } = await supabase
    .from("profiles")
    .select("assigned_plan_ee, assigned_plan_eo")
    .eq("id", userId)
    .single();

  const { data: profile, error } = await supabase
    .from("profiles")
    .update(profileFields)
    .eq("id", userId)
    .select()
    .single();

  if (error || !profile) {
    throw new Error(error?.message ?? "Failed to update user");
  }

  const updated = profile as AdminProfile;

  if (billPlanChange && before) {
    // One row per pack that actually changed, at that pack's own full price and
    // commission — so the dashboard's EE (35%) / EO (30%) split stays correct
    // without the rate ever being written out here.
    const changed: AssignedPlan[] = [];
    if (updated.assigned_plan_ee && updated.assigned_plan_ee !== before.assigned_plan_ee) {
      changed.push(updated.assigned_plan_ee);
    }
    if (updated.assigned_plan_eo && updated.assigned_plan_eo !== before.assigned_plan_eo) {
      changed.push(updated.assigned_plan_eo);
    }

    if (changed.length > 0) {
      const rows = changed.map((plan) => {
        const meta = getPlanMeta(plan);
        return {
          user_id: userId,
          student_name: updated.full_name,
          student_email: updated.email,
          plan,
          plan_price: meta.price,
          commission: meta.commission,
          payment_status: "confirmed",
        };
      });

      // Never let a failed sale log undo a successful profile update — the quota
      // change is what the student is waiting on. Surface it in the logs instead.
      const { error: payError } = await (adminSupabase ?? supabase)
        .from("payments")
        .insert(rows);
      if (payError) {
        console.error("[updateUser] plan change not recorded in payments:", payError, {
          userId,
          plans: changed,
        });
      }
    }
  }

  return updated;
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

export async function listOralCombinations(
  supabase: SupabaseClient,
  params: { search?: string; exam_type?: string; page: number; pageSize: number }
): Promise<AdminOralCombinationListResponse> {
  const { page, pageSize, search, exam_type } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("oral_combinations")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search) query = query.ilike("title", `%${search}%`);
  if (exam_type) query = query.eq("exam_type", exam_type);

  const { data, count } = await query;

  return {
    oralCombinations: (data ?? []) as OralCombination[],
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function createOralCombination(
  supabase: SupabaseClient,
  data: CreateOralCombinationInput
): Promise<OralCombination> {
  const { data: combo, error } = await supabase
    .from("oral_combinations")
    .insert({
      title: data.title,
      exam_type: data.exam_type,
      global_duration: data.global_duration,
      tasks: data.tasks as unknown as OralTasks,
    })
    .select()
    .single();

  if (error || !combo) throw new Error(error?.message ?? "Failed to create oral combination");
  return combo as OralCombination;
}

export async function updateOralCombination(
  supabase: SupabaseClient,
  combinationId: string,
  data: UpdateOralCombinationInput
): Promise<OralCombination> {
  const { data: combo, error } = await supabase
    .from("oral_combinations")
    .update(data as unknown as OralTasks)
    .eq("id", combinationId)
    .select()
    .single();

  if (error || !combo) throw new Error(error?.message ?? "Failed to update oral combination");
  return combo as OralCombination;
}

export async function deleteOralCombination(
  supabase: SupabaseClient,
  combinationId: string
): Promise<void> {
  const { error } = await supabase
    .from("oral_combinations")
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
       profile:profiles ( id, full_name, email, assigned_plan_ee, ee_simulations_remaining, ee_simulations_quota, expires_at )`,
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
      assignedPlan: (profile?.assigned_plan_ee as ActivityFeedRow["assignedPlan"]) ?? "PLAN_5000",
      simulationsRemaining: (profile?.ee_simulations_remaining as number) ?? 0,
      simulationsQuota: (profile?.ee_simulations_quota as number) ?? 0,
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
    .from("combination_evaluations")
    .select("cefr_level");

  const levelMap = new Map<string, number>();
  for (const row of evalData ?? []) {
    const lvl = toBaseCefrLevel(row.cefr_level as string);
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
