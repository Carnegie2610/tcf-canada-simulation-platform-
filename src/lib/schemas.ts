import { z } from "zod";

const cleanTextRegex = /^[^<>]*$/;

export const SubmissionInputSchema = z.object({
  userId: z.string().uuid({ message: "Invalid candidate identifier format." }),
  examId: z.string().uuid({ message: "Invalid exam subject identifier." }),
  userDraft: z
    .string()
    .min(10, { message: "The submission draft is too short to be evaluated." })
    .max(8000, { message: "Draft exceeds the maximum allowed character limit." })
    .refine((val) => cleanTextRegex.test(val), {
      message: "Security risk: Input contains restricted characters (< or > tags).",
    }),
  wordCount: z
    .number()
    .int()
    .nonnegative()
    .min(1, { message: "Word count verification failed." }),
});

export const DiagnosticReportSchema = z.object({
  cefrLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  globalScore: z.number().min(0).max(100),
  criteriaMetrics: z.object({
    grammarScore: z.number().min(0).max(20),
    lexicalScore: z.number().min(0).max(20),
    coherenceScore: z.number().min(0).max(20),
  }),
  corrections: z.array(
    z.object({
      originalSegment: z.string().min(1, "Original phrase anchor must be provided."),
      correctedSegment: z.string().min(1, "Corrected alternative must be provided."),
      errorType: z.enum(["Grammaire", "Orthographe", "Syntaxe", "Vocabulaire", "Ponctuation"]),
      explanationFr: z.string().min(1, "Explanation comments must be in French."),
    })
  ),
  modelAnswerC2: z.string().min(50, "C2 Model Answer version is incomplete or too short."),
});

export type SubmissionInput = z.infer<typeof SubmissionInputSchema>;
export type DiagnosticReport = z.infer<typeof DiagnosticReportSchema>;
