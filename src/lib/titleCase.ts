// Title-case a string: capitalize first letter of each word,
// except small words (unless they are the first word).
const SMALL_WORDS = new Set(["to", "a", "an", "the", "of", "and", "by", "on", "for"]);

export const toTitleCase = (input: string): string => {
  if (!input) return input;
  return input
    .split(/(\s+)/) // keep whitespace tokens
    .map((token, idx, arr) => {
      if (/^\s+$/.test(token) || token === "") return token;
      const lower = token.toLowerCase();
      // First non-space word is always capitalized
      const isFirst = arr.slice(0, idx).every((t) => /^\s*$/.test(t));
      if (!isFirst && SMALL_WORDS.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");
};
