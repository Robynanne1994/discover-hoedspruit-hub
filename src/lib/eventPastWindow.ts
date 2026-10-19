// The "Past" events filter only reaches back a limited window, so the list
// stays short instead of growing forever. Shared by the filter pills, the
// category counts and the list itself so all three agree on what counts as past.

import { isBefore, startOfToday, subMonths } from "date-fns";

export const PAST_MONTHS = 3;

/** Heading shown above past events in place of the month groups. */
export const PAST_GROUP_LABEL = "Events in the Past 3 Months";

/** Oldest date still shown in the past list (inclusive). */
export function getPastWindowStart(today: Date = startOfToday()): Date {
  return subMonths(today, PAST_MONTHS);
}

/** True when the event date has passed but is still inside the window. */
export function isRecentPast(d: Date | null | undefined, today: Date = startOfToday()): boolean {
  if (!d) return false;
  return isBefore(d, today) && !isBefore(d, getPastWindowStart(today));
}
