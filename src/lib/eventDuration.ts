import { getEventDates, type EventDateLike } from "./eventDates";

export type DurationFilter = "all" | "1" | "2" | "3" | "4-7" | "8+";

export const DURATION_OPTIONS: { value: DurationFilter; label: string }[] = [
  { value: "all", label: "All Durations" },
  { value: "1", label: "1 Day" },
  { value: "2", label: "2 Days" },
  { value: "3", label: "3 Days" },
  { value: "4-7", label: "4–7 Days" },
  { value: "8+", label: "More than 7 Days" },
];

/** Inclusive day count from start to end date. Same day = 1. Null when no start date. */
export function eventDurationDays(e: EventDateLike): number | null {
  const { start, end } = getEventDates(e);
  if (!start) return null;
  const last = end && end >= start ? end : start;
  const utc = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((utc(last) - utc(start)) / 86400000) + 1;
}

export function eventMatchesDuration(e: EventDateLike, f: DurationFilter): boolean {
  if (f === "all") return true;
  const d = eventDurationDays(e);
  if (d == null) return false;
  if (f === "4-7") return d >= 4 && d <= 7;
  if (f === "8+") return d > 7;
  return d === Number(f);
}

export type BookingFilter = "any" | "required" | "not-required";

/** Events have no separate flag; a booking link of any type means booking is required. */
export function eventRequiresBooking(e: { booking_link?: string | null }): boolean {
  return !!e.booking_link?.trim();
}
