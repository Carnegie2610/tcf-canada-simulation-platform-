import { z } from "zod";

export const UserSearchParamsSchema = z.object({
  search: z.string().max(100).optional(),
  exam_type: z.enum(["TEF", "TCF"]).optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const ASSIGNED_PLAN_EE_VALUES = [
  "PLAN_2000", "PLAN_3000", "PLAN_5000", "PLAN_10000", "PLAN_30000",
] as const;
const ASSIGNED_PLAN_EO_VALUES = [
  "PLAN_EO_2000", "PLAN_EO_3000", "PLAN_EO_5000", "PLAN_EO_10000",
] as const;

// assigned_plan_ee/assigned_plan_eo/ee_simulations_quota/eo_simulations_quota/expires_at are
// nullable because staff accounts (admin/super_admin) have no subscription plan; the .refine()
// below keeps them required for students, matching the DB-level chk_students_require_plan
// constraint. EE and EO packs are picked independently — a student can have either or both,
// no more single joint "Mix" plan.
export const CreateUserSchema = z
  .object({
    email: z.string().email(),
    full_name: z.string().min(2).max(255),
    password: z.string().min(8),
    role: z.enum(["student", "admin", "super_admin"]).default("student"),
    assigned_plan_ee: z.enum(ASSIGNED_PLAN_EE_VALUES).nullable().optional(),
    assigned_plan_eo: z.enum(ASSIGNED_PLAN_EO_VALUES).nullable().optional(),
    ee_simulations_quota: z.number().int().min(0).max(500).nullable().optional(),
    eo_simulations_quota: z.number().int().min(0).max(500).nullable().optional(),
    ai_corrections_enabled: z.boolean().default(false),
    expires_at: z.string().datetime().nullable().optional(),
    cohort_tag: z.string().max(100).nullable().default(null),
  })
  .refine(
    (data) =>
      data.role !== "student" ||
      ((data.assigned_plan_ee != null || data.assigned_plan_eo != null) &&
        data.ee_simulations_quota != null &&
        data.eo_simulations_quota != null &&
        data.expires_at != null),
    {
      message: "Un compte étudiant doit avoir au moins un pack (EE ou EO), un quota et une date d'expiration.",
      path: ["assigned_plan_ee"],
    }
  );

export const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  full_name: z.string().min(2).max(255).optional(),
  role: z.enum(["student", "admin", "super_admin"]).optional(),
  assigned_plan_ee: z.enum(ASSIGNED_PLAN_EE_VALUES).nullable().optional(),
  assigned_plan_eo: z.enum(ASSIGNED_PLAN_EO_VALUES).nullable().optional(),
  ee_simulations_quota: z.number().int().min(0).max(500).nullable().optional(),
  ee_simulations_remaining: z.number().int().min(0).nullable().optional(),
  eo_simulations_quota: z.number().int().min(0).max(500).nullable().optional(),
  eo_simulations_remaining: z.number().int().min(0).nullable().optional(),
  ai_corrections_enabled: z.boolean().optional(),
  expires_at: z.string().datetime().nullable().optional(),
  cohort_tag: z.string().max(100).nullable().optional(),
});

export const ExamSearchParamsSchema = z.object({
  search: z.string().max(100).optional(),
  section: z.enum(["SECTION_A", "SECTION_B"]).optional(),
  exam_type: z.enum(["TEF", "TCF"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const CreateExamSchema = z.object({
  title: z.string().min(3).max(255),
  section: z.enum(["SECTION_A", "SECTION_B"]),
  exam_type: z.enum(["TEF", "TCF"]),
  prompt_text: z.string().min(20),
  min_words: z.number().int().min(50).max(1000),
  max_duration: z.number().int().min(5).max(180),
});

export const UpdateExamSchema = CreateExamSchema.partial();

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type CreateExamInput = z.infer<typeof CreateExamSchema>;
export type UpdateExamInput = z.infer<typeof UpdateExamSchema>;
export type UserSearchParams = z.infer<typeof UserSearchParamsSchema>;
export type ExamSearchParams = z.infer<typeof ExamSearchParamsSchema>;

const CombinationTaskSchema = z
  .object({
    question: z.string().min(10),
    solution: z.string().min(10),
    minWords: z.number().int().min(1),
    maxWords: z.number().int().min(1),
  })
  .refine((t) => t.maxWords > t.minWords, {
    message: "Max mots doit être supérieur au min",
    path: ["maxWords"],
  });

export const CreateCombinationSchema = z.object({
  title: z.string().min(3).max(255),
  exam_type: z.enum(["TEF", "TCF"]),
  global_duration: z.number().int().min(1).max(300),
  tasks: z.object({
    tache_1: CombinationTaskSchema,
    tache_2: CombinationTaskSchema,
    tache_3: CombinationTaskSchema,
  }),
});

export const CombinationSearchParamsSchema = z.object({
  search: z.string().max(100).optional(),
  exam_type: z.enum(["TEF", "TCF"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const UpdateCombinationSchema = CreateCombinationSchema.partial();

export type CreateCombinationInput = z.infer<typeof CreateCombinationSchema>;
export type UpdateCombinationInput = z.infer<typeof UpdateCombinationSchema>;
export type CombinationSearchParams = z.infer<typeof CombinationSearchParamsSchema>;

const OralTaskSchema = z.object({
  question: z.string().min(10),
  solution: z.string().min(10),
  prepTimeSeconds: z.number().int().min(0).max(120),
  speakingTimeSeconds: z.number().int().min(30).max(300),
});

export const CreateOralCombinationSchema = z.object({
  title: z.string().min(3).max(255),
  exam_type: z.enum(["TEF", "TCF"]),
  global_duration: z.number().int().min(1).max(60),
  tasks: z.object({
    tache_1: OralTaskSchema,
    tache_2: OralTaskSchema,
    tache_3: OralTaskSchema,
  }),
});

export const OralCombinationSearchParamsSchema = z.object({
  search: z.string().max(100).optional(),
  exam_type: z.enum(["TEF", "TCF"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const UpdateOralCombinationSchema = CreateOralCombinationSchema.partial();

export type CreateOralCombinationInput = z.infer<typeof CreateOralCombinationSchema>;
export type UpdateOralCombinationInput = z.infer<typeof UpdateOralCombinationSchema>;
export type OralCombinationSearchParams = z.infer<typeof OralCombinationSearchParamsSchema>;
