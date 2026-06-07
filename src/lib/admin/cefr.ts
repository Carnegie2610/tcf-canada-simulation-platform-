import type { CefrLevel } from "./types";

export const CEFR_NUMERIC_MAP: Record<CefrLevel, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6,
};

export function cefrToNumeric(level: CefrLevel): number {
  return CEFR_NUMERIC_MAP[level];
}

export function numericToCefr(n: number): CefrLevel | null {
  const entry = Object.entries(CEFR_NUMERIC_MAP).find(([, v]) => v === n);
  return entry ? (entry[0] as CefrLevel) : null;
}

export function cefrColorClass(level: CefrLevel): string {
  const map: Record<CefrLevel, string> = {
    A1: "bg-red-500/20 text-red-400 border-red-500/30",
    A2: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    B1: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    B2: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    C1: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    C2: "bg-amber-400/20 text-amber-300 border-amber-400/30",
  };
  return map[level];
}
