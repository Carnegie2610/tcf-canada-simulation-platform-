interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES: Record<NonNullable<StarRatingProps["size"]>, string> = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-2xl",
};

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.5}
      className={`h-[1em] w-[1em] ${filled ? "text-amber-400" : "text-[var(--slate-600)]"}`}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0l-4.725 2.885a.562.562 0 0 1-.84-.61l1.285-5.385a.562.562 0 0 0-.182-.557l-4.204-3.602a.563.563 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345l2.125-5.11Z"
      />
    </svg>
  );
}

/** Read-only when `onChange` is omitted (public display); interactive picker
 * when provided (admin form). */
export function StarRating({ value, onChange, size = "md" }: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];
  const sizeClass = SIZE_CLASSES[size];

  if (!onChange) {
    return (
      <div className={`flex items-center gap-0.5 ${sizeClass}`} aria-label={`${value} sur 5 étoiles`}>
        {stars.map((n) => (
          <Star key={n} filled={n <= value} />
        ))}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-0.5 ${sizeClass}`} role="radiogroup" aria-label="Note en étoiles">
      {stars.map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={n === value}
          aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
          onClick={() => onChange(n)}
          className="transition-transform hover:scale-110"
        >
          <Star filled={n <= value} />
        </button>
      ))}
    </div>
  );
}
