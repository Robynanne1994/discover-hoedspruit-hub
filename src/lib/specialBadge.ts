import { format } from "date-fns";
import { compactDays, parseDays } from "./specialDays";

// Every surface that shows a special's badge pill reads it from here, so the
// wording stays identical on the specials list, the homepage rail, the detail
// page and the saved cards. Nothing here decides styling — only the text and
// which of the two tones it belongs to.
export interface SpecialBadgeLike {
  badge_override?: string | null;
  // A list of days, or a single name on rows written before weekly specials
  // could run on more than one day.
  day_of_week?: string | string[] | null;
  discount_type?: string | null;
  discount_value?: number | string | null;
  valid_from?: string | null;
  valid_until?: string | null;
}

// Percentage/discount style labels read louder in red; loyalty, seasonal and
// package deals sit back in olive.
export type BadgeTone = "discount" | "neutral";

const str = (v: unknown): string | null => {
  const s = String(v ?? "").trim();
  return s ? s : null;
};

// 20 -> "20", 20.5 -> "20.5"
const num = (v: unknown): string | null => {
  if (v == null || String(v).trim() === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return String(Math.round(n * 100) / 100);
};

const parseDate = (v?: string | null): Date | null => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

// Every label this special could wear, most specific first. Callers normally
// take the first one; the card model skips a candidate that would only repeat
// what the value bar already says.
export const specialBadgeCandidates = (s: SpecialBadgeLike): string[] => {
  const out: string[] = [];
  const push = (v?: string | null) => {
    const t = str(v);
    if (t && !out.includes(t)) out.push(t);
  };

  push(s.badge_override);

  // "Tuesday Special", "Wed & Thu Special" — the pill is narrow, so more than
  // one day is abbreviated rather than spelled out.
  const day = compactDays(parseDays(s.day_of_week));
  if (day) push(`${day} Special`);

  const value = num(s.discount_value);
  if (s.discount_type === "percent_off" && value) push(`${value}% Off`);
  if (s.discount_type === "amount_off" && value) push(`Save R${value}`);
  if (s.discount_type === "freebie" || s.discount_type === "buy_x_get_y") push("Special Offer");

  const from = parseDate(s.valid_from);
  const until = parseDate(s.valid_until);

  // Roughly May to August reads as the winter season locally.
  if (from && until && from.getMonth() >= 4 && until.getMonth() <= 7 && until >= from) {
    push("Winter Special");
  } else if (from && until && from.getMonth() === until.getMonth() && from.getFullYear() === until.getFullYear()) {
    push(`${format(until, "MMMM")} Special`);
  } else if (!from && until) {
    push(`${format(until, "MMMM")} Special`);
  }

  // Last resort — every special wears a pill, so the cards stay the same shape.
  push("Special");
  return out;
};

export const getSpecialBadge = (s: SpecialBadgeLike): string => specialBadgeCandidates(s)[0];

// "20% Off" and "20% off" are the same claim as far as a card is concerned.
const norm = (v: string): string => v.toLowerCase().replace(/[^a-z0-9]/g, "");

// The badge, minus any candidate that repeats `exclude` (what the value bar is
// already saying). Falls through to the generic "Special" rather than nothing,
// so the pill never disappears from one card in a grid.
export const getSpecialBadgeExcluding = (s: SpecialBadgeLike, exclude?: string | null): string => {
  const candidates = specialBadgeCandidates(s);
  const skip = str(exclude);
  if (!skip) return candidates[0];
  const target = norm(skip);
  return candidates.find((c) => norm(c) !== target) ?? candidates[candidates.length - 1];
};

const DISCOUNT_LABEL = /(%|\boff\b|\bsave\b|\bsavings?\b|\bhalf\b|\d\s*for\s*\d|\bbuy\s*\d|\bbogof\b)/i;

export const specialBadgeTone = (label?: string | null): BadgeTone =>
  DISCOUNT_LABEL.test(String(label ?? "")) ? "discount" : "neutral";
