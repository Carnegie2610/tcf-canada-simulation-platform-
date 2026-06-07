interface ScorePillProps {
  score: number;
  maxScore?: number;
  label?: string;
}

function scoreColor(score: number, max: number): string {
  const pct = (score / max) * 100;
  if (pct >= 75) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (pct >= 50) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  return "bg-red-500/20 text-red-400 border-red-500/30";
}

export function ScorePill({ score, maxScore = 100, label }: ScorePillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-2.5 py-1 text-sm font-semibold ${scoreColor(score, maxScore)}`}
    >
      {label && <span className="font-normal opacity-70">{label}</span>}
      {score}/{maxScore}
    </span>
  );
}
