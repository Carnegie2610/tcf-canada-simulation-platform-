interface QuotaStatusBarProps {
  used: number;
  total: number;
  expiresAt: string;
}

export function QuotaStatusBar({ used, total, expiresAt }: QuotaStatusBarProps) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const isNearLimit = pct >= 80;

  const expiryDate = new Date(expiresAt).toLocaleDateString("fr-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)] px-5 py-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[var(--brand-white)]">
          {used} / {total} simulations utilisées
        </span>
        <span className="text-xs text-[var(--slate-500)]">Expire le {expiryDate}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-[var(--slate-800)]">
        <div
          className={`h-2 rounded-full transition-all ${isNearLimit ? "bg-[var(--brand-red)]" : "bg-[var(--blue-500)]"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isNearLimit && (
        <p className="mt-2 text-xs text-[var(--brand-red)]">
          Vous approchez de votre limite de simulations.
        </p>
      )}
    </div>
  );
}
