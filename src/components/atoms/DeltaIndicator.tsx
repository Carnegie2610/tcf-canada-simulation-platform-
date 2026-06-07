interface DeltaIndicatorProps {
  delta: number | null;
}

export function DeltaIndicator({ delta }: DeltaIndicatorProps) {
  if (delta === null) {
    return (
      <span className="text-sm text-[var(--slate-400)]">
        — Aucune donnée de cohorte
      </span>
    );
  }

  const isPositive = delta >= 0;
  const colorClass = isPositive ? "text-emerald-400" : "text-red-400";
  const arrow = isPositive ? "▲" : "▼";
  const sign = isPositive ? "+" : "";

  return (
    <span className={`text-sm font-semibold ${colorClass}`}>
      {arrow} {sign}
      {delta.toFixed(1)} pts
    </span>
  );
}
