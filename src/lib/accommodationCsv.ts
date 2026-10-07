const PRICE_RANGE_LABELS = new Map([
  ["budget", "Budget"],
  ["luxury", "Luxury"],
  ["mid-range", "Mid-range"],
]);

/** Store accommodation prices in the display form used by the app. */
export function formatAccommodationPrice(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) return null;
  const amount = Number.parseInt(digits, 10);
  if (!Number.isFinite(amount)) return null;
  return `R${amount.toLocaleString("en-US")}`;
}

/** Collapse harmless capitalisation and dash differences onto one stored option. */
export function normalizeAccommodationPriceRange(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const key = String(value)
    .trim()
    .toLowerCase()
    .replace(/[–—−]/g, "-")
    .replace(/\s*-\s*/g, "-");
  if (!key) return null;
  return PRICE_RANGE_LABELS.get(key) ?? null;
}

/** Export stored rand text as spreadsheet-friendly digits. */
export function accommodationPriceForExport(value: unknown): string {
  if (value === null || value === undefined) return "";
  const raw = String(value).trim();
  if (!raw) return "";
  const digits = raw.replace(/[^0-9]/g, "");
  return digits || raw;
}