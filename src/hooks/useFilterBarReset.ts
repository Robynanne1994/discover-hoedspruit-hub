import { useEffect, useRef } from "react";

/**
 * Returns a filter bar to how it first showed, the moment nothing narrows the
 * list any more: the page back at the top and the bar back at its start, so the
 * Filters button and the lit All pill are what comes back into view.
 *
 * Only a real last-filter-off transition counts. Opening a page, or scrolling
 * with nothing applied, leaves the view where the user left it.
 */
export function useFilterBarReset(
  barRef: { current: HTMLDivElement | null },
  narrowed: boolean
) {
  const wasNarrowed = useRef(false);

  useEffect(() => {
    if (wasNarrowed.current && !narrowed) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      barRef.current?.scrollTo({ left: 0, behavior: "smooth" });
    }
    wasNarrowed.current = narrowed;
  }, [narrowed, barRef]);
}
