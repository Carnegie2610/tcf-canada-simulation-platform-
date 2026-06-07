import { describe, it, expect } from "vitest";
import { computeStudentAnalytics } from "../analytics";
import type { SubmissionWithEvaluation } from "../types";

function makeSubmission(
  overrides: Partial<SubmissionWithEvaluation> = {}
): SubmissionWithEvaluation {
  return {
    id: "sub-1",
    user_id: "user-1",
    exam_id: "exam-1",
    user_draft: "Lorem ipsum",
    word_count: 100,
    is_completed: true,
    completed_at: "2024-01-01T00:00:00Z",
    created_at: "2024-01-01T00:00:00Z",
    exam: { id: "exam-1", title: "Test", section: "SECTION_A", exam_type: "TEF" },
    evaluation: {
      id: "eval-1",
      submission_id: "sub-1",
      cefr_level: "B2",
      global_score: 70,
      grammar_score: 14,
      lexical_score: 13,
      coherence_score: 12,
      json_feedback: { corrections: [] },
      model_answer_c2: "Model answer text here.",
      created_at: "2024-01-02T00:00:00Z",
    },
    ...overrides,
  };
}

describe("computeStudentAnalytics", () => {
  it("returns all nulls for empty submissions", () => {
    const result = computeStudentAnalytics([], []);
    expect(result.averageGlobalScore).toBeNull();
    expect(result.cohortAverageScore).toBeNull();
    expect(result.scoreDelta).toBeNull();
    expect(result.cefrProgression).toHaveLength(0);
    expect(result.completedCount).toBe(0);
    expect(result.inProgressCount).toBe(0);
  });

  it("calculates average global score from completed submissions", () => {
    const subs = [
      makeSubmission({ id: "s1", evaluation: { ...makeSubmission().evaluation!, global_score: 60 } }),
      makeSubmission({ id: "s2", evaluation: { ...makeSubmission().evaluation!, global_score: 80 } }),
    ];
    const result = computeStudentAnalytics(subs, []);
    expect(result.averageGlobalScore).toBeCloseTo(70);
    expect(result.completedCount).toBe(2);
  });

  it("correctly counts in-progress submissions", () => {
    const inProgress = makeSubmission({ id: "ip", is_completed: false, evaluation: null });
    const done = makeSubmission({ id: "d1" });
    const result = computeStudentAnalytics([inProgress, done], []);
    expect(result.inProgressCount).toBe(1);
    expect(result.completedCount).toBe(1);
  });

  it("excludes in-progress from cefrProgression", () => {
    const inProgress = makeSubmission({ id: "ip", is_completed: false, evaluation: null });
    const done = makeSubmission({ id: "d1", evaluation: { ...makeSubmission().evaluation!, cefr_level: "B1" } });
    const result = computeStudentAnalytics([inProgress, done], []);
    expect(result.cefrProgression).toHaveLength(1);
    expect(result.cefrProgression[0].cefrLevel).toBe("B1");
  });

  it("returns null cohortAverageScore when cohortScores is empty", () => {
    const result = computeStudentAnalytics([makeSubmission()], []);
    expect(result.cohortAverageScore).toBeNull();
    expect(result.scoreDelta).toBeNull();
  });

  it("calculates cohort average and delta", () => {
    const result = computeStudentAnalytics([makeSubmission()], [60, 80]);
    expect(result.cohortAverageScore).toBeCloseTo(70);
    expect(result.scoreDelta).toBeCloseTo(70 - 70); // studentAvg=70, cohortAvg=70
  });

  it("scoreDelta is positive when student is above cohort", () => {
    const sub = makeSubmission({ evaluation: { ...makeSubmission().evaluation!, global_score: 90 } });
    const result = computeStudentAnalytics([sub], [60]);
    expect(result.scoreDelta).toBeCloseTo(30);
  });

  it("scoreDelta is negative when student is below cohort", () => {
    const sub = makeSubmission({ evaluation: { ...makeSubmission().evaluation!, global_score: 40 } });
    const result = computeStudentAnalytics([sub], [80]);
    expect(result.scoreDelta).toBeCloseTo(-40);
  });

  it("cefrProgression is sorted ascending by date", () => {
    const s1 = makeSubmission({
      id: "s1",
      evaluation: {
        ...makeSubmission().evaluation!,
        created_at: "2024-03-01T00:00:00Z",
        cefr_level: "C1",
      },
    });
    const s2 = makeSubmission({
      id: "s2",
      evaluation: {
        ...makeSubmission().evaluation!,
        created_at: "2024-01-01T00:00:00Z",
        cefr_level: "B1",
      },
    });
    const result = computeStudentAnalytics([s1, s2], []);
    expect(result.cefrProgression[0].cefrLevel).toBe("B1");
    expect(result.cefrProgression[1].cefrLevel).toBe("C1");
  });
});
