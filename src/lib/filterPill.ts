/**
 * One rule for every filter pill in the app: tapping a pill that is already
 * chosen clears that filter back to its default ("All" / "Any"), so any pill
 * works as a toggle. Tapping the default pill itself changes nothing, because
 * that already *is* the unselected state.
 */
export const pillToggle = <T>(current: T, clicked: T, defaultValue: T): T =>
  current === clicked && clicked !== defaultValue ? defaultValue : clicked;

/**
 * Whether a page's "All" pill should look chosen.
 *
 * "All" means nothing has been narrowed yet, so it lights only while every
 * filter is off and no search term is typed. Once any filter is applied, "All"
 * stays plain so the lit pill always names the filter actually doing the work.
 */
export const allPillActive = (filtersOn: boolean, searching = false): boolean =>
  !filtersOn && !searching;

/** Category bars need a bulk clear only when multiple removable filters exist. */
export const categoryClearAllVisible = (appliedFilterCount: number): boolean =>
  appliedFilterCount > 1;
