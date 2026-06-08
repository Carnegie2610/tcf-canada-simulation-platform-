import { CefrProgressChart } from "@/components/organisms/admin/CefrProgressChart";
import { SubmissionHistoryRow } from "@/components/molecules/student/SubmissionHistoryRow";
import type { StudentAuditData } from "@/lib/admin/types";

interface HistoryPanelProps {
  data: StudentAuditData;
}

export function HistoryPanel({ data }: HistoryPanelProps) {
  const { submissions, analytics } = data;
  const hasEvaluated = analytics.completedCount > 0;

  return (
    <div className="space-y-8">
      {/* Analytics summary */}
      {hasEvaluated && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Score moyen" value={analytics.averageGlobalScore !== null ? `${analytics.averageGlobalScore.toFixed(1)}/100` : "—"} />
          <StatCard label="Simulations terminées" value={String(analytics.completedCount)} />
          <StatCard label="En cours" value={String(analytics.inProgressCount)} />
          {analytics.scoreDelta !== null && (
            <StatCard
              label="vs. cohorte"
              value={`${analytics.scoreDelta >= 0 ? "+" : ""}${analytics.scoreDelta.toFixed(1)}`}
              accent={analytics.scoreDelta >= 0 ? "positive" : "negative"}
            />
          )}
        </div>
      )}

      {/* CEFR Trajectory */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--slate-500)]">
          Trajectoire CECR
        </h2>
        <div className="rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] p-4">
          <CefrProgressChart dataPoints={analytics.cefrProgression} />
        </div>
      </section>

      {/* Submission list */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--slate-500)]">
          Toutes les tentatives
        </h2>
        {submissions.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)]">
            <p className="text-sm text-[var(--slate-500)]">
              Aucune simulation soumise pour le moment.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {submissions.map((sub) => (
              <SubmissionHistoryRow key={sub.id} submission={sub} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  accent?: "positive" | "negative";
}

function StatCard({ label, value, accent }: StatCardProps) {
  const valueColor =
    accent === "positive"
      ? "text-green-400"
      : accent === "negative"
        ? "text-[var(--brand-red)]"
        : "text-[var(--brand-white)]";

  return (
    <div className="rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] px-4 py-3">
      <p className="text-xs text-[var(--slate-500)]">{label}</p>
      <p className={`mt-1 text-xl font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}
