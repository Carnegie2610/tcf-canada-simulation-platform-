import { cefrColorClass } from "@/lib/admin/cefr";
import type { CefrLevel } from "@/lib/admin/types";

interface CefrBadgeProps {
  level: CefrLevel;
  className?: string;
}

export function CefrBadge({ level, className = "" }: CefrBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold tracking-wide ${cefrColorClass(level)} ${className}`}
    >
      {level}
    </span>
  );
}
