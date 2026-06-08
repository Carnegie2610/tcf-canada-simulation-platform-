import Link from "next/link";
import type { SubmissionWithEvaluation } from "@/lib/admin/types";
import { cefrColorClass } from "@/lib/admin/cefr";

interface SubmissionHistoryRowProps {
  submission: SubmissionWithEvaluation;
}

const sectionLabel: Record<string, string> = {
  SECTION_A: "Sec. A",
  SECTION_B: "Sec. B",
};

export function SubmissionHistoryRow({ submission }: SubmissionHistoryRowProps) {
  const date = new Date(submission.created_at).toLocaleDateString("fr-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const evalData = submission.evaluation;

  return (
    <div className="flex items-center gap-4 rounded-lg border border-[var(--slate-700)] bg-[var(--slate-900)] px-4 py-3 hover:border-[var(--slate-600)] transition-colors">
      {/* Exam info */}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-[var(--brand-white)]">
          {submission.exam.title}
        </p>
        <p className="text-xs text-[var(--slate-500)] mt-0.5">
          {submission.exam.exam_type} · {sectionLabel[submission.exam.section] ?? submission.exam.section} · {date}
        </p>
      </div>

      {/* Score / CEFR */}
      {evalData ? (
        <div className="flex items-center gap-3 shrink-0">
          <span
            className={`text-xs font-semibold rounded px-2 py-0.5 ${cefrColorClass(evalData.cefr_level)}`}
          >
            {evalData.cefr_level}
          </span>
          <span className="text-sm font-bold text-[var(--brand-white)]">
            {evalData.global_score}/100
          </span>
        </div>
      ) : (
        <span className="text-xs text-[var(--slate-500)] shrink-0">Non évalué</span>
      )}

      {/* Link */}
      <Link
        href={`/dashboard/history/${submission.id}`}
        className="shrink-0 text-xs font-medium text-[var(--blue-500)] hover:text-[var(--blue-400)] transition-colors"
      >
        Voir détail →
      </Link>
    </div>
  );
}
