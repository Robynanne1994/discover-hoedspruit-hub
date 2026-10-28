import { resolveRecurrenceRule, type EventScheduleLike } from "./eventSchedule";

export const RECURRENCE_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "none", label: "None" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annually", label: "Annually" },
] as const;
export type RecurrenceFilter = typeof RECURRENCE_OPTIONS[number]["value"];

export const TIME_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "night", label: "Night" },
] as const;
export type TimeFilter = typeof TIME_OPTIONS[number]["value"];

export function eventMatchesRecurrence(event: EventScheduleLike, filter: RecurrenceFilter): boolean {
  if (filter === "any") return true;
  const raw = event.recurrence?.trim().toLowerCase() ?? "";
  // Explicit frequency labels take precedence over legacy date-text inference.
  if (raw && raw !== "none") {
    if (RECURRENCE_OPTIONS.some((o) => o.value === raw)) return raw === filter;
    if (raw === "bimonthly") return false;
  }
  const rule = resolveRecurrenceRule(event);
  if (rule) {
    const frequency = rule.kind.startsWith("monthly") ? "monthly" : rule.kind;
    return filter === frequency;
  }
  return filter === "none" && (!raw || raw === "none");
}

export function eventTimeBucket(event: Pick<EventScheduleLike, "start_time">): Exclude<TimeFilter, "any"> | null {
  const match = event.start_time?.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "night";
}

export function eventMatchesTime(event: Pick<EventScheduleLike, "start_time">, filter: TimeFilter): boolean {
  return filter === "any" || eventTimeBucket(event) === filter;
}

export function countEventTimes(events: Pick<EventScheduleLike, "start_time">[]): Record<TimeFilter, number> {
  const counts: Record<TimeFilter, number> = { any: events.length, morning: 0, afternoon: 0, night: 0 };
  for (const event of events) {
    const bucket = eventTimeBucket(event);
    if (bucket) counts[bucket] += 1;
  }
  return counts;
}