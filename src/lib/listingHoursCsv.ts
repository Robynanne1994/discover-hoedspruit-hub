// Listing opening-hours cells on the universal sheet.
// opening_hours: `{json}` for a single schedule, `Label {json}` when the listing
// keeps extra schedules. additional_hours: `Label {json}|Label {json}`.
// The opening_hours_label column is retired; its value travels in front of the JSON.
import { parseAdditionalHours } from "./openHours";

type Hours = Record<string, string>;
const isPlaceholder = (v: string) => /^[-–—]+$/.test(v) || /^(n\/a|na|none|null)$/i.test(v);

const cleanHours = (raw: unknown): Hours => {
  const out: Hours = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "string" && v.trim()) out[k.trim().toLowerCase()] = v.trim();
  }
  return out;
};

const setCell = (label: string, hours: Hours) => {
  // Alphabetical day keys, the same order the database stores and the sheet already uses.
  const json = JSON.stringify(Object.fromEntries(Object.entries(hours).sort(([a], [b]) => a.localeCompare(b))));
  return label.trim() ? `${label.trim()} ${json}` : json;
};

/** Split `Label {json}` into its label (may be "") and hours; null if the JSON can't be read. */
export function parseHoursSet(cell: string): { label: string; hours: Hours } | null {
  const text = cell.trim();
  const brace = text.indexOf("{");
  if (brace < 0) return null;
  try {
    const hours = cleanHours(JSON.parse(text.slice(brace)));
    if (Object.keys(hours).length === 0) return null;
    return { label: text.slice(0, brace).trim(), hours };
  } catch {
    return null;
  }
}

export function hoursCellsForExport(row: Record<string, unknown>) {
  const primary = cleanHours(row.opening_hours);
  const extras = parseAdditionalHours(row.additional_hours);
  const hasPrimary = Object.keys(primary).length > 0;
  const label = extras.length > 0 ? String(row.opening_hours_label ?? "") : "";
  return {
    opening_hours: hasPrimary ? setCell(label, primary) : "",
    additional_hours: extras.map((s) => setCell(s.label, s.hours)).join("|"),
  };
}

export type HoursImport = { payload: Record<string, unknown>; errors: string[] };

/** Blank cell on update leaves stored values; "-" clears. */
export function hoursPayloadFromCells(
  openingCell: string | undefined, additionalCell: string | undefined, isUpdate: boolean,
): HoursImport {
  const payload: Record<string, unknown> = {};
  const errors: string[] = [];
  const opening = (openingCell ?? "").trim();
  if (opening === "" && !isUpdate) { payload.opening_hours = null; payload.opening_hours_label = null; }
  else if (opening !== "" && isPlaceholder(opening)) { payload.opening_hours = null; payload.opening_hours_label = null; }
  else if (opening !== "") {
    const set = parseHoursSet(opening);
    if (!set) errors.push(`opening_hours could not be read — e.g. Restaurant {"monday":"10:30 - 21:00"}. Left unchanged`);
    else { payload.opening_hours = set.hours; payload.opening_hours_label = set.label || null; }
  }

  const additional = (additionalCell ?? "").trim();
  if (additional === "" && !isUpdate) payload.additional_hours = null;
  else if (additional !== "" && isPlaceholder(additional)) payload.additional_hours = null;
  else if (additional !== "") {
    if (additional.startsWith("[")) {
      // Older sheets held a JSON list.
      const sets = parseAdditionalHours(additional);
      if (sets.length) payload.additional_hours = sets;
      else errors.push(`additional_hours could not be read — e.g. Bar {"monday":"16:00 - 00:00"}|Lodge {"monday":"08:00 - 17:00"}. Left unchanged`);
    } else {
      const parts = additional.split(/(?<=\})\s*\|\s*/);
      const sets = parts.map(parseHoursSet);
      if (sets.some((s) => !s)) errors.push(`additional_hours could not be read — e.g. Bar {"monday":"16:00 - 00:00"}|Lodge {"monday":"08:00 - 17:00"}. Left unchanged`);
      else payload.additional_hours = sets.map((s, i) => ({ label: s!.label || `Hours ${i + 2}`, hours: s!.hours }));
    }
  }
  return { payload, errors };
}
