/**
 * Which event filters count as "active", and how many.
 *
 * The Events page keeps its filters in several places at once: the date pill in
 * the address (`?f=`), a category tag in the address (`?t=`), and the drawer's
 * price, duration, booking, recurrence and time-of-day choices in component
 * state. The pill row beside the Filters button needs one honest answer to
 * "are any filters on, and how many?", so the count is decided here rather than
 * re-typed at each call site.
 *
 * Sort is deliberately absent: it reorders the list rather than narrowing it, so
 * it never adds to the count even though Clear All still resets it.
 */

export interface EventFilterState {
  /** Date pill value; "all" is the unselected state. */
  dateFilter: string;
  /** Category tag from the address; null when none is chosen. */
  tagFilter: string | null;
  /** Drawer price choice; "any" is the unselected state. */
  priceFilter: string;
  /** Drawer duration choice; "all" is the unselected state. */
  durationFilter: string;
  /** Drawer booking choice; "any" is the unselected state. */
  bookingFilter: string;
  /** Drawer recurrence choice; "any" is the unselected state. */
  recurrenceFilter: string;
  /** Drawer time-of-day choice; "any" is the unselected state. */
  timeFilter: string;
}

/** The value each dimension holds when that filter is off. */
const DEFAULTS: { [K in keyof EventFilterState]: EventFilterState[K] } = {
  dateFilter: "all",
  tagFilter: null,
  priceFilter: "any",
  durationFilter: "all",
  bookingFilter: "any",
  recurrenceFilter: "any",
  timeFilter: "any",
};

/** The filter dimensions that are switched on, in a fixed order. */
export function activeEventFilterKeys(state: EventFilterState): (keyof EventFilterState)[] {
  return (Object.keys(DEFAULTS) as (keyof EventFilterState)[]).filter(
    (key) => state[key] !== DEFAULTS[key]
  );
}

/** How many filters are on. Zero means the page is showing everything. */
export function activeEventFilterCount(state: EventFilterState): number {
  return activeEventFilterKeys(state).length;
}

/** True when at least one filter narrows the list, so Clear All has work to do. */
export function hasActiveEventFilters(state: EventFilterState): boolean {
  return activeEventFilterCount(state) > 0;
}
