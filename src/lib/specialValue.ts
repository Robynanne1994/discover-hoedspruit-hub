import { format } from "date-fns";
import { compactDays, parseDays, recurringDays } from "./specialDays";

// Deals ending within this many days are "ending soon" (and get the urgent treatment).
export const ENDING_SOON_DAYS = 7;

// The money and validity fields every specials surface reads. Callers pass
// whole rows; only these are used here.
export interface SpecialLike {
  price?: string | null;
  price_label?: string | null;
  original_price?: string | null;
  savings?: string | null;
  card_footer_text?: string | null;
  valid_from?: string | null;
  valid_until?: string | null;
  // A list of days, or a single name on older rows. See lib/specialDays.
  day_of_week?: string | string[] | null;
  discount_type?: string | null;
  discount_value?: number | string | null;
  freebie_text?: string | null;
}

const str = (v: unknown): string | null => {
  const s = String(v ?? "").trim();
  return s ? s : null;
};

// Extract the first numeric value from a price/savings string (e.g. "Save R200" -> 200)
export const parseNum = (v: unknown): number | null => {
  if (v == null) return null;
  const m = String(v).replace(/[, ]/g, "").match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
};

// Best-effort saving amount: explicit savings, else original − discounted price
export const savingValue = (s: SpecialLike): number => {
  const sv = parseNum(s.savings);
  if (sv != null) return sv;
  const orig = parseNum(s.original_price);
  const price = parseNum(s.price);
  if (orig != null && price != null) return orig - price;
  return -Infinity;
};

// Whole days between today and the deal's last valid day. Null = ongoing.
export const daysRemaining = (s: SpecialLike): number | null => {
  if (!s.valid_until) return null;
  const end = new Date(s.valid_until);
  if (isNaN(end.getTime())) return null;
  const today = new Date();
  const a = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const b = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((b.getTime() - a.getTime()) / 86400000);
};

export const isEndingSoon = (s: SpecialLike): boolean => {
  const d = daysRemaining(s);
  return d != null && d >= 0 && d <= ENDING_SOON_DAYS;
};

// Short countdown shown in the value bar — "3 days left", "Ongoing", "Ends 12 Aug".
export const countdownLabel = (s: SpecialLike): string => {
  const d = daysRemaining(s);
  if (d == null) return "Ongoing";
  if (d < 0) return "Ended";
  if (d === 0) return "Last day";
  if (d === 1) return "1 day left";
  if (d <= ENDING_SOON_DAYS) return `${d} days left`;
  return s.valid_until ? `Ends ${format(new Date(s.valid_until), "d MMM")}` : "Ongoing";
};

export interface ValidityLines {
  primary: string;
  secondary: string;
}

export const formatValidTill = (s: SpecialLike): ValidityLines => {
  const from = s.valid_from ? new Date(s.valid_from) : null;
  const until = s.valid_until ? new Date(s.valid_until) : null;
  if (from && until) {
    const sameDay =
      from.getFullYear() === until.getFullYear() &&
      from.getMonth() === until.getMonth() &&
      from.getDate() === until.getDate();
    if (sameDay) return { primary: "Valid for", secondary: format(until, "d MMMM yyyy") };
  }
  if (until) return { primary: "Valid until", secondary: format(until, "d MMMM yyyy") };
  return { primary: "Ongoing", secondary: "No expiry" };
};

// One-line schedule — the business's own wording wins.
export const scheduleLine = (s: SpecialLike): string => {
  const own = str(s.card_footer_text);
  if (own) return own;
  const { primary, secondary } = formatValidTill(s);
  return primary === "Ongoing" ? "Ongoing" : `${primary} ${secondary}`;
};

/* ------------------------------------------------------------------ */
/* Value bar model                                                     */
/* ------------------------------------------------------------------ */

// What sits on the left of the value bar. Specials are heterogeneous: some
// carry a real price, some only a deal statement ("Buy 1, get 1 free"), some
// neither — so the bar has to render all three without changing height.
export type SpecialValue =
  | { kind: "price"; price: string; original: string | null; note: string | null }
  | { kind: "deal"; text: string }
  | { kind: "none" };

export const specialValue = (s: SpecialLike): SpecialValue => {
  const price = str(s.price);
  if (price) {
    const original = str(s.original_price);
    return {
      kind: "price",
      price,
      original: original && original !== price ? original : null,
      note: str(s.price_label),
    };
  }
  // No price set — a structured discount or the savings line becomes the value.
  const pct = s.discount_type === "percent_off" ? numeric(s.discount_value) : null;
  if (pct != null) return { kind: "deal", text: `${pct}% Off` };
  const amt = s.discount_type === "amount_off" ? numeric(s.discount_value) : null;
  if (amt != null) return { kind: "deal", text: `Save R${amt}` };
  // A written offer beats a bare original_price: "Free breakfast" is the deal,
  // whereas a lone original_price is a data-entry slip — still a number worth
  // showing, but only when there is nothing better.
  const deal = str(s.savings) || str(s.freebie_text) || str(s.original_price);
  if (deal) return { kind: "deal", text: capitaliseOff(deal) };
  return { kind: "none" };
};

// Legacy savings copy arrives as "20% off"; cards read "20% Off".
const capitaliseOff = (text: string) => text.replace(/\boff\b/g, "Off");

// "20" from 20, "20.5" from 20.5, null when unusable.
const numeric = (v: unknown): string | null => {
  if (v == null || String(v).trim() === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return String(Math.round(n * 100) / 100);
};

// Human date line for a special: weekly day, date range, or nothing at all.
export const specialDateLine = (s: SpecialLike): string | null => {
  const days = parseDays(s.day_of_week);
  const from = s.valid_from ? new Date(s.valid_from) : null;
  const until = s.valid_until ? new Date(s.valid_until) : null;
  const validFrom = from && !isNaN(from.getTime()) ? from : null;
  const validUntil = until && !isNaN(until.getTime()) ? until : null;

  // Days win over dates: a weekly deal is defined by the night it runs on, and
  // the abbreviated form is what keeps this line inside a 170px card.
  if (days.length) {
    if (validUntil) return `${recurringDays(days)} until ${format(validUntil, "d MMM")}`;
    // "Every day" already carries its own "every".
    return days.length === 7 ? "Every day" : `Every ${compactDays(days)}`;
  }
  if (validFrom && validUntil) {
    const sameMonth =
      validFrom.getMonth() === validUntil.getMonth() && validFrom.getFullYear() === validUntil.getFullYear();
    return sameMonth
      ? `${format(validFrom, "d")} to ${format(validUntil, "d MMM")}`
      : `${format(validFrom, "d MMM")} to ${format(validUntil, "d MMM")}`;
  }
  if (validUntil) return `Until ${format(validUntil, "d MMM")}`;
  return null;
};

// Accent shown alongside a price. Explicit savings wording is used verbatim;
// otherwise it's derived from original − price so "R70 R95" gains a "Save R25".
export const savingLabel = (s: SpecialLike): string | null => {
  const explicit = str(s.savings);
  if (explicit) return explicit;
  const orig = parseNum(s.original_price);
  const price = parseNum(s.price);
  if (orig == null || price == null || orig <= price) return null;
  const diff = Math.round((orig - price) * 100) / 100;
  const prefix = /r/i.test(String(s.original_price)) ? "R" : "";
  return `Save ${prefix}${diff}`;
};

// Right slot of the value bar. Urgency always wins — "3 days left" is the most
// conversion-relevant thing on a deals card — then the business's own wording,
// then the schedule. Empty string means there is nothing to say, so callers
// render no row at all rather than an empty one.
export const specialMeta = (s: SpecialLike): { text: string; urgent: boolean } => {
  if (isEndingSoon(s)) return { text: countdownLabel(s), urgent: true };
  const own = str(s.card_footer_text);
  if (own) return { text: own, urgent: false };
  const line = specialDateLine(s);
  if (line) return { text: line, urgent: false };
  if (s.valid_until) return { text: countdownLabel(s), urgent: false };
  return { text: "", urgent: false };
};
