import { format } from "date-fns";

// Every surface that shows a special's badge pill reads it from here, so the
// wording stays identical on the specials list, the homepage rail, the detail
// page and the saved cards. Nothing here decides styling — only the text.
export interface SpecialBadgeLike {
  badge_override?: string | null;
  day_of_week?: string | null;
  discount_type?: string | null;
  discount_value?: number | string | null;
  valid_from?: string | null;
  valid_until?: string | null;
}

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

export const getSpecialBadge = (s: SpecialBadgeLike): string => {
  const override = str(s.badge_override);
  if (override) return override;

  const day = str(s.day_of_week);
  if (day) return `${day} Special`;

  const value = num(s.discount_value);
  if (s.discount_type === "percent_off" && value) return `${value}% Off`;
  if (s.discount_type === "amount_off" && value) return `Save R${value}`;
  if (s.discount_type === "freebie" || s.discount_type === "buy_x_get_y") return "Special Offer";

  const from = parseDate(s.valid_from);
  const until = parseDate(s.valid_until);

  // Roughly May to August reads as the winter season locally.
  if (from && until && from.getMonth() >= 4 && until.getMonth() <= 7 && until >= from) {
    return "Winter Special";
  }
  if (from && until && from.getMonth() === until.getMonth() && from.getFullYear() === until.getFullYear()) {
    return `${format(until, "MMMM")} Special`;
  }
  if (!from && until) return `${format(until, "MMMM")} Special`;

  return "Special";
};
