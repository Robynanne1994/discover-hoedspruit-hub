// The "Past" events filter only reaches back a month, so the list stays short
// instead of growing forever. Shared by the filter pills, the category counts
// and the list itself so all three agree on what counts as past.

import { isBefore, startOfToday, subMonths } from "date-fns";

export const PAST_MONTHS = 1;

/** Heading shown above past events in place of the month groups. */
export const PAST_GROUP_LABEL = "Events in the Past Month";

/** Oldest date still shown in the past list (inclusive). */
export function getPastWindowStart(today: Date = startOfToday()): Date {
  return subMonths(today, PAST_MONTHS);
}

/** True when the event date has passed but is still inside the window. */
export function isRecentPast(d: Date | null | undefined, today: Date = startOfToday()): boolean {
  if (!d) return false;
  return isBefore(d, today) && !isBefore(d, getPastWindowStart(today));
}

/**
 * The order a list falls back to when nothing has been chosen. The past list
 * reads newest first — the event that finished most recently leads — while
 * every other list keeps soonest first.
 */
export function defaultEventSort<S extends string>(
  activeFilter: string,
  soonestFirstSort: S,
  newestFirstSort: S,
): S {
  return activeFilter === "past" ? newestFirstSort : soonestFirstSort;
}

/**
 * A sort written into the address always wins; otherwise the view's own default
 * applies, so the past list can still be read oldest first on request.
 */
export function effectiveEventSort<S extends string>(
  activeFilter: string,
  chosenSort: S | null,
  soonestFirstSort: S,
  newestFirstSort: S,
): S {
  return chosenSort ?? defaultEventSort(activeFilter, soonestFirstSort, newestFirstSort);
}
