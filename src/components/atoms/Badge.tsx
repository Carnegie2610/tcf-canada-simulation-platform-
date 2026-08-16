type BadgeVariant = "recommended" | "info" | "exam";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  recommended: "bg-amber-500/20 text-[var(--accent-amber-text)] border border-amber-500/30",
  info: "bg-[var(--slate-800)] text-[var(--slate-400)] border border-[var(--slate-700)]",
  exam: "bg-[var(--brand-red)]/10 text-[var(--accent-red-text)] border border-[var(--brand-red)]/20",
};

export function Badge({ label, variant = "info", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${variantStyles[variant]} ${className}`}
    >
      {label}
    </span>
  );
}
