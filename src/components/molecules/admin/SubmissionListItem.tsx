import { CefrBadge } from "@/components/atoms/CefrBadge";
import type { SubmissionWithEvaluation } from "@/lib/admin/types";

interface SubmissionListItemProps {
  submission: SubmissionWithEvaluation;
  onOpen: (submission: SubmissionWithEvaluation) => void;
}

export function SubmissionListItem({ submission, onOpen }: SubmissionListItemProps) {
  const isInProgress = !submission.is_completed;
  const hasEval = submission.evaluation !== null;

  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--slate-700)] bg-[var(--slate-800)]/50 px-4 py-3 gap-4">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-[var(--brand-white)] text-sm">
          {submission.exam?.title ?? "Examen inconnu"}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="rounded bg-[var(--slate-700)] px-2 py-0.5 text-xs text-[var(--slate-400)]">
            {submission.exam?.section?.replace("_", " ") ?? "—"}
          </span>
          <span className="text-xs text-[var(--slate-500)]">
            {new Date(submission.created_at).toLocaleDateString("fr-CA", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
          {submission.exam?.exam_type && (
            <span className="rounded bg-[var(--slate-700)] px-2 py-0.5 text-xs text-[var(--slate-400)]">
              {submission.exam.exam_type}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {isInProgress ? (
          <span className="rounded border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-400">
            En cours
          </span>
        ) : hasEval ? (
          <CefrBadge level={submission.evaluation!.cefr_level} />
        ) : (
          <span className="rounded border border-[var(--slate-600)] px-2 py-0.5 text-xs text-[var(--slate-500)]">
            Sans évaluation
          </span>
        )}
        <button
          onClick={() => onOpen(submission)}
          className="rounded-lg border border-[var(--slate-600)] px-3 py-1.5 text-xs font-medium text-[var(--slate-300)] hover:border-[var(--blue-500)] hover:text-[var(--blue-500)] transition-colors"
        >
          Ouvrir
        </button>
      </div>
    </div>
  );
}
