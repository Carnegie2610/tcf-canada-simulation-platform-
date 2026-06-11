export type UserRole = "student" | "admin" | "super_admin";
export type AssignedPlan =
  | "PLAN_5000"
  | "PLAN_10000"
  | "PLAN_15000"
  | "PLAN_20000";
export type ExamSection = "SECTION_A" | "SECTION_B";
export type ExamType = "TEF" | "TCF";
export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export type ErrorType =
  | "Grammaire"
  | "Orthographe"
  | "Syntaxe"
  | "Vocabulaire"
  | "Ponctuation";

export interface AdminProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  assigned_plan: AssignedPlan;
  simulations_quota: number;
  simulations_remaining: number;
  ai_corrections_enabled: boolean;
  expires_at: string;
  cohort_tag: string | null;
  created_at: string;
}

export interface Exam {
  id: string;
  title: string;
  section: ExamSection;
  exam_type: ExamType;
  prompt_text: string;
  min_words: number;
  max_duration: number;
  created_at: string;
}

export interface Submission {
  id: string;
  user_id: string;
  exam_id: string;
  user_draft: string;
  word_count: number;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  exam: Pick<Exam, "id" | "title" | "section" | "exam_type">;
}

export interface FeedbackCorrection {
  originalSegment: string;
  correctedSegment: string;
  errorType: ErrorType;
  explanationFr: string;
}

export interface JsonFeedback {
  corrections: FeedbackCorrection[];
}

export interface Evaluation {
  id: string;
  submission_id: string;
  cefr_level: CefrLevel;
  global_score: number;
  grammar_score: number;
  lexical_score: number;
  coherence_score: number;
  json_feedback: JsonFeedback;
  model_answer_c2: string;
  created_at: string;
}

export interface SubmissionWithEvaluation extends Submission {
  evaluation: Evaluation | null;
}

export interface CefrDataPoint {
  date: string;
  cefrLevel: CefrLevel;
  cefrNumeric: number;
  globalScore: number;
  examTitle: string;
}

export interface StudentAnalytics {
  averageGlobalScore: number | null;
  cohortAverageScore: number | null;
  scoreDelta: number | null;
  cefrProgression: CefrDataPoint[];
  completedCount: number;
  inProgressCount: number;
}

export interface StudentAuditData {
  profile: AdminProfile;
  submissions: SubmissionWithEvaluation[];
  analytics: StudentAnalytics;
}

export interface AdminUserListResponse {
  users: AdminProfile[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminExamListResponse {
  exams: Exam[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiSuccess<T> {
  data: T;
}

export interface ApiError {
  error: string;
  code: number;
}

export interface UserSearchParams {
  search?: string;
  exam_type?: ExamType;
  date_from?: string;
  date_to?: string;
  page: number;
  pageSize: number;
}

export interface ExamSearchParams {
  search?: string;
  section?: ExamSection;
  exam_type?: ExamType;
  page: number;
  pageSize: number;
}

export interface CreateUserInput {
  email: string;
  full_name: string;
  password: string;
  role: UserRole;
  assigned_plan: AssignedPlan;
  simulations_quota: number;
  ai_corrections_enabled: boolean;
  expires_at: string;
  cohort_tag: string | null;
}

export interface UpdateUserInput {
  email?: string;
  full_name?: string;
  role?: UserRole;
  assigned_plan?: AssignedPlan;
  simulations_quota?: number;
  simulations_remaining?: number;
  ai_corrections_enabled?: boolean;
  expires_at?: string;
  cohort_tag?: string | null;
}

export interface CreateExamInput {
  title: string;
  section: ExamSection;
  exam_type: ExamType;
  prompt_text: string;
  min_words: number;
  max_duration: number;
}

export interface UpdateExamInput {
  title?: string;
  section?: ExamSection;
  exam_type?: ExamType;
  prompt_text?: string;
  min_words?: number;
  max_duration?: number;
}

export interface CombinationTask {
  question: string;
  solution: string;
  minWords: number;
  maxWords: number;
}

export interface CombinationTasks {
  tache_1: CombinationTask;
  tache_2: CombinationTask;
  tache_3: CombinationTask;
}

export interface Combination {
  id: string;
  title: string;
  exam_type: ExamType;
  global_duration: number;
  tasks: CombinationTasks;
  created_at: string;
}

export interface AdminCombinationListResponse {
  combinations: Combination[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateCombinationInput {
  title: string;
  exam_type: ExamType;
  global_duration: number;
  tasks: CombinationTasks;
}

export interface UpdateCombinationInput {
  title?: string;
  exam_type?: ExamType;
  global_duration?: number;
  tasks?: CombinationTasks;
}

export interface CombinationSubmission {
  id: string;
  user_id: string;
  combination_id: string;
  draft_task_1: string;
  draft_task_2: string;
  draft_task_3: string;
  word_count_1: number;
  word_count_2: number;
  word_count_3: number;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

// ─── Dashboard types ────────────────────────────────────────────────────────

export type DashboardFilter = "today" | "yesterday" | "before_yesterday" | "all" | "custom";

export interface ActivityFeedRow {
  submissionId: string;
  userId: string;
  fullName: string;
  email: string;
  assignedPlan: AssignedPlan;
  simulationsRemaining: number;
  simulationsQuota: number;
  combinationTitle: string;
  createdAt: string;
  expiresAt: string;
}

export interface DashboardStats {
  studentsCount: number;
  studentsPrev: number;
  submissionsCount: number;
  submissionsPrev: number;
  combinationsCount: number;
  combinationsPrev: number;
}

export interface SubmissionsByDay {
  date: string;
  count: number;
}

export interface CefrDistributionItem {
  level: CefrLevel;
  count: number;
}

export interface TaskPerformancePoint {
  task: "Tâche 1" | "Tâche 2" | "Tâche 3";
  avgScore: number | null;
}
