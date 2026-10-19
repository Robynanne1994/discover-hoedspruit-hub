// Filter pills and drawer options are only shown when they actually have
// events to show. A zero count is never surfaced, so nobody sees
// "This Weekend (0)" on the events page.
export function filtersWithEvents<T>(filters: T[], countOf: (filter: T) => number): T[] {
  return filters.filter((f) => countOf(f) > 0);
}
