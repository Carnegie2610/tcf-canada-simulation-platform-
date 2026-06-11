export interface ActivityDay {
  dayLabel: string;    // "Lun", "Mar", ...
  taskLevel: 0 | 1 | 2 | 3;
}

interface ConsistencyTrackerProps {
  activityDays: ActivityDay[];
  currentStreak: number;
  totalCompleted: number;
}

const TILE_CLASSES: Record<0 | 1 | 2 | 3, string> = {
  0: "bg-slate-800 border-slate-700",
  1: "bg-blue-900/60 border-blue-800/50",
  2: "bg-blue-700/60 border-blue-600/50",
  3: "bg-blue-500 border-blue-400/50",
};

const TILE_LABELS: Record<0 | 1 | 2 | 3, string> = {
  0: "Inactif",
  1: "1 Tâche",
  2: "2 Tâches",
  3: "Simulation complète",
};

export function ConsistencyTracker({
  activityDays,
  currentStreak,
  totalCompleted,
}: ConsistencyTrackerProps) {
  return (
    <div className="rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] px-5 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-semibold text-[var(--brand-white)]">
          🔥 Votre rythme de préparation
        </p>
        <div className="flex items-center gap-4 text-xs text-[var(--slate-400)]">
          <span>
            Série active&nbsp;:&nbsp;
            <span className="font-bold text-amber-400">
              {currentStreak} jour{currentStreak !== 1 ? "s" : ""} consécutif{currentStreak !== 1 ? "s" : ""}
            </span>
          </span>
          <span className="text-[var(--slate-600)]">|</span>
          <span>
            Total&nbsp;:&nbsp;
            <span className="font-bold text-[var(--brand-white)]">
              {totalCompleted} simulation{totalCompleted !== 1 ? "s" : ""} complétée{totalCompleted !== 1 ? "s" : ""}
            </span>
          </span>
        </div>
      </div>

      {/* Weekly heatmap */}
      <div className="grid grid-cols-7 gap-2">
        {activityDays.map(({ dayLabel, taskLevel }) => (
          <div key={dayLabel} className="flex flex-col items-center gap-1.5">
            <span className="text-[10px] font-medium text-[var(--slate-500)] uppercase">
              {dayLabel}
            </span>
            <div
              className={`w-full aspect-square rounded-lg border ${TILE_CLASSES[taskLevel]}`}
              title={TILE_LABELS[taskLevel]}
            />
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        {([0, 1, 2, 3] as const).map((level) => (
          <div key={level} className="flex items-center gap-1.5">
            <div className={`h-3 w-3 rounded border ${TILE_CLASSES[level]}`} />
            <span className="text-[10px] text-[var(--slate-500)]">{TILE_LABELS[level]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
