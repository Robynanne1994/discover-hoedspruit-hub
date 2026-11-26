import { getEventSortDate, type EventDateLike } from "./eventDates";

/**
 * The rows the upcoming-events table needs to decide its order: a draft flag,
 * the moment the record was added, and whatever dates the date sort reads.
 */
export type AdminEventOrderRow = EventDateLike & {
  is_active?: boolean | null;
  created_at?: string | null;
};

/**
 * A draft is content the admin has not switched on yet, so it is hidden from
 * the app. Only an explicit FALSE counts; a missing flag means active.
 */
export function isDraftEvent(ev: AdminEventOrderRow): boolean {
  return ev.is_active === false;
}

const createdTime = (ev: AdminEventOrderRow) => {
  const stamp = ev.created_at ? new Date(ev.created_at).getTime() : NaN;
  return Number.isNaN(stamp) ? 0 : stamp;
};

/** Newest added first, so a fresh draft sits above an older one. */
const byNewestAdded = (a: AdminEventOrderRow, b: AdminEventOrderRow) =>
  createdTime(b) - createdTime(a);

/**
 * Order for the admin upcoming-events table:
 * 1. Drafts (not yet active) on top, newest added first.
 * 2. Then live events soonest date first, latest date last.
 * 3. Live events with no usable date last, newest added first.
 */
export function sortAdminUpcomingEvents<T extends AdminEventOrderRow>(events: T[]): T[] {
  const drafts = events.filter(isDraftEvent).sort(byNewestAdded);
  const live = events.filter((ev) => !isDraftEvent(ev));
  const dated = live.filter((ev) => getEventSortDate(ev));
  const undated = live.filter((ev) => !getEventSortDate(ev));
  dated.sort(
    (a, b) =>
      (getEventSortDate(a) as Date).getTime() - (getEventSortDate(b) as Date).getTime() ||
      byNewestAdded(a, b),
  );
  undated.sort(byNewestAdded);
  return [...drafts, ...dated, ...undated];
}
