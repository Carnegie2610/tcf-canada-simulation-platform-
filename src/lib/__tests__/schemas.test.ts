import { describe, it, expect } from "vitest";
import {
  CombinationTaskEvalSchema,
  COMBINATION_TASK_EVAL_KEYS,
  buildCombinationTaskJsonSchema,
} from "../schemas";

describe("buildCombinationTaskJsonSchema", () => {
  it("declares exactly the same keys as CombinationTaskEvalSchema, so the two never drift", () => {
    const zodKeys = Object.keys(CombinationTaskEvalSchema.shape).sort();
    expect([...COMBINATION_TASK_EVAL_KEYS].sort()).toEqual(zodKeys);

    const { schema } = buildCombinationTaskJsonSchema("task_1_evaluation");
    const taskSchema = (schema.properties as Record<string, { properties: Record<string, unknown> }>)
      .task_1_evaluation;
    expect(Object.keys(taskSchema.properties).sort()).toEqual(zodKeys);
  });

  it("marks every property required (OpenAI strict mode rejects a partial `required` list)", () => {
    const { schema } = buildCombinationTaskJsonSchema("task_2_evaluation");
    const taskSchema = (schema.properties as unknown as Record<string, { required: string[]; properties: object }>)
      .task_2_evaluation;
    expect([...taskSchema.required].sort()).toEqual(Object.keys(taskSchema.properties).sort());
  });

  it("keeps version_corrigee_et_amelioree a plain required string, never nullable", () => {
    const { schema } = buildCombinationTaskJsonSchema("task_1_evaluation");
    const taskSchema = (schema.properties as Record<string, { properties: Record<string, { type: unknown }> }>)
      .task_1_evaluation;
    expect(taskSchema.properties.version_corrigee_et_amelioree.type).toBe("string");
  });

  it("wraps the schema under the given jsonKey", () => {
    const wrapped = buildCombinationTaskJsonSchema("task_3_evaluation");
    expect(wrapped.schema.required).toEqual(["task_3_evaluation"]);
    expect(Object.keys(wrapped.schema.properties)).toEqual(["task_3_evaluation"]);
  });
});

describe("CombinationTaskEvalSchema", () => {
  const baseFields = {
    score: "14.5/20",
    consigne: "Consigne de test",
    votre_texte: "Texte du candidat",
    comprehension_du_sujet: "Bonne",
    respect_de_methodologie: "Respectee",
    niveau_linguistique: "B2",
    appreciation_generale: "Correct",
    correction_orthographique: [],
    version_corrigee_et_amelioree: "Version corrigee.",
  };

  it("accepts null for the previously-optional fields and normalizes them to defaults", () => {
    const result = CombinationTaskEvalSchema.parse({
      ...baseFields,
      pertinence_verdict: null,
      points_forts: null,
      priorites_a_travailler: null,
      erreurs_recurrentes: null,
      analyse_longueur: null,
      registre_et_tonalite: null,
      enrichissement_lexical: null,
      connecteurs_logiques: null,
      exercice_recommande: null,
      comparaison_niveau_vise: null,
    });

    expect(result.pertinence_verdict).toBe("");
    expect(result.points_forts).toEqual([]);
    expect(result.connecteurs_logiques).toEqual({ utilises: [], manquants: [] });
  });

  it("still rejects a response missing version_corrigee_et_amelioree entirely", () => {
    const { version_corrigee_et_amelioree, ...withoutField } = baseFields;
    void version_corrigee_et_amelioree;
    const result = CombinationTaskEvalSchema.safeParse(withoutField);
    expect(result.success).toBe(false);
  });
});
