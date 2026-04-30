// Treat "-" (a placeholder value sometimes used in CSV imports to indicate
// "no value") as empty/null on every string field of a record. This prevents
// dash-only contact fields from rendering buttons, links or blocks anywhere.

export function sanitizeDashes<T extends Record<string, any> | null | undefined>(row: T): T {
  if (!row || typeof row !== "object") return row;
  const out: any = Array.isArray(row) ? [...(row as any)] : { ...(row as any) };
  for (const k of Object.keys(out)) {
    const v = out[k];
    if (typeof v === "string" && v.trim() === "-") {
      out[k] = null;
    }
  }
  return out;
}

export function sanitizeDashesList<T extends Record<string, any>>(rows: T[] | null | undefined): T[] {
  if (!rows) return [];
  return rows.map((r) => sanitizeDashes(r));
}
