import { AnalyticsSummaryCard } from "@/components/molecules/admin/AnalyticsSummaryCard";
import { DeltaIndicator } from "@/components/atoms/DeltaIndicator";
import { CefrProgressChart } from "./CefrProgressChart";
import { SubmissionListWithDrawer } from "./SubmissionListWithDrawer";
import { LiveQuotaBar } from "@/components/molecules/admin/LiveQuotaBar";
import { TaskPerformanceChart } from "@/components/molecules/admin/TaskPerformanceChart";
import { CefrDistributionMiniChart } from "@/components/molecules/admin/CefrDistributionMiniChart";
import { ConsistencyTracker } from "@/components/organisms/student/ConsistencyTracker";
import { computeTaskPerformance } from "@/lib/admin/analytics";
import type { StudentAuditData, CefrDistributionItem, CefrLevel } from "@/lib/admin/types";
import type { ActivityDay } from "@/components/organisms/student/ConsistencyTracker";
import { numericToCefr } from "@/lib/admin/cefr";
import { getPlanMeta } from "@/lib/plans";

interface StudentAuditPanelProps {
  auditData: StudentAuditData;
  activityDays: ActivityDay[];
  currentStreak: number;
  totalCompleted: number;
}

export function StudentAuditPanel({
  auditData,
  activityDays,
  currentStreak,
  totalCompleted,
}: StudentAuditPanelProps) {
  const { profile, submissions, analytics } = auditData;

  const avgCefrLabel = analytics.averageGlobalScore !== null
    ? (numericToCefr(Math.round(analytics.cefrProgression.reduce((s, d) => s + d.cefrNumeric, 0) / (analytics.cefrProgression.length || 1))) ?? "—")
    : "—";

  // Build per-student CEFR distribution from their evaluations
  const cefrMap = new Map<string, number>();
  for (const sub of submissions) {
    if (sub.evaluation) {
      const lvl = sub.evaluation.cefr_level;
      cefrMap.set(lvl, (cefrMap.get(lvl) ?? 0) + 1);
    }
  }
  const cefrOrder: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const cefrDistribution: CefrDistributionItem[] = cefrOrder
    .filter((l) => cefrMap.has(l))
    .map((l) => ({ level: l, count: cefrMap.get(l)! }));

  const taskPerformance = computeTaskPerformance(submissions);

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
              {profile.assigned_plan ? getPlanMeta(profile.assigned_plan).label : "—"}
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

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs text-[var(--slate-500)]">Inscrit le</p>
            <p className="font-medium text-[var(--slate-300)]">
              {new Date(profile.created_at).toLocaleDateString("fr-CA")}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--slate-500)]">Cohorte</p>
            <p className="font-medium text-[var(--slate-300)]">
              {profile.cohort_tag ?? "—"}
            </p>
          </div>
        </div>

        {/* Live quota bar */}
        <div className="mt-5 border-t border-[var(--slate-700)] pt-4">
          <LiveQuotaBar
            userId={profile.id}
            initialEeQuota={profile.ee_simulations_quota ?? 0}
            initialEeRemaining={profile.ee_simulations_remaining ?? 0}
            initialEoQuota={profile.eo_simulations_quota ?? 0}
            initialEoRemaining={profile.eo_simulations_remaining ?? 0}
            expiresAt={profile.expires_at ?? ""}
          />
        </div>
      </section>

      {/* Consistency heatmap */}
      <ConsistencyTracker
        activityDays={activityDays}
        currentStreak={currentStreak}
        totalCompleted={totalCompleted}
      />

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

      {/* Charts row */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* CEFR trajectory */}
        <div className="rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] p-5">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--slate-400)]">
            Trajectoire globale du niveau CECRL
          </h3>
          <CefrProgressChart dataPoints={analytics.cefrProgression} />
        </div>

        {/* Performance panel */}
        <div className="rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] p-5 space-y-4">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--slate-400)]">
              Performance moyenne par tâche
            </h3>
            <TaskPerformanceChart data={taskPerformance} />
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--slate-400)]">
              Distribution des notes (CECRL)
            </h3>
            <CefrDistributionMiniChart data={cefrDistribution} />
          </div>
        </div>
      </section>

      {/* Submission list */}
      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--slate-400)]">
          Historique des copies de l&apos;étudiant
        </h3>
        <SubmissionListWithDrawer
          submissions={submissions}
          aiEnabled={profile.ai_corrections_enabled}
        />
      </section>
    </div>
  );
}
