// AI-generated text occasionally contains a lone UTF-16 surrogate (half of a
// broken emoji/accented character) or a stray NUL byte. Postgres's jsonb/text
// columns reject these outright ("unsupported Unicode escape sequence"),
// which fails the final save even though scoring itself succeeded. Strip them
// before anything derived from an AI response reaches the database.
export function sanitizeAiText<T>(value: T): T {
  if (typeof value === "string") {
    return value
      // Lone high surrogate not followed by a low surrogate, or lone low surrogate.
      .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, "")
      .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "")
      // NUL and other control chars Postgres text/jsonb also rejects.
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "") as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAiText(item)) as unknown as T;
  }
  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[key] = sanitizeAiText(val);
    }
    return result as T;
  }
  return value;
}
