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

// ── Combination AI Evaluation ──────────────────────────────────────────────

/** Coerce numeric AI scores into the "X.X/N" string format models sometimes skip. */
function coerceScoreString(val: unknown, suffix?: string): unknown {
  if (typeof val === "number" && !Number.isNaN(val)) {
    const formatted = Number.isInteger(val) ? String(val) : val.toFixed(1);
    return suffix ? `${formatted}${suffix}` : formatted;
  }
  if (typeof val === "string" && suffix && val.length > 0 && !val.includes("/")) {
    return `${val}${suffix}`;
  }
  return val;
}

const CombinationOrthoItemSchema = z.object({
  erreur: z.string(),
  correction: z.string(),
  type: z.string(),
  explication: z.string(),
});

const CombinationErreurRecurrenteSchema = z.object({
  pattern: z.string(),
  occurrences: z.coerce.number(),
  exemples: z.array(z.string()),
});

const CombinationEnrichissementLexicalItemSchema = z.object({
  mot_utilise: z.string(),
  suggestion: z.string(),
  explication: z.string(),
});

const CombinationConnecteursLogiquesSchema = z.object({
  utilises: z.array(z.string()),
  manquants: z.array(z.string()),
});

export const CombinationTaskEvalSchema = z.object({
  score: z.preprocess((val) => coerceScoreString(val), z.string()),
  consigne: z.string(),
  votre_texte: z.string(),
  comprehension_du_sujet: z.string(),
  respect_de_methodologie: z.string(),
  niveau_linguistique: z.string(),
  appreciation_generale: z.string(),
  correction_orthographique: z.array(CombinationOrthoItemSchema),
  pertinence_verdict: z.string().optional().default(""),
  points_forts: z.array(z.string()).optional().default([]),
  priorites_a_travailler: z.array(z.string()).optional().default([]),
  erreurs_recurrentes: z.array(CombinationErreurRecurrenteSchema).optional().default([]),
  analyse_longueur: z.string().optional().default(""),
  registre_et_tonalite: z.string().optional().default(""),
  enrichissement_lexical: z.array(CombinationEnrichissementLexicalItemSchema).optional().default([]),
  connecteurs_logiques: CombinationConnecteursLogiquesSchema.optional().default({
    utilises: [],
    manquants: [],
  }),
  exercice_recommande: z.string().optional().default(""),
  comparaison_niveau_vise: z.string().optional().default(""),
  version_corrigee_et_amelioree: z.string(),
});

export const CombinationEvaluationSchema = z.object({
  global_metrics: z.object({
    score_final: z.preprocess((val) => coerceScoreString(val, "/20"), z.string()),
    niveau_cecr: z.string(),
    appreciation: z.string(),
  }),
  task_1_evaluation: CombinationTaskEvalSchema,
  task_2_evaluation: CombinationTaskEvalSchema,
  task_3_evaluation: CombinationTaskEvalSchema,
});

export type CombinationEvaluation = z.infer<typeof CombinationEvaluationSchema>;
export type CombinationTaskEval = z.infer<typeof CombinationTaskEvalSchema>;
