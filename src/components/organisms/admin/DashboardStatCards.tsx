import type { DashboardFilter, DashboardStats } from "@/lib/admin/types";

interface DashboardStatCardsProps {
  stats: DashboardStats;
  filter: DashboardFilter;
}

function DeltaBadge({ current, prev, filter }: { current: number; prev: number; filter: DashboardFilter }) {
  if (filter === "all") return null;

  if (prev === 0 && current === 0) return null;

  if (prev === 0 && current > 0) {
    return (
      <span className="text-xs font-medium text-emerald-400">Nouveau</span>
    );
  }

  const pct = Math.round(((current - prev) / prev) * 100);
  const positive = pct >= 0;

  return (
    <span className={`text-xs font-medium ${positive ? "text-emerald-400" : "text-red-400"}`}>
      {positive ? "+" : ""}{pct}% vs période préc.
    </span>
  );
}

const CARDS = [
  {
    icon: "👤",
    label: "Étudiants inscrits",
    countKey: "studentsCount" as const,
    prevKey: "studentsPrev" as const,
  },
  {
    icon: "📝",
    label: "Soumissions d'essais",
    countKey: "submissionsCount" as const,
    prevKey: "submissionsPrev" as const,
  },
  {
    icon: "📁",
    label: "Combinaisons créées",
    countKey: "combinationsCount" as const,
    prevKey: "combinationsPrev" as const,
  },
];

export function DashboardStatCards({ stats, filter }: DashboardStatCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {CARDS.map(({ icon, label, countKey, prevKey }) => (
        <div
          key={label}
          className="rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] p-5"
        >
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[var(--slate-400)]">
            <span>{icon}</span>
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold text-[var(--brand-white)]">
            {stats[countKey]}
          </p>
          <div className="mt-1 h-4">
            <DeltaBadge current={stats[countKey]} prev={stats[prevKey]} filter={filter} />
          </div>
        </div>
      ))}
    </div>
  );
}
