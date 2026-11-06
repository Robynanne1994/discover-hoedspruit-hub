import { getNextOccurrence, getPerformances, resolveRecurrenceRule, type EventScheduleLike } from "./eventSchedule";
import { getEventDates } from "./eventDates";

export type EventCsvScope = "past" | "upcoming";
export type EventCsvImportMode = EventCsvScope | "new";

/** Calendar boundaries are always Johannesburg's, regardless of the browser timezone. */
export function eventCsvToday(now: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const value = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return new Date(value("year"), value("month") - 1, value("day"));
}

export function eventCsvScope(event: EventScheduleLike, now: Date = new Date()): EventCsvScope | null {
  const today = eventCsvToday(now);
  if (getNextOccurrence(event, today)) return "upcoming";
  const { start, end } = getEventDates(event);
  if (getPerformances(event).length || start || end || resolveRecurrenceRule(event)) return "past";
  return null;
}

/** Guard both the stored event and proposed dates, so one sheet cannot move or edit the other scope. */
export function eventCsvAction(
  mode: EventCsvImportMode,
  incoming: EventScheduleLike,
  existing: EventScheduleLike | undefined,
  now: Date = new Date(),
): "insert" | "update" | "skip" {
  if (mode === "new") return existing ? "skip" : "insert";
  if (existing && eventCsvScope(existing, now) !== mode) return "skip";
  if (eventCsvScope(incoming, now) !== mode) return "skip";
  if (existing) return "update";
  return mode === "upcoming" ? "insert" : "skip";
}