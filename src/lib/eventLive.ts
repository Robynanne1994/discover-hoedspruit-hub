import { getEventDates } from "./eventDates";
import { getEventOccurrences, hasPerformances, resolveRecurrenceRule, type EventScheduleLike } from "./eventSchedule";

/** Compare event wall-clock times in Johannesburg, not the viewer's timezone. */
export function isEventHappeningNow(event: EventScheduleLike, now = new Date()): boolean {
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
  const within = (date: Date, start?: string | null, end?: string | null, last = date) => {
    const begins = atTime(date, start);
    const finishes = atTime(last, end, true);
    if (finishes <= begins) finishes.setDate(finishes.getDate() + 1);
    return local >= begins && local < finishes;
  };
  if (hasPerformances(event) || resolveRecurrenceRule(event)) {
    const from = new Date(local);
    from.setDate(from.getDate() - 1);
    from.setHours(0, 0, 0, 0);
    const to = new Date(local);
    to.setHours(23, 59, 59, 999);
    return getEventOccurrences(event, { from, to, now: local }).some((o) => within(o.date, o.startTime, o.endTime));
  }
  const { start, end } = getEventDates(event);
  return !!start && within(start, event.start_time, event.end_time, end ?? start);
}