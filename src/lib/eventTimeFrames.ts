// The calendar span each Events time-frame pill stands for, and the date words
// the events list wears when that pill is the only filter. Shared by the pill
// row and the list heading so the dates on screen are the dates that were
// filtered: "Today" reads "4 November 2026", "This Week" reads
// "2-8 November 2026" (Monday to Sunday), and so on for every other pill.

import {
  addDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { getPastWindowStart } from "./eventPastWindow";

export type DateRange = { start: Date; end: Date };

/** Friday to Sunday of the current Mon-start week, whichever day it is today. */
export function calendarWeekend(today: Date = new Date()): DateRange {
  const day = startOfDay(today);
  const sinceMonday = (day.getDay() + 6) % 7; // Mon 0 .. Sun 6
  return {
    start: addDays(day, 4 - sinceMonday),
    end: endOfDay(addDays(day, 6 - sinceMonday)),
  };
}

/**
 * The whole calendar span a pill stands for. Null for a pill that covers no
 * dates of its own ("All", or anything unrecognised), which leaves the list
 * heading as plain "Events".
 */
export function getTimeFrameRange(filter: string, today: Date = new Date()): DateRange | null {
  const day = startOfDay(today);
  const year = day.getFullYear();
  switch (filter) {
    case "today":
      return { start: day, end: day };
    case "this-week":
      return {
        start: startOfWeek(day, { weekStartsOn: 1 }),
        end: endOfWeek(day, { weekStartsOn: 1 }),
      };
    case "this-weekend":
      return calendarWeekend(day);
    case "this-month":
      return { start: startOfMonth(day), end: endOfMonth(day) };
    case "this-year":
      return { start: new Date(year, 0, 1), end: new Date(year, 11, 31) };
    case "next-year":
      return { start: new Date(year + 1, 0, 1), end: new Date(year + 1, 11, 31) };
    case "past":
      return { start: getPastWindowStart(day), end: addDays(day, -1) };
    default:
      return null;
  }
}

/**
 * Date words for a span. A whole month or a whole year keeps its own name
 * ("November 2026", "2026"); a single day carries its year ("4 November 2026");
 * a run of days inside one month says only the first figure ("2-8 November
 * 2026"); longer runs repeat the month or the year they cross ("30 October - 1
 * November 2026", "2 November 2025 - 2 November 2026").
 */
export function formatDateRange(range: DateRange, opts: { shortMonth?: boolean } = {}): string {
  const { start, end } = range;
  const year = end.getFullYear();
  const sameYear = start.getFullYear() === year;
  // The past-month pill spells its span in short months ("8 Oct - 7 Nov 2026");
  // every other pill keeps the month written out in full.
  const month = opts.shortMonth ? "MMM" : "MMMM";

  if (sameYear && start.getMonth() === 0 && start.getDate() === 1 && end.getMonth() === 11 && end.getDate() === 31) {
    return String(year);
  }

  const lastDayOfMonth = new Date(year, end.getMonth() + 1, 0).getDate();
  if (sameYear && start.getMonth() === end.getMonth() && start.getDate() === 1 && end.getDate() === lastDayOfMonth) {
    return format(end, `${month} yyyy`);
  }

  if (isSameDay(start, end)) return format(end, `d ${month} yyyy`);
  if (!sameYear) return `${format(start, `d ${month} yyyy`)} - ${format(end, `d ${month} yyyy`)}`;
  if (start.getMonth() !== end.getMonth()) {
    return `${format(start, `d ${month}`)} - ${format(end, `d ${month} yyyy`)}`;
  }
  return `${format(start, "d")}-${format(end, `d ${month} yyyy`)}`;
}

/** The heading a lone time-frame pill wears; "Events" when it covers no dates. */
export function timeFrameHeading(filter: string, today: Date = new Date()): string {
  const range = getTimeFrameRange(filter, today);
  return range ? formatDateRange(range, { shortMonth: filter === "past" }) : "Events";
}
