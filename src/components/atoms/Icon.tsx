interface IconProps {
  emoji: string;
  label: string;
}

export function Icon({ emoji, label }: IconProps) {
  return (
    <div
      className="flex h-11 w-11 items-center justify-center rounded-xl bg-[--slate-800] text-2xl"
      aria-label={label}
      role="img"
    >
      {emoji}
    </div>
  );
}
