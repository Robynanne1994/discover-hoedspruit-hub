// Detail-row labels on a listing page come from the editor and CSV in mixed
// case ("mid-range", "Dine-in", "drive_through" → "Drive-through"), so they are
// normalised here: every word and every hyphenated part is capitalised, while
// the small connectives stay lower-case unless they lead the label.

const SMALL_WORDS_DETAILS = new Set(["of", "for", "from", "to", "by", "a", "an"]);

// "mid-range" → "Mid-Range", "wi-fi" → "Wi-Fi". A hyphen separates words, so
// the letter after it is capitalised just like the letter after a space.
const capitalizeParts = (lower: string): string =>
  lower
    .split("-")
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join("-");

export const formatDetailLabel = (s: string): string => {
  if (!s) return s;
  const parts = s.split(/(\s+)/);
  let firstIdx = -1;
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].trim()) {
      firstIdx = i;
      break;
    }
  }
  return parts
    .map((p, i) => {
      if (!p.trim()) return p;
      const lower = p.toLowerCase();

      // Special cases
      if (lower === "wifi") return "WiFi";
      if (lower === "(free)") return "(Free)";
      if (lower === "wifi(free)") return "WiFi (Free)";

      const cleaned = lower.replace(/[^a-z']/g, "");
      if (i !== firstIdx && SMALL_WORDS_DETAILS.has(cleaned)) return lower;

      // Handle words starting with punctuation like (
      if (p.startsWith("(")) {
        return "(" + capitalizeParts(lower.slice(1));
      }

      return capitalizeParts(lower);
    })
    .join("");
};
