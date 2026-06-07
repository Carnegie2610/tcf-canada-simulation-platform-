interface AnalyticsSummaryCardProps {
  label: string;
  value: React.ReactNode;
  subLabel?: string;
  variant?: "default" | "positive" | "warning" | "negative";
}

const variantBorder: Record<string, string> = {
  default: "border-[var(--slate-700)]",
  positive: "border-emerald-500/40",
  warning: "border-yellow-500/40",
  negative: "border-red-500/40",
};

export function AnalyticsSummaryCard({
  label,
  value,
  subLabel,
  variant = "default",
}: AnalyticsSummaryCardProps) {
  return (
    <div
      className={`rounded-lg border bg-[var(--slate-800)] p-4 ${variantBorder[variant]}`}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--slate-400)]">
        {label}
      </p>
      <div className="mt-1.5 text-2xl font-bold text-[var(--brand-white)]">{value}</div>
      {subLabel && (
        <p className="mt-1 text-xs text-[var(--slate-500)]">{subLabel}</p>
      )}
    </div>
  );
}
