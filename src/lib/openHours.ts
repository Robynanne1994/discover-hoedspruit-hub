const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const DAY_KEYS = DAY_LABELS.map((d) => d.toLowerCase());

export type HoursMap = Record<string, string>;

// One named set of opening hours. Nearly every listing has exactly one of
// these (its plain opening_hours); a listing that trades on two clocks — a
// restaurant kitchen and a bar that outlasts it — has one per clock.
export type HoursSchedule = { label: string; hours: HoursMap };

// What the first schedule is called when the editor hasn't named it, which is
// the case for every listing that only keeps one.
export const DEFAULT_HOURS_LABEL = "Opening Hours";

const parseTime = (s: string) => {
  const [h, mm] = s.replace(".", ":").split(":");
  return parseInt(h, 10) * 60 + (mm ? parseInt(mm, 10) : 0);
};

export const todayHours = (openingHours: HoursMap | null | undefined) => {
  if (!openingHours) return null;
  const now = new Date();
  const todayIdx = now.getDay();
  const todayLabel = todayIdx === 0 ? "Sunday" : DAY_LABELS[todayIdx - 1];
  const raw = openingHours[todayLabel.toLowerCase()];
  return typeof raw === "string" ? raw : null;
};

export const isAlwaysOpen = (v: string | null | undefined): boolean => {
  if (!v) return false;
  return /always\s*open|24\s*\/?\s*7|open\s*24|24\s*hours?|24h\b/i.test(v);
};

export const isOpenNow = (openingHours: HoursMap | null | undefined): boolean => {
  const v = todayHours(openingHours);
  if (!v || /closed/i.test(v)) return false;
  if (isAlwaysOpen(v)) return true;
  const m = v.match(/(\d{1,2}[:.]?\d{0,2})\s*[-–]\s*(\d{1,2}[:.]?\d{0,2})/);
  if (!m) return false;
  const cur = new Date().getHours() * 60 + new Date().getMinutes();
  const o = parseTime(m[1]);
  let c = parseTime(m[2]);
  // "18:00 - 00:00" and "18:00 - 02:00" close on the following day. The second
  // reading also covers the small hours: at 00:30 the window that is still
  // running is the one that opened last night.
  if (c <= o) {
    c += 24 * 60;
    if (cur < o && cur + 24 * 60 <= c) return true;
  }
  return cur >= o && cur <= c;
};

export const opensAt = (openingHours: HoursMap | null | undefined): string | null => {
  const v = todayHours(openingHours);
  if (!v || /closed/i.test(v)) return null;
  const m = v.match(/(\d{1,2}[:.]?\d{0,2})\s*[-–]/);
  return m ? m[1].replace(".", ":") : null;
};

// ----- Multiple schedules -----

export const hasAnyHours = (hours: HoursMap | null | undefined): boolean =>
  !!hours && Object.values(hours).some((v) => typeof v === "string" && v.trim() !== "");

// Keep only the seven day keys, as trimmed strings. Anything else a CSV cell
// or an old row happens to carry is dropped rather than rendered.
const cleanHoursMap = (raw: unknown): HoursMap => {
  const out: HoursMap = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  const src = raw as Record<string, unknown>;
  for (const key of DAY_KEYS) {
    const v = src[key];
    if (typeof v === "string" && v.trim() !== "") out[key] = v.trim();
  }
  return out;
};

/**
 * Read the `additional_hours` column into schedules.
 *
 * Deliberately forgiving: this value is typed by hand in the backend editor
 * and can arrive as a JSON cell in a CSV, so a malformed entry is skipped and
 * the rest of the listing still renders. An entry with no populated day is
 * dropped too — a labelled but empty schedule is a half-finished edit, not
 * something a visitor should see.
 */
export const parseAdditionalHours = (raw: unknown): HoursSchedule[] => {
  let value = raw;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try { value = JSON.parse(trimmed); } catch { return []; }
  }
  if (!Array.isArray(value)) return [];
  const out: HoursSchedule[] = [];
  value.forEach((entry, i) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return;
    const e = entry as Record<string, unknown>;
    const hours = cleanHoursMap(e.hours);
    if (!hasAnyHours(hours)) return;
    const label = typeof e.label === "string" && e.label.trim() ? e.label.trim() : `Hours ${i + 2}`;
    out.push({ label, hours });
  });
  return out;
};

type HoursSource = {
  opening_hours?: unknown;
  opening_hours_label?: unknown;
  additional_hours?: unknown;
};

/**
 * Every schedule a listing keeps, primary first.
 *
 * The primary one is the existing `opening_hours` column, named by
 * `opening_hours_label` (or "Opening Hours" when the editor left that blank —
 * which is the normal case). Returns [] when the listing has no hours at all,
 * so callers can keep asking one question instead of two.
 */
export const getHoursSchedules = (listing: HoursSource | null | undefined): HoursSchedule[] => {
  if (!listing) return [];
  const primary = cleanHoursMap(listing.opening_hours);
  const extras = parseAdditionalHours(listing.additional_hours);
  const out: HoursSchedule[] = [];
  if (hasAnyHours(primary)) {
    const rawLabel = listing.opening_hours_label;
    const label = typeof rawLabel === "string" && rawLabel.trim() ? rawLabel.trim() : DEFAULT_HOURS_LABEL;
    out.push({ label, hours: primary });
  }
  return [...out, ...extras];
};

// True when *any* of the listing's schedules is open — the bar counts even
// once the kitchen has closed. This is what the "Open Now" filter and the
// card status bars ask.
export const isAnyOpenNow = (listing: HoursSource | null | undefined): boolean =>
  getHoursSchedules(listing).some((s) => isOpenNow(s.hours));

/**
 * The schedule a card or header should speak for: whichever one is open now
 * (earliest in the editor's order), falling back to the primary so a closed
 * listing still shows when it next opens.
 */
export const headlineSchedule = (schedules: HoursSchedule[]): HoursSchedule | null => {
  if (schedules.length === 0) return null;
  return schedules.find((s) => isOpenNow(s.hours)) ?? schedules[0];
};

// ----- Living with a migration that hasn't landed yet -----
//
// The extra-schedule columns arrive in a migration, and this project ships code
// and migrations separately: the app can be running against a database that
// still only has `opening_hours`. Naming a column the database doesn't have
// fails the whole query, which would take out category pages and saved lists
// over something almost no listing uses. So every query that asks for the new
// columns can fall back to the ones that have always been there, and simply
// shows single-schedule hours until the migration is applied.

export const HOURS_COLUMNS = "opening_hours, opening_hours_label, additional_hours";
export const LEGACY_HOURS_COLUMNS = "opening_hours";

export const isMissingHoursColumn = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const e = error as { message?: string; details?: string; hint?: string };
  return /opening_hours_label|additional_hours/.test(
    `${e.message ?? ""} ${e.details ?? ""} ${e.hint ?? ""}`,
  );
};

/**
 * Run a query with the multi-schedule columns, once more without them if the
 * database hasn't got them yet. `run` must throw on a query error (the usual
 * `if (error) throw error`) for the fallback to kick in.
 */
export async function withHoursColumns<T>(run: (hoursColumns: string) => Promise<T>): Promise<T> {
  try {
    return await run(HOURS_COLUMNS);
  } catch (e) {
    if (!isMissingHoursColumn(e)) throw e;
    return await run(LEGACY_HOURS_COLUMNS);
  }
}
