// Unified scheduling helpers for the three event shapes:
//   1) Single/continuous   → start_date / end_date (+ start_time)
//   2) Multi-performance   → performances: [{ date, time, end_time? }, ...]
//   3) Recurring           → recurrence rule on a single anchor date
//
// All helpers gracefully fall back when fields are missing, so existing
// events keep behaving exactly as they always have.

import { parseISODateLocal, getEventDates } from "./eventDates";

export interface Performance {
  date: string;          // "YYYY-MM-DD"
  time?: string | null;  // "HH:mm" — optional
  end_time?: string | null;
}

export interface EventOccurrence {
  date: Date;            // start date (local, midnight if no time)
  startTime?: string | null;
  endTime?: string | null;
}

export interface EventScheduleLike {
  date?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  recurrence?: string | null;
  performances?: any; // jsonb — array of Performance or null
}

/** Safely parse the performances jsonb into a sorted list. */
export function getPerformances(e: EventScheduleLike): Performance[] {
  const raw = e?.performances;
  if (!Array.isArray(raw)) return [];
  const out: Performance[] = [];
  for (const p of raw) {
    if (!p || typeof p !== "object") continue;
    const date = typeof p.date === "string" ? p.date.slice(0, 10) : null;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    out.push({
      date,
      time: p.time ? String(p.time).slice(0, 5) : null,
      end_time: p.end_time ? String(p.end_time).slice(0, 5) : null,
    });
  }
  out.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    const at = a.time || "00:00";
    const bt = b.time || "00:00";
    return at < bt ? -1 : at > bt ? 1 : 0;
  });
  return out;
}

export function hasPerformances(e: EventScheduleLike): boolean {
  return getPerformances(e).length > 0;
}

/** Combine a YYYY-MM-DD + HH:mm into a local Date. */
function combine(dateStr: string, time?: string | null): Date {
  const d = parseISODateLocal(dateStr);
  if (!d) return new Date(NaN);
  if (time && /^\d{1,2}:\d{2}/.test(time)) {
    const [h, m] = time.split(":");
    d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
  }
  return d;
}

// ---------- Recurrence ---------------------------------------------------

/**
 * Supported structured recurrence rules:
 *   - "daily"
 *   - "weekly:<weekday>"           weekday 0..6 (Sun..Sat, matches Date#getDay)
 *   - "monthly-day:<n>"            day of month 1..31
 *   - "monthly-nth:<n>:<weekday>"  n = 1..5 (5 = last)
 *
 * Anything else (legacy free text like "Every Saturday") returns null
 * so callers can fall back to the single/continuous behaviour.
 */
type ParsedRule =
  | { kind: "daily" }
  | { kind: "weekly"; weekday: number }
  | { kind: "monthly-day"; day: number }
  | { kind: "monthly-nth"; n: number; weekday: number };

export function parseRecurrenceRule(raw: string | null | undefined): ParsedRule | null {
  if (!raw) return null;
  const s = String(raw).trim().toLowerCase();
  if (!s || s === "none") return null;
  if (s === "daily") return { kind: "daily" };
  let m = s.match(/^weekly:(\d)$/);
  if (m) return { kind: "weekly", weekday: parseInt(m[1], 10) };
  m = s.match(/^monthly-day:(\d{1,2})$/);
  if (m) return { kind: "monthly-day", day: parseInt(m[1], 10) };
  m = s.match(/^monthly-nth:(\d):(\d)$/);
  if (m) return { kind: "monthly-nth", n: parseInt(m[1], 10), weekday: parseInt(m[2], 10) };
  return parseFreeTextRecurrence(s);
}

const WEEKDAY_WORDS: Record<string, number> = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thur: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
};

const NTH_WORDS: Record<string, number> = {
  first: 1, "1st": 1,
  second: 2, "2nd": 2,
  third: 3, "3rd": 3,
  fourth: 4, "4th": 4,
  last: 5,
};

/**
 * Legacy / human recurrence text, e.g. "First Saturday of every month",
 * "Every Saturday", "Last Friday of the month", "Every day".
 * Returns null when the text is not confidently understood.
 */
function parseFreeTextRecurrence(s: string): ParsedRule | null {
  if (/\bevery\s+day\b|\bdaily\b/.test(s)) return { kind: "daily" };

  const weekdayWord = Object.keys(WEEKDAY_WORDS).find((w) => new RegExp(`\\b${w}\\b`).test(s));

  // "first/second/.../last <weekday> of (every|the) month"
  if (weekdayWord && /month/.test(s)) {
    const nthWord = Object.keys(NTH_WORDS).find((w) => new RegExp(`\\b${w}\\b`).test(s));
    if (nthWord) return { kind: "monthly-nth", n: NTH_WORDS[nthWord], weekday: WEEKDAY_WORDS[weekdayWord] };
  }

  // "every <weekday>" / "weekly on <weekday>" / "<weekday>s"
  if (weekdayWord && !/month/.test(s)) {
    return { kind: "weekly", weekday: WEEKDAY_WORDS[weekdayWord] };
  }

  // "<n>th of every month"
  const dayMatch = s.match(/\b(\d{1,2})(st|nd|rd|th)?\s+of\s+(every|each|the)\s+month\b/);
  if (dayMatch) {
    const day = parseInt(dayMatch[1], 10);
    if (day >= 1 && day <= 31) return { kind: "monthly-day", day };
  }

  return null;
}


/** Expand a recurrence rule between anchor start/end into concrete dates within [from, to]. */
function expandRecurrence(
  rule: ParsedRule,
  anchor: Date,
  anchorEnd: Date | null,
  from: Date,
  to: Date
): Date[] {
  const out: Date[] = [];
  const start = anchor > from ? anchor : from;
  const end = anchorEnd && anchorEnd < to ? anchorEnd : to;
  if (start > end) return out;

  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  if (rule.kind === "daily") {
    while (cursor <= last) {
      out.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return out;
  }

  if (rule.kind === "weekly") {
    // advance cursor to next matching weekday
    while (cursor.getDay() !== rule.weekday && cursor <= last) {
      cursor.setDate(cursor.getDate() + 1);
    }
    while (cursor <= last) {
      out.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 7);
    }
    return out;
  }

  if (rule.kind === "monthly-day") {
    // walk month by month
    const c = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    while (c <= last) {
      const d = new Date(c.getFullYear(), c.getMonth(), rule.day);
      if (d.getMonth() === c.getMonth() && d >= cursor && d <= last) out.push(d);
      c.setMonth(c.getMonth() + 1);
    }
    return out;
  }

  if (rule.kind === "monthly-nth") {
    const c = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    while (c <= last) {
      // find first matching weekday in this month
      const first = new Date(c.getFullYear(), c.getMonth(), 1);
      const offset = (rule.weekday - first.getDay() + 7) % 7;
      let day = 1 + offset + (rule.n - 1) * 7;
      if (rule.n === 5) {
        // "last" → find last matching weekday in the month
        const lastDay = new Date(c.getFullYear(), c.getMonth() + 1, 0);
        const back = (lastDay.getDay() - rule.weekday + 7) % 7;
        day = lastDay.getDate() - back;
      }
      const d = new Date(c.getFullYear(), c.getMonth(), day);
      if (d.getMonth() === c.getMonth() && d >= cursor && d <= last) out.push(d);
      c.setMonth(c.getMonth() + 1);
    }
    return out;
  }

  return out;
}

// ---------- Unified occurrence API ---------------------------------------

const MAX_WINDOW_DAYS = 365 * 2;

function defaultWindow(now: Date): { from: Date; to: Date } {
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  from.setFullYear(from.getFullYear() - 1);
  const to = new Date(from);
  to.setDate(to.getDate() + MAX_WINDOW_DAYS);
  return { from, to };
}

/** All concrete occurrences within [from, to] for any event shape. */
export function getEventOccurrences(
  e: EventScheduleLike,
  opts: { from?: Date; to?: Date; now?: Date } = {}
): EventOccurrence[] {
  const now = opts.now ?? new Date();
  const { from, to } = (() => {
    const def = defaultWindow(now);
    return { from: opts.from ?? def.from, to: opts.to ?? def.to };
  })();

  // 1) Multi-performance
  const perfs = getPerformances(e);
  if (perfs.length > 0) {
    return perfs
      .map((p) => ({ date: combine(p.date, p.time), startTime: p.time ?? null, endTime: p.end_time ?? null }))
      .filter((o) => !isNaN(o.date.getTime()) && o.date >= from && o.date <= to);
  }

  // 2) Recurring
  const rule = parseRecurrenceRule(e.recurrence ?? null);
  if (rule) {
    const { start } = getEventDates(e);
    const anchor = start ?? from;
    const anchorEnd = parseISODateLocal(e.end_date ?? null);
    const dates = expandRecurrence(rule, anchor, anchorEnd, from, to);
    return dates.map((d) => {
      const withTime = combine(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
        e.start_time ?? null
      );
      return { date: withTime, startTime: e.start_time ?? null, endTime: e.end_time ?? null };
    });
  }

  // 3) Single / continuous — one occurrence anchored at start
  const { start } = getEventDates(e);
  if (!start) return [];
  const withTime = combine(
    `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`,
    e.start_time ?? null
  );
  if (withTime < from || withTime > to) return [];
  return [{ date: withTime, startTime: e.start_time ?? null, endTime: e.end_time ?? null }];
}

/** Next upcoming occurrence (>= now). For multi-day continuous events, returns the start date until the end date passes. */
export function getNextOccurrence(e: EventScheduleLike, now: Date = new Date()): EventOccurrence | null {
  const perfs = getPerformances(e);
  if (perfs.length > 0) {
    for (const p of perfs) {
      const d = combine(p.date, p.time);
      // if same-day, still "upcoming" until midnight
      const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (day >= today) return { date: d, startTime: p.time ?? null, endTime: p.end_time ?? null };
    }
    return null;
  }

  const rule = parseRecurrenceRule(e.recurrence ?? null);
  if (rule) {
    const { start } = getEventDates(e);
    const anchor = start ?? now;
    const anchorEnd = parseISODateLocal(e.end_date ?? null);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const horizon = new Date(today);
    horizon.setFullYear(horizon.getFullYear() + 2);
    const dates = expandRecurrence(rule, anchor, anchorEnd, today, horizon);
    if (dates.length === 0) return null;
    const d = dates[0];
    const withTime = combine(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      e.start_time ?? null
    );
    return { date: withTime, startTime: e.start_time ?? null, endTime: e.end_time ?? null };
  }

  // Single / continuous
  const { start, end } = getEventDates(e);
  if (!start) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last = end || start;
  if (last < today) return null;
  return { date: combine(`${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`, e.start_time ?? null), startTime: e.start_time ?? null, endTime: e.end_time ?? null };
}

/** How many additional upcoming performances exist after the next one. */
export function getUpcomingPerformancesCount(e: EventScheduleLike, now: Date = new Date()): number {
  const perfs = getPerformances(e);
  if (perfs.length === 0) return 0;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let count = 0;
  for (const p of perfs) {
    const d = parseISODateLocal(p.date);
    if (d && d >= today) count++;
  }
  return Math.max(0, count - 1);
}

/** True when every occurrence is strictly in the past (for the "Event has passed" state). */
export function isEventPast(e: EventScheduleLike, now: Date = new Date()): boolean {
  return getNextOccurrence(e, now) === null && hasAnyDate(e);
}

function hasAnyDate(e: EventScheduleLike): boolean {
  if (hasPerformances(e)) return true;
  if (e.start_date || e.end_date) return true;
  return false;
}

/** A date used for sorting upcoming events ascending. Past events return their last occurrence so they sit at the bottom. */
export function getSortDate(e: EventScheduleLike, now: Date = new Date()): Date | null {
  const next = getNextOccurrence(e, now);
  if (next) return next.date;
  const perfs = getPerformances(e);
  if (perfs.length) {
    const last = perfs[perfs.length - 1];
    return combine(last.date, last.time);
  }
  const { end, start } = getEventDates(e);
  return end || start;
}
