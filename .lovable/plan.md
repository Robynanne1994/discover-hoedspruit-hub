## Events page header redesign

Match the reference layout: keep the small "Events" title at top, redesign search, then add a results count row with the filter icon on the right.

### Changes to `src/pages/Events.tsx`

1. **Search bar** (line ~658)
   - Change placeholder from `"Search events"` to `"Search any local happenings"`.
   - Keep existing styling (cream pill with search icon).

2. **New results-count row** (insert between search bar and pills)
   - Layout: flex row, `padding: "0 24px"`, `marginBottom: 16`, `justifyContent: space-between`, `alignItems: center`.
   - Left: small text "{N} events" using `sortedEvents.length` (upcoming/visible count) — small size (~13px), cream-tinted color, SANS font.
   - Right: reuse the existing `filterIconBtn` component (the circular sliders icon with its tag-filter dropdown intact).
   - No grid/square icon (per request).

3. **Remove filter icon from "upcoming" SectionHead** (line 742)
   - Change `<SectionHead heading={...} trailing={filterIconBtn} />` to drop the `trailing` prop so the icon no longer appears under the pills.

4. **Keep as-is**
   - "Events" title at top (already implemented).
   - Pills row.
   - All sections below (Upcoming, Recurring, etc.).
   - No back button (already absent).

### Count semantics
Use `sortedEvents.length` — that's all upcoming/dated events post-sort, before search/tag filtering. If you'd prefer the count to reflect the active filter+search (i.e. `filtered.length`), confirm and I'll switch it.
