// Helpers for the new structured event date fields (start_date, end_date)
// with graceful fallback to the legacy free-text `date` field.

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_LONG = ["January","February","March","April","May","June","July","August","September","October","November","December"];

/** Parse a "YYYY-MM-DD" string as a local Date (avoids UTC drift). */
export function parseISODateLocal(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const d = new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
  return isNaN(d.getTime()) ? null : d;
}

export interface EventDateLike {
  date?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

/** Returns Date objects for an event when possible. Falls back to nothing for free-text only events (e.g. "Every Saturday"). */
export function getEventDates(e: EventDateLike): { start: Date | null; end: Date | null } {
  const start = parseISODateLocal(e.start_date) ?? null;
  const end = parseISODateLocal(e.end_date) ?? start;
  return { start, end };
}

/** All concrete dates an event spans (inclusive). Empty if no structured dates. */
export function expandEventDates(e: EventDateLike): Date[] {
  const { start, end } = getEventDates(e);
  if (!start) return [];
  const out: Date[] = [];
  const last = end ?? start;
  for (let d = new Date(start); d <= last; d.setDate(d.getDate() + 1)) {
    out.push(new Date(d));
  }
  return out;
}

/** Compact range label like "12 – 14 Jun 2026" or "12 Jun 2026". Falls back to legacy `date` text. */
export function formatEventDateRange(e: EventDateLike, opts: { long?: boolean } = {}): string {
  const { start, end } = getEventDates(e);
  if (!start) return (e.date || "").replace(/<[^>]*>/g, "").trim();
  const months = opts.long ? MONTHS_LONG : MONTHS_SHORT;
  const sameDay = !end || start.getTime() === end.getTime();
  if (sameDay) return `${start.getDate()} ${months[start.getMonth()]} ${start.getFullYear()}`;
  const sameMonth = start.getMonth() === end!.getMonth() && start.getFullYear() === end!.getFullYear();
  const sameYear = start.getFullYear() === end!.getFullYear();
  if (sameMonth) return `${start.getDate()} – ${end!.getDate()} ${months[start.getMonth()]} ${start.getFullYear()}`;
  if (sameYear) return `${start.getDate()} ${months[start.getMonth()]} – ${end!.getDate()} ${months[end!.getMonth()]} ${start.getFullYear()}`;
  return `${start.getDate()} ${months[start.getMonth()]} ${start.getFullYear()} – ${end!.getDate()} ${months[end!.getMonth()]} ${end!.getFullYear()}`;
}

/** Short label for cards: "12 Jun" or "12–14 Jun". */
export function formatEventDateShort(e: EventDateLike): string {
  const { start, end } = getEventDates(e);
  if (!start) return (e.date || "").replace(/<[^>]*>/g, "").trim();
  const sameDay = !end || start.getTime() === end.getTime();
  if (sameDay) return `${start.getDate()} ${MONTHS_SHORT[start.getMonth()]}`;
  const sameMonth = start.getMonth() === end!.getMonth() && start.getFullYear() === end!.getFullYear();
  if (sameMonth) return `${start.getDate()}–${end!.getDate()} ${MONTHS_SHORT[start.getMonth()]}`;
  return `${start.getDate()} ${MONTHS_SHORT[start.getMonth()]} – ${end!.getDate()} ${MONTHS_SHORT[end!.getMonth()]}`;
}

/** Sort key (uses start_date if available). */
export function getEventSortDate(e: EventDateLike): Date | null {
  return getEventDates(e).start;
}
