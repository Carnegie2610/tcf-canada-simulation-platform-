import { AnalyticsSummaryCard } from "@/components/molecules/admin/AnalyticsSummaryCard";
import { CefrBadge } from "@/components/atoms/CefrBadge";
import { DeltaIndicator } from "@/components/atoms/DeltaIndicator";
import { CefrProgressChart } from "./CefrProgressChart";
import { SubmissionListWithDrawer } from "./SubmissionListWithDrawer";
import type { StudentAuditData } from "@/lib/admin/types";
import { numericToCefr } from "@/lib/admin/cefr";

interface StudentAuditPanelProps {
  auditData: StudentAuditData;
}

const planLabel: Record<string, string> = {
  PLAN_5000: "5 000 F",
  PLAN_10000: "10 000 F",
  PLAN_15000: "15 000 F",
  PLAN_20000: "20 000 F",
};

export function StudentAuditPanel({ auditData }: StudentAuditPanelProps) {
  const { profile, submissions, analytics } = auditData;

  const avgCefrLabel = analytics.averageGlobalScore !== null
    ? (numericToCefr(Math.round(analytics.cefrProgression.reduce((s, d) => s + d.cefrNumeric, 0) / (analytics.cefrProgression.length || 1))) ?? "—")
    : "—";

  return (
    <div className="space-y-8">
      {/* Profile card */}
      <section className="rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--brand-white)]">
              {profile.full_name}
            </h2>
            <p className="mt-0.5 text-sm text-[var(--slate-400)]">{profile.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded bg-[var(--slate-700)] px-3 py-1 text-sm font-medium text-[var(--slate-300)]">
              {planLabel[profile.assigned_plan] ?? profile.assigned_plan}
            </span>
            {profile.cohort_tag && (
              <span className="rounded bg-[var(--blue-600)]/20 px-3 py-1 text-sm font-medium text-[var(--blue-500)]">
                {profile.cohort_tag}
              </span>
            )}
            <span
              className={`rounded px-3 py-1 text-sm font-medium ${
                profile.ai_corrections_enabled
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-[var(--slate-700)] text-[var(--slate-400)]"
              }`}
            >
              {profile.ai_corrections_enabled ? "IA activée" : "IA désactivée"}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-[var(--slate-500)]">Quota restant</p>
            <p
              className={`font-semibold ${
                profile.simulations_remaining === 0
                  ? "text-red-400"
                  : "text-[var(--brand-white)]"
              }`}
            >
              {profile.simulations_remaining}/{profile.simulations_quota}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--slate-500)]">Inscrit le</p>
            <p className="font-medium text-[var(--slate-300)]">
              {new Date(profile.created_at).toLocaleDateString("fr-CA")}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--slate-500)]">Expire le</p>
            <p
              className={`font-medium ${
                new Date(profile.expires_at) < new Date()
                  ? "text-red-400"
                  : "text-[var(--slate-300)]"
              }`}
            >
              {new Date(profile.expires_at).toLocaleDateString("fr-CA")}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--slate-500)]">Cohorte</p>
            <p className="font-medium text-[var(--slate-300)]">
              {profile.cohort_tag ?? "—"}
            </p>
          </div>
        </div>
      </section>

      {/* Analytics cards */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <AnalyticsSummaryCard
          label="Score moyen"
          value={
            analytics.averageGlobalScore !== null
              ? `${analytics.averageGlobalScore.toFixed(1)}/100`
              : "—"
          }
          subLabel={avgCefrLabel !== "—" ? `Niveau ${avgCefrLabel}` : undefined}
          variant={
            analytics.averageGlobalScore === null
              ? "default"
              : analytics.averageGlobalScore >= 75
              ? "positive"
              : analytics.averageGlobalScore >= 50
              ? "warning"
              : "negative"
          }
        />
        <AnalyticsSummaryCard
          label="Moy. cohorte"
          value={
            analytics.cohortAverageScore !== null
              ? `${analytics.cohortAverageScore.toFixed(1)}/100`
              : "—"
          }
          subLabel={analytics.cohortAverageScore === null ? "Aucune donnée" : undefined}
        />
        <AnalyticsSummaryCard
          label="Delta"
          value={<DeltaIndicator delta={analytics.scoreDelta} />}
          variant={
            analytics.scoreDelta === null
              ? "default"
              : analytics.scoreDelta >= 0
              ? "positive"
              : "negative"
          }
        />
        <AnalyticsSummaryCard
          label="Simulations"
          value={analytics.completedCount}
          subLabel={`${analytics.inProgressCount} en cours`}
        />
      </section>

      {/* CEFR progression chart */}
      <section className="rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--slate-400)]">
          Progression CEFR
        </h3>
        <CefrProgressChart dataPoints={analytics.cefrProgression} />
      </section>

      {/* Submission list */}
      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--slate-400)]">
          Historique des soumissions
        </h3>
        <SubmissionListWithDrawer
          submissions={submissions}
          aiEnabled={profile.ai_corrections_enabled}
        />
      </section>
    </div>
  );
}
