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
  // Nullable (not optional) + transform-to-default: OpenAI structured-outputs strict mode
  // requires every key to be present in "required", so the model must emit `null` rather
  // than omit the key. Plain z.string()/z.array().optional() keys are indistinguishable
  // from "may be omitted" in that mode, which is how version_corrigee_et_amelioree used to
  // go missing. See buildCombinationTaskJsonSchema below, which mirrors this shape.
  pertinence_verdict: z.string().nullable().transform((v) => v ?? ""),
  points_forts: z.array(z.string()).nullable().transform((v) => v ?? []),
  priorites_a_travailler: z.array(z.string()).nullable().transform((v) => v ?? []),
  erreurs_recurrentes: z
    .array(CombinationErreurRecurrenteSchema)
    .nullable()
    .transform((v) => v ?? []),
  analyse_longueur: z.string().nullable().transform((v) => v ?? ""),
  registre_et_tonalite: z.string().nullable().transform((v) => v ?? ""),
  enrichissement_lexical: z
    .array(CombinationEnrichissementLexicalItemSchema)
    .nullable()
    .transform((v) => v ?? []),
  connecteurs_logiques: CombinationConnecteursLogiquesSchema.nullable().transform(
    (v) => v ?? { utilises: [], manquants: [] }
  ),
  exercice_recommande: z.string().nullable().transform((v) => v ?? ""),
  comparaison_niveau_vise: z.string().nullable().transform((v) => v ?? ""),
  version_corrigee_et_amelioree: z.string(),
});

/**
 * Field keys of CombinationTaskEvalSchema, kept next to buildCombinationTaskJsonSchema so a
 * unit test can assert the hand-authored JSON Schema below never drifts from the Zod schema.
 */
export const COMBINATION_TASK_EVAL_KEYS = [
  "score",
  "consigne",
  "votre_texte",
  "comprehension_du_sujet",
  "respect_de_methodologie",
  "niveau_linguistique",
  "appreciation_generale",
  "correction_orthographique",
  "pertinence_verdict",
  "points_forts",
  "priorites_a_travailler",
  "erreurs_recurrentes",
  "analyse_longueur",
  "registre_et_tonalite",
  "enrichissement_lexical",
  "connecteurs_logiques",
  "exercice_recommande",
  "comparaison_niveau_vise",
  "version_corrigee_et_amelioree",
] as const;

const NULLABLE_STRING = { type: ["string", "null"] } as const;
const NULLABLE_STRING_ARRAY = { type: ["array", "null"], items: { type: "string" } } as const;

/**
 * JSON Schema for CombinationTaskEvalSchema, for OpenAI's Structured Outputs strict mode
 * (response_format: { type: "json_schema", json_schema: { strict: true, ... } }).
 * Strict mode requires every property to be listed in `required` and every object to set
 * `additionalProperties: false` — optionality is expressed via nullable types instead of
 * omitting keys, which is what guarantees version_corrigee_et_amelioree (and every other
 * field) is always present in the model's response.
 */
function combinationTaskEvalJsonSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: COMBINATION_TASK_EVAL_KEYS,
    properties: {
      score: { type: "string" },
      consigne: { type: "string" },
      votre_texte: { type: "string" },
      comprehension_du_sujet: { type: "string" },
      respect_de_methodologie: { type: "string" },
      niveau_linguistique: { type: "string" },
      appreciation_generale: { type: "string" },
      correction_orthographique: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["erreur", "correction", "type", "explication"],
          properties: {
            erreur: { type: "string" },
            correction: { type: "string" },
            type: { type: "string" },
            explication: { type: "string" },
          },
        },
      },
      pertinence_verdict: NULLABLE_STRING,
      points_forts: NULLABLE_STRING_ARRAY,
      priorites_a_travailler: NULLABLE_STRING_ARRAY,
      erreurs_recurrentes: {
        type: ["array", "null"],
        items: {
          type: "object",
          additionalProperties: false,
          required: ["pattern", "occurrences", "exemples"],
          properties: {
            pattern: { type: "string" },
            occurrences: { type: "number" },
            exemples: { type: "array", items: { type: "string" } },
          },
        },
      },
      analyse_longueur: NULLABLE_STRING,
      registre_et_tonalite: NULLABLE_STRING,
      enrichissement_lexical: {
        type: ["array", "null"],
        items: {
          type: "object",
          additionalProperties: false,
          required: ["mot_utilise", "suggestion", "explication"],
          properties: {
            mot_utilise: { type: "string" },
            suggestion: { type: "string" },
            explication: { type: "string" },
          },
        },
      },
      connecteurs_logiques: {
        type: ["object", "null"],
        additionalProperties: false,
        required: ["utilises", "manquants"],
        properties: {
          utilises: { type: "array", items: { type: "string" } },
          manquants: { type: "array", items: { type: "string" } },
        },
      },
      exercice_recommande: NULLABLE_STRING,
      comparaison_niveau_vise: NULLABLE_STRING,
      version_corrigee_et_amelioree: { type: "string" },
    },
  } as const;
}

/**
 * Wraps CombinationTaskEvalSchema's JSON Schema under `{"<jsonKey>": {...}}`, matching the
 * `{"task_N_evaluation": {...}}` shape the evaluate route's prompt asks the model for. Pass
 * this to callAI's `structuredOutput` option to make OpenAI's strict mode guarantee it.
 */
export function buildCombinationTaskJsonSchema(jsonKey: string) {
  return {
    name: "task_evaluation",
    schema: {
      type: "object",
      additionalProperties: false,
      required: [jsonKey],
      properties: {
        [jsonKey]: combinationTaskEvalJsonSchema(),
      },
    },
  };
}

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

// ── Oral (Expression Orale) AI Evaluation ──────────────────────────────────

export const OralTaskEvalSchema = z.object({
  score: z.preprocess((val) => coerceScoreString(val), z.string()),
  consigne: z.string(),
  transcript: z.string(),
  comprehension_du_sujet: z.string(),
  respect_de_methodologie: z.string(),
  niveau_linguistique: z.string(),
  fluidite: z.string(),
  prononciation_et_intonation: z.string(),
  appreciation_generale: z.string(),
  pertinence_verdict: z.string().nullable().transform((v) => v ?? ""),
  points_forts: z.array(z.string()).nullable().transform((v) => v ?? []),
  priorites_a_travailler: z.array(z.string()).nullable().transform((v) => v ?? []),
  erreurs_recurrentes: z
    .array(CombinationErreurRecurrenteSchema)
    .nullable()
    .transform((v) => v ?? []),
  registre_et_tonalite: z.string().nullable().transform((v) => v ?? ""),
  connecteurs_logiques: CombinationConnecteursLogiquesSchema.nullable().transform(
    (v) => v ?? { utilises: [], manquants: [] }
  ),
  exercice_recommande: z.string().nullable().transform((v) => v ?? ""),
  comparaison_niveau_vise: z.string().nullable().transform((v) => v ?? ""),
});

/**
 * Field keys of OralTaskEvalSchema, kept next to buildOralTaskJsonSchema so a unit test can
 * assert the hand-authored JSON Schema below never drifts from the Zod schema (same rationale
 * as COMBINATION_TASK_EVAL_KEYS above).
 */
export const ORAL_TASK_EVAL_KEYS = [
  "score",
  "consigne",
  "transcript",
  "comprehension_du_sujet",
  "respect_de_methodologie",
  "niveau_linguistique",
  "fluidite",
  "prononciation_et_intonation",
  "appreciation_generale",
  "pertinence_verdict",
  "points_forts",
  "priorites_a_travailler",
  "erreurs_recurrentes",
  "registre_et_tonalite",
  "connecteurs_logiques",
  "exercice_recommande",
  "comparaison_niveau_vise",
] as const;

function oralTaskEvalJsonSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ORAL_TASK_EVAL_KEYS,
    properties: {
      score: { type: "string" },
      consigne: { type: "string" },
      transcript: { type: "string" },
      comprehension_du_sujet: { type: "string" },
      respect_de_methodologie: { type: "string" },
      niveau_linguistique: { type: "string" },
      fluidite: { type: "string" },
      prononciation_et_intonation: { type: "string" },
      appreciation_generale: { type: "string" },
      pertinence_verdict: NULLABLE_STRING,
      points_forts: NULLABLE_STRING_ARRAY,
      priorites_a_travailler: NULLABLE_STRING_ARRAY,
      erreurs_recurrentes: {
        type: ["array", "null"],
        items: {
          type: "object",
          additionalProperties: false,
          required: ["pattern", "occurrences", "exemples"],
          properties: {
            pattern: { type: "string" },
            occurrences: { type: "number" },
            exemples: { type: "array", items: { type: "string" } },
          },
        },
      },
      registre_et_tonalite: NULLABLE_STRING,
      connecteurs_logiques: {
        type: ["object", "null"],
        additionalProperties: false,
        required: ["utilises", "manquants"],
        properties: {
          utilises: { type: "array", items: { type: "string" } },
          manquants: { type: "array", items: { type: "string" } },
        },
      },
      exercice_recommande: NULLABLE_STRING,
      comparaison_niveau_vise: NULLABLE_STRING,
    },
  } as const;
}

/**
 * Wraps OralTaskEvalSchema's JSON Schema under `{"<jsonKey>": {...}}`, matching the
 * `{"task_N_evaluation": {...}}` shape the oral evaluate route's prompt asks the model for.
 */
export function buildOralTaskJsonSchema(jsonKey: string) {
  return {
    name: "oral_task_evaluation",
    schema: {
      type: "object",
      additionalProperties: false,
      required: [jsonKey],
      properties: {
        [jsonKey]: oralTaskEvalJsonSchema(),
      },
    },
  };
}

export const OralDiagnosticReportSchema = z.object({
  global_metrics: z.object({
    score_final: z.preprocess((val) => coerceScoreString(val, "/20"), z.string()),
    niveau_cecr: z.string(),
    appreciation: z.string(),
  }),
  task_1_evaluation: OralTaskEvalSchema,
  task_2_evaluation: OralTaskEvalSchema,
  task_3_evaluation: OralTaskEvalSchema,
});

export type OralDiagnosticReport = z.infer<typeof OralDiagnosticReportSchema>;
export type OralTaskEval = z.infer<typeof OralTaskEvalSchema>;
