import Link from "next/link";
import type { OralCombination } from "@/lib/admin/types";
import type { OralSubmission } from "@/lib/student/queries";

interface CompletedOralCombinationCardProps {
  combination: OralCombination;
  submission: OralSubmission;
  evaluation: {
    id: string;
    global_score: number;
    cefr_level: string;
    appreciation: string;
  } | null;
  index: number;
}

const CEFR_BADGE: Record<string, string> = {
  C2:    "bg-emerald-900/60 text-emerald-300 border-emerald-700/50",
  "C1+": "bg-emerald-900/40 text-emerald-400 border-emerald-800/50",
  C1:    "bg-teal-900/50 text-teal-300 border-teal-700/50",
  "B2+": "bg-blue-900/50 text-blue-300 border-blue-700/50",
  B2:    "bg-blue-900/40 text-blue-400 border-blue-800/50",
  "B1+": "bg-indigo-900/50 text-indigo-300 border-indigo-700/50",
  B1:    "bg-amber-900/50 text-amber-300 border-amber-700/50",
  A2:    "bg-red-900/40 text-red-400 border-red-800/50",
};

export function CompletedOralCombinationCard({
  combination,
  submission,
  evaluation,
  index,
}: CompletedOralCombinationCardProps) {
  const completedAt = submission.completed_at
    ? new Date(submission.completed_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const cefrBadgeClass = evaluation
    ? (CEFR_BADGE[evaluation.cefr_level] ?? "bg-[var(--slate-800)] text-[var(--slate-200)] border-[var(--slate-700)]")
    : null;

  // Oral evaluation runs automatically as soon as the submission is locked — unlike
  // EE combinations, there's no on-demand "request correction" action here.
  const detailHref = evaluation
    ? `/dashboard/expression-orale/result/${submission.id}`
    : `/dashboard/expression-orale/attempt/${combination.id}/pending?sid=${submission.id}`;

  return (
    <div className="group relative rounded-2xl border border-[var(--slate-800)]/80 bg-[var(--slate-900)]/60 p-6 transition-all duration-300 ease-out hover:-translate-y-2 hover:border-blue-500/40 hover:bg-[var(--slate-900)]/90 hover:shadow-[0_20px_50px_rgba(59,130,246,0.12)]">
      {/* 1. Header badges */}
      <div className="flex items-center justify-between mb-4">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--accent-teal-text)]">
          <span className="text-sm">🎙️</span> Expression Orale
        </span>
        <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase rounded-full bg-blue-950 text-blue-300 border border-blue-800/50">
          ⚡ {combination.exam_type} Canada
        </span>
      </div>

      {/* 2. Title + optional score badge */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-extrabold text-[var(--slate-200)] transition-colors duration-200">
              📁 Combinaison {index}
            </h3>
            <p className="text-sm text-[var(--slate-400)] group-hover:text-[var(--slate-200)] mt-1 line-clamp-2 transition-colors duration-200">
              {combination.title}
            </p>
          </div>
          {evaluation && cefrBadgeClass && (
            <div className="shrink-0 flex flex-col items-end gap-1">
              <span className={`rounded-lg border px-2.5 py-1 text-sm font-extrabold ${cefrBadgeClass}`}>
                {evaluation.cefr_level}
              </span>
              <p className="text-base font-bold text-[var(--slate-200)]">
                {evaluation.global_score.toFixed(1)}
                <span className="text-xs text-[var(--slate-500)]">/20</span>
              </p>
            </div>
          )}
        </div>
        {completedAt && (
          <p className="mt-1.5 text-[11px] text-[var(--slate-500)]">Soumis le {completedAt}</p>
        )}
      </div>

      {/* 3. Metadata row */}
      <div className="border-t border-[var(--slate-800)]/60 pt-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-[var(--slate-200)]">
          <span className="flex items-center gap-1.5 font-medium">
            <span>📋</span> 3 Tâches
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span>⏱️</span> {combination.global_duration} Min.
          </span>
        </div>
        <div className="flex items-center justify-end">
          <span className="flex items-center gap-1.5 rounded-md bg-emerald-950 text-emerald-400 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-emerald-900/50">
            ✓ Complété
          </span>
        </div>
      </div>

      {/* 4. CTA */}
      <div className="mt-5">
        <Link
          href={detailHref}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 px-4 text-sm font-semibold text-white transition-all duration-300 group-hover:scale-[1.01] group-hover:brightness-110 shadow-lg shadow-blue-900/20"
        >
          {evaluation ? "🔍 Voir les détails" : "⏳ Correction en cours"}
        </Link>
      </div>
    </div>
  );
}
