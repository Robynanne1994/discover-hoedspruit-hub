/**
 * One rule for every filter pill in the app: tapping a pill that is already
 * chosen clears that filter back to its default ("All" / "Any"), so any pill
 * works as a toggle. Tapping the default pill itself changes nothing, because
 * that already *is* the unselected state.
 */
export const pillToggle = <T>(current: T, clicked: T, defaultValue: T): T =>
  current === clicked && clicked !== defaultValue ? defaultValue : clicked;
