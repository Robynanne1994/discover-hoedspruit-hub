import { getEventDates } from "./eventDates";
import { getEventOccurrences, hasPerformances, resolveRecurrenceRule, type EventScheduleLike } from "./eventSchedule";

/** Compare event wall-clock times in Johannesburg, not the viewer's timezone. */
export function getEventLiveStatus(event: EventScheduleLike, now = new Date()): "upcoming" | "happening" | "past" {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const part = (name: string) => Number(parts.find((p) => p.type === name)?.value ?? 0);
  const local = new Date(part("year"), part("month") - 1, part("day"), part("hour"), part("minute"), part("second"));
  const atTime = (date: Date, time?: string | null, end = false) => {
    const result = new Date(date);
    const match = time?.match(/^(\d{1,2}):(\d{2})/);
    result.setHours(match ? Number(match[1]) : end ? 24 : 0, match ? Number(match[2]) : 0, 0, 0);
    return result;
  };
  const bounds = (date: Date, start?: string | null, end?: string | null, last = date) => {
    const begins = atTime(date, start);
    const finishes = atTime(last, end, true);
    if (finishes <= begins) finishes.setDate(finishes.getDate() + 1);
    return { begins, finishes };
  };
  if (hasPerformances(event) || resolveRecurrenceRule(event)) {
    const from = new Date(local);
    from.setDate(from.getDate() - 1);
    from.setHours(0, 0, 0, 0);
    const to = new Date(local);
    to.setFullYear(to.getFullYear() + 2);
    to.setHours(23, 59, 59, 999);
    const occurrences = getEventOccurrences(event, { from, to, now: local });
    const windows = occurrences.map((o) => bounds(o.date, o.startTime, o.endTime));
    if (windows.some(({ begins, finishes }) => local >= begins && local < finishes)) return "happening";
    // Unbounded recurrence and distant future performances remain upcoming.
    if (windows.some(({ finishes }) => local < finishes)) return "upcoming";
    if (hasPerformances(event)) {
      const future = Array.isArray(event.performances) && event.performances.some((p) => p?.date > `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, "0")}-${String(local.getDate()).padStart(2, "0")}`);
      return future ? "upcoming" : "past";
    }
    return !event.end_date || new Date(event.end_date.slice(0, 10) + "T23:59:59") > local ? "upcoming" : "past";
  }
  const { start, end } = getEventDates(event);
  if (!start) return "upcoming";
  const { begins, finishes } = bounds(start, event.start_time, event.end_time, end ?? start);
  return local < begins ? "upcoming" : local < finishes ? "happening" : "past";
}

export function isEventHappeningNow(event: EventScheduleLike, now = new Date()): boolean {
  return getEventLiveStatus(event, now) === "happening";
}