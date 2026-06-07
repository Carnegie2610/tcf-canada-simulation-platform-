import { cefrToNumeric } from "./cefr";
import type { CefrDataPoint, StudentAnalytics, SubmissionWithEvaluation } from "./types";

export function computeStudentAnalytics(
  submissions: SubmissionWithEvaluation[],
  cohortScores: number[]
): StudentAnalytics {
  const completedWithEval = submissions.filter(
    (s) => s.is_completed && s.evaluation !== null
  );
  const inProgressCount = submissions.filter((s) => !s.is_completed).length;

  const averageGlobalScore =
    completedWithEval.length === 0
      ? null
      : completedWithEval.reduce((sum, s) => sum + s.evaluation!.global_score, 0) /
        completedWithEval.length;

  const cohortAverageScore =
    cohortScores.length === 0
      ? null
      : cohortScores.reduce((a, b) => a + b, 0) / cohortScores.length;

  const scoreDelta =
    averageGlobalScore !== null && cohortAverageScore !== null
      ? averageGlobalScore - cohortAverageScore
      : null;

  const cefrProgression: CefrDataPoint[] = completedWithEval
    .map((s) => ({
      date: s.evaluation!.created_at,
      cefrLevel: s.evaluation!.cefr_level,
      cefrNumeric: cefrToNumeric(s.evaluation!.cefr_level),
      globalScore: s.evaluation!.global_score,
      examTitle: s.exam.title,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return {
    averageGlobalScore,
    cohortAverageScore,
    scoreDelta,
    cefrProgression,
    completedCount: completedWithEval.length,
    inProgressCount,
  };
}
