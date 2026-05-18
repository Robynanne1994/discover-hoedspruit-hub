## Redesign `src/pages/Events.tsx` to match screenshot

Rebuild the page's visual layout while keeping all existing data, filtering, and routing logic working.

### New layout (top → bottom)

1. **Header card** (ivory `#f5f0e8`, rounded)
   - Circular black "HH" logo
   - "Hello Hoedspruit" title + "YOUR LOWVELD LOCAL" subtitle
   - Two circular icon buttons on the right: search (opens search input/drawer) and filters (opens existing `RefineDrawer`)

2. **Month/date strip card** (white, rounded)
   - Current month + year heading ("October 2023" style — derived from selected date)
   - Left/right circular arrow buttons to page weeks
   - 7-day row (Mon–Sun) showing weekday label + day number; selected day pill in dark olive (`#48484a`-style) with cream text
   - Selecting a day filters events to that date

3. **Filter pills row**
   - "All", "Today", "This Week", "This Month" pills (drop "Past")
   - Active pill: dark olive bg, cream text. Inactive: white bg, dark text.
   - Tapping a pill clears the single-day selection above

4. **Upcoming Events section**
   - "Upcoming Events" heading (left) + "See all" link (right) — only show "See all" when list is truncated; otherwise omit
   - Vertical stack of event cards (white, rounded `16px`, 4px gap):
     - Left: square 3:4-ish thumbnail with rounded corners
     - Middle: bold title (2 lines max), date • time line, pin icon + location + distance (distance hidden if not available)
     - Right column: price (or "Free") on top, category tag pill below

### Logic changes

- Add `selectedDate: Date | null` state; when set, filters `datedAll` to events whose `_parsed` matches that date
- Month label + week strip derive from `selectedDate ?? today`
- Week arrows shift the visible 7-day window by ±7 days; selection auto-updates
- Tag pill on card uses `event.tag`
- Price comes from `event.price` (already exists); show "Free" if empty/0
- Distance: skipped unless a future enhancement adds geolocation — show only location text for now (don't fabricate "15 km")
- Keep existing search drawer, refine drawer, recurring-event resolution, and route to `/events/:id`

### Styling

- Page bg: `#ebebeb`
- Card surfaces: ivory `#f5f0e8` for header, white for date strip + event cards
- Typography: Helvetica Neue 400, uppercase weekday labels with `0.01em` tracking, headings in `#020202`, body in `#2b2420`
- 20px horizontal page padding, 4px gaps between cards, 100px bottom padding (per project memory)
- Replace inline `SERIF`/serif font usage on this page with Helvetica Neue

### Files touched

- `src/pages/Events.tsx` — rewrite the JSX + add date-strip component and new card component inline; keep imports for queries/refine drawer; no schema or other-file changes

### Out of scope

- No DB changes, no new fields (distance), no changes to `EventDetail` or admin
