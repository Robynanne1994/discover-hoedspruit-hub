// Formatter for service labels (and similar chip labels):
// - Inserts a space before and after any forward slash
// - Title-cases each word, keeping small connector words (for, to, by, a, an, of, and, the, or, in, on, at, etc.) lowercase
//   unless they are the first word.

const SMALL_WORDS = new Set([
  "a", "an", "and", "as", "at", "but", "by", "for", "from", "in",
  "into", "it", "is", "nor", "of", "off", "on", "or", "per", "the",
  "to", "up", "via", "vs", "with", "yet",
]);

export function formatServiceLabel(input: string): string {
  if (!input) return input;
  // Normalize whitespace around slashes to " / "
  const spaced = input.replace(/\s*\/\s*/g, " / ");
  const tokens = spaced.split(/(\s+)/);
  let firstWordIdx = -1;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.trim() && t !== "/") {
      firstWordIdx = i;
      break;
    }
  }
  return tokens
    .map((t, i) => {
      if (!t.trim()) return t;
      if (t === "/") return t;
      const lower = t.toLowerCase();
      const cleaned = lower.replace(/[^a-z']/g, "");
      if (i !== firstWordIdx && SMALL_WORDS.has(cleaned)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");
}
