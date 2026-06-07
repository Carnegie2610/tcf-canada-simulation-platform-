import { z } from "zod";

export const UserSearchParamsSchema = z.object({
  search: z.string().max(100).optional(),
  exam_type: z.enum(["TEF", "TCF"]).optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const CreateUserSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2).max(255),
  password: z.string().min(8),
  role: z.enum(["student", "admin", "super_admin"]).default("student"),
  assigned_plan: z.enum(["PLAN_5000", "PLAN_10000", "PLAN_15000", "PLAN_20000"]),
  simulations_quota: z.number().int().min(1).max(500),
  ai_corrections_enabled: z.boolean().default(false),
  expires_at: z.string().datetime(),
  cohort_tag: z.string().max(100).nullable().default(null),
});

export const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  full_name: z.string().min(2).max(255).optional(),
  role: z.enum(["student", "admin", "super_admin"]).optional(),
  assigned_plan: z.enum(["PLAN_5000", "PLAN_10000", "PLAN_15000", "PLAN_20000"]).optional(),
  simulations_quota: z.number().int().min(1).max(500).optional(),
  simulations_remaining: z.number().int().min(0).optional(),
  ai_corrections_enabled: z.boolean().optional(),
  expires_at: z.string().datetime().optional(),
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
