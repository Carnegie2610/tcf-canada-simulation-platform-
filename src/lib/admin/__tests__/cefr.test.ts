import { describe, it, expect } from "vitest";
import { cefrToNumeric, numericToCefr, cefrColorClass, CEFR_NUMERIC_MAP } from "../cefr";
import type { CefrLevel } from "../types";

describe("cefrToNumeric", () => {
  it("maps A1 to 1", () => expect(cefrToNumeric("A1")).toBe(1));
  it("maps A2 to 2", () => expect(cefrToNumeric("A2")).toBe(2));
  it("maps B1 to 3", () => expect(cefrToNumeric("B1")).toBe(3));
  it("maps B2 to 4", () => expect(cefrToNumeric("B2")).toBe(4));
  it("maps C1 to 5", () => expect(cefrToNumeric("C1")).toBe(5));
  it("maps C2 to 6", () => expect(cefrToNumeric("C2")).toBe(6));
  it("covers all 6 CEFR levels", () =>
    expect(Object.keys(CEFR_NUMERIC_MAP)).toHaveLength(6));
});

describe("numericToCefr", () => {
  it("maps 1 to A1", () => expect(numericToCefr(1)).toBe("A1"));
  it("maps 3 to B1", () => expect(numericToCefr(3)).toBe("B1"));
  it("maps 6 to C2", () => expect(numericToCefr(6)).toBe("C2"));
  it("returns null for 0", () => expect(numericToCefr(0)).toBeNull());
  it("returns null for 7", () => expect(numericToCefr(7)).toBeNull());
});

describe("cefrColorClass", () => {
  const levels: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
  it.each(levels)("returns a non-empty Tailwind string for %s", (level) => {
    const result = cefrColorClass(level);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain("bg-");
    expect(result).toContain("text-");
  });
});
