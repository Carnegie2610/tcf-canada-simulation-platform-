interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "h-9 w-9 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-16 w-16 text-xl",
};

// Deterministic palette pick per name so the same person always renders the
// same fallback color across admin list, edit form, and the public card.
const FALLBACK_COLORS = [
  "bg-[var(--brand-red)]/20 text-[var(--accent-red-text)]",
  "bg-blue-600/20 text-blue-300",
  "bg-emerald-600/20 text-emerald-300",
  "bg-amber-600/20 text-amber-300",
  "bg-purple-600/20 text-purple-300",
  "bg-pink-600/20 text-pink-300",
];

function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}

export function Avatar({ name, avatarUrl, size = "md" }: AvatarProps) {
  const sizeClass = SIZE_CLASSES[size];

  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClass} shrink-0 rounded-full object-cover`}
      />
    );
  }

  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <span
      className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-full font-bold ${colorForName(name)}`}
    >
      {initial}
    </span>
  );
}
