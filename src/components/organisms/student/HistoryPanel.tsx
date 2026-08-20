import { CefrProgressChart } from "@/components/organisms/admin/CefrProgressChart";
import { SubmissionHistoryRow } from "@/components/molecules/student/SubmissionHistoryRow";
import type { StudentAuditData, CefrLevel } from "@/lib/admin/types";

interface HistoryPanelProps {
  data: StudentAuditData;
  /** Which skill's figures to show. "all" uses the combined analytics. */
  skill?: "all" | "ee" | "eo";
  // Count of completed EE/EO combination attempts, shown in their own card sections
  // higher up the history page — used to avoid claiming "no simulations" here when the
  // student's only activity was combinations rather than standalone single exams.
  otherAttemptsCount?: number;
}

const CEFR_LEVELS: CefrLevel[] = ["A2", "B1", "B2", "C1", "C2"];
const IMMIGRATION_TARGET: CefrLevel = "C1";

function CefrTargetStrip({ currentLevel }: { currentLevel: CefrLevel | null }) {
  return (
    <div className="rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] px-5 py-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--slate-500)]">
        Trajectoire CLB
      </p>

      <div className="flex items-center gap-0">
        {CEFR_LEVELS.map((level, i) => {
          const isCurrent = level === currentLevel;
          const isTarget = level === IMMIGRATION_TARGET;
          const isConnector = i < CEFR_LEVELS.length - 1;

          return (
            <div key={level} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={[
                    "flex h-8 min-w-[42px] items-center justify-center rounded-md border px-2 text-xs font-bold transition-all",
                    isCurrent
                      ? "border-blue-500 bg-blue-600/20 text-blue-300 ring-2 ring-blue-500/40"
                      : isTarget
                        ? "border-amber-500/60 bg-amber-500/10 text-amber-400"
                        : "border-[var(--slate-700)] bg-[var(--slate-800)] text-[var(--slate-500)]",
                  ].join(" ")}
                >
                  {level}
                </div>
                {(isCurrent || isTarget) && (
                  <span className={`text-[10px] font-medium ${isCurrent ? "text-blue-400" : "text-amber-400"}`}>
                    {isCurrent && isTarget ? "Vous / Cible" : isCurrent ? "Vous" : "Cible"}
                  </span>
                )}
              </div>
              {isConnector && (
                <div className="mx-1 h-px w-4 bg-[var(--slate-700)] shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-[var(--slate-500)]">
        L&apos;immigration au Canada (CLB&nbsp;7–9) exige généralement un niveau B2 minimum, avec C1 comme cible optimale.
        {currentLevel && currentLevel !== IMMIGRATION_TARGET && (
          <span className="ml-1 text-[var(--slate-400)]">
            Niveau actuel&nbsp;: <span className="font-semibold text-blue-400">{currentLevel}</span>.
          </span>
        )}
      </p>
    </div>
  );
}

/**
 * Scores are stored on a 0-100 scale internally (the oldest exam type used it, so
 * every source is normalised to it). Students only ever see /20 on their actual
 * corrections, so convert back before displaying rather than showing two scales.
 */
function toTwenty(scoreOn100: number): number {
  return scoreOn100 / 5;
}

export function HistoryPanel({ data, skill = "all", otherAttemptsCount = 0 }: HistoryPanelProps) {
  const { submissions } = data;
  const analytics =
    skill === "ee"
      ? (data.analyticsEe ?? data.analytics)
      : skill === "eo"
        ? (data.analyticsEo ?? data.analytics)
        : data.analytics;
  const hasEvaluated = analytics.completedCount > 0;

  const currentLevel: CefrLevel | null =
    analytics.cefrProgression.length > 0
      ? analytics.cefrProgression[analytics.cefrProgression.length - 1].cefrLevel
      : null;

  return (
    <div className="space-y-8">
      {/* Analytics summary */}
      {hasEvaluated && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Score moyen"
            value={
              analytics.averageGlobalScore !== null
                ? `${toTwenty(analytics.averageGlobalScore).toFixed(1)}/20`
                : "—"
            }
          />
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

      {/* CEFR Trajectory chart */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--slate-500)]">
          Trajectoire CECR
        </h2>
        <div className="rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] p-4">
          <CefrProgressChart dataPoints={analytics.cefrProgression} />
        </div>
      </section>

      {/* CEFR Target Strip */}
      <CefrTargetStrip currentLevel={currentLevel} />

      {/* Single-exam submission list — combinations (EE/EO) have their own card
          sections higher up the page, so an empty list here isn't necessarily "no
          activity" if the student's history is otherwise all combination-based. */}
      {skill !== "eo" && submissions.length > 0 ? (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--slate-500)]">
            Tentatives individuelles
          </h2>
          <div className="space-y-2">
            {submissions.map((sub) => (
              <SubmissionHistoryRow key={sub.id} submission={sub} />
            ))}
          </div>
        </section>
      ) : skill !== "eo" && otherAttemptsCount === 0 ? (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--slate-500)]">
            Toutes les tentatives
          </h2>
          <div className="flex h-32 items-center justify-center rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)]">
            <p className="text-sm text-[var(--slate-500)]">
              Aucune simulation soumise pour le moment.
            </p>
          </div>
        </section>
      ) : null}
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
