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
 * The past list reads newest first: the event that finished most recently leads.
 * That is only its default order, so a sort chosen by hand still wins —
 * `defaultSort` is the value the page carries when nothing has been chosen.
 */
export function pastAwareSort<S extends string>(
  activeFilter: string,
  sortBy: S,
  defaultSort: S,
  newestFirstSort: S,
): S {
  return activeFilter === "past" && sortBy === defaultSort ? newestFirstSort : sortBy;
}
