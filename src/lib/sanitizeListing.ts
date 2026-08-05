// Treat placeholder cells ("-", "N/A", ...) — sometimes used in CSV imports to
// mean "no value" — as empty/null on every string field of a record. This
// prevents placeholder contact fields from rendering buttons, links or blocks
// anywhere.

// Values that mean "deliberately empty". The master listings CSV uses a single
// dash; the dash variants and the usual placeholder words get the same reading
// so a stray "N/A" never becomes a website link.
const BLANK_PLACEHOLDERS = new Set(["-", "--", "---", "–", "—", "n/a", "none", "null"]);

/** True for an empty cell, or one holding a "no value" placeholder. */
export function isBlankPlaceholder(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value !== "string") return false;
  const v = value.trim().toLowerCase();
  return v === "" || BLANK_PLACEHOLDERS.has(v);
}

export function sanitizeDashes<T extends Record<string, any> | null | undefined>(row: T): T {
  if (!row || typeof row !== "object") return row;
  const out: any = Array.isArray(row) ? [...(row as any)] : { ...(row as any) };
  for (const k of Object.keys(out)) {
    const v = out[k];
    if (typeof v === "string" && isBlankPlaceholder(v) && v.trim() !== "") {
      out[k] = null;
    } else if (Array.isArray(v) && v.every((entry) => typeof entry === "string")) {
      // Additional contacts (additional_websites, additional_phones, ...) carry
      // placeholders too, and one of those would render an empty extra row.
      const cleaned = (v as string[]).filter((entry) => !isBlankPlaceholder(entry));
      if (cleaned.length !== v.length) out[k] = cleaned;
    }
  }
  return out;
}

export function sanitizeDashesList<T extends Record<string, any>>(rows: T[] | null | undefined): T[] {
  if (!rows) return [];
  return rows.map((r) => sanitizeDashes(r));
}
