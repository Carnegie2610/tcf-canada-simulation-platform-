import { describe, it, expect } from "vitest";
import { sanitizeAiText } from "../sanitize";

describe("sanitizeAiText", () => {
  it("leaves normal French text untouched", () => {
    expect(sanitizeAiText("Vous avez réussi l'épreuve écrite 🎉")).toBe(
      "Vous avez réussi l'épreuve écrite 🎉"
    );
  });

  it("strips a lone high surrogate", () => {
    const broken = "score élevé \uD83D fin";
    expect(sanitizeAiText(broken)).toBe("score élevé  fin");
  });

  it("strips a lone low surrogate", () => {
    const broken = "score élevé \uDE00 fin";
    expect(sanitizeAiText(broken)).toBe("score élevé  fin");
  });

  it("keeps a valid surrogate pair (real emoji) intact", () => {
    const valid = "bravo 🎉 continuez";
    expect(sanitizeAiText(valid)).toBe(valid);
  });

  it("strips NUL and other control characters", () => {
    expect(sanitizeAiText("texte\u0000avec\u0001controle")).toBe("texteaveccontrole");
  });

  it("recurses into nested objects", () => {
    const input = { a: "ok\uD800", b: { c: "also\uD800bad" } };
    expect(sanitizeAiText(input)).toEqual({ a: "ok", b: { c: "alsobad" } });
  });

  it("recurses into arrays", () => {
    const input = ["clean", "dirty\uD800"];
    expect(sanitizeAiText(input)).toEqual(["clean", "dirty"]);
  });

  it("leaves numbers, booleans and null untouched", () => {
    expect(sanitizeAiText(42)).toBe(42);
    expect(sanitizeAiText(true)).toBe(true);
    expect(sanitizeAiText(null)).toBe(null);
  });
});
