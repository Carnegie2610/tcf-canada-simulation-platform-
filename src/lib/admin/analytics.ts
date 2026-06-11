import { cefrToNumeric } from "./cefr";
import type {
  CefrDataPoint,
  CombinationSubmission,
  StudentAnalytics,
  SubmissionWithEvaluation,
  TaskPerformancePoint,
} from "./types";
import type { ActivityDay } from "@/components/organisms/student/ConsistencyTracker";

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

const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"] as const;

export function computeActivityDays(
  combinationSubs: CombinationSubmission[]
): ActivityDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (6 - i));
    const dayStr = day.toISOString().slice(0, 10);

    const daySubs = combinationSubs.filter(
      (s) => s.created_at.slice(0, 10) === dayStr
    );

    let taskLevel: 0 | 1 | 2 | 3 = 0;
    if (daySubs.some((s) => s.is_completed)) {
      taskLevel = 3;
    } else if (daySubs.some((s) => s.word_count_2 > 0 || (s.draft_task_2 && s.draft_task_2.length > 0))) {
      taskLevel = 2;
    } else if (daySubs.some((s) => s.word_count_1 > 0 || (s.draft_task_1 && s.draft_task_1.length > 0))) {
      taskLevel = 1;
    }

    return { dayLabel: DAY_LABELS[day.getDay()], taskLevel };
  });
}

export function computeTaskPerformance(
  submissions: SubmissionWithEvaluation[]
): TaskPerformancePoint[] {
  const withEval = submissions.filter(
    (s) => s.is_completed && s.evaluation !== null
  );

  if (withEval.length === 0) {
    return [
      { task: "Tâche 1", avgScore: null },
      { task: "Tâche 2", avgScore: null },
      { task: "Tâche 3", avgScore: null },
    ];
  }

  const grammarAvg =
    withEval.reduce((sum, s) => sum + s.evaluation!.grammar_score, 0) /
    withEval.length;
  const lexicalAvg =
    withEval.reduce((sum, s) => sum + s.evaluation!.lexical_score, 0) /
    withEval.length;
  const coherenceAvg =
    withEval.reduce((sum, s) => sum + s.evaluation!.coherence_score, 0) /
    withEval.length;

  return [
    { task: "Tâche 1", avgScore: Math.round(grammarAvg * 10) / 10 },
    { task: "Tâche 2", avgScore: Math.round(lexicalAvg * 10) / 10 },
    { task: "Tâche 3", avgScore: Math.round(coherenceAvg * 10) / 10 },
  ];
}
