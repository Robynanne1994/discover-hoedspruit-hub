## Refine drawer for Events & Specials

Replace the current small popover/inline filter panels with a slide-in **Refine** drawer triggered by the filter icon on both pages. Drawer slides in from the right (matching the reference screenshot — the underlying page peeks out on the left), with a dim backdrop.

### Drawer chrome (shared)
- Width: ~85% of viewport, full height, white background, rounded top-left corner.
- Top row: small bookmark/save icon on the left, **Clear** link on the right (orange-style accent using existing cream/ink palette — I'll use `COLOR.ink` underlined or a brown accent so it fits the brand, not literal orange).
- Section title **Refine** (bold, ~22px) under the top row.
- Each refine row: label on the left, chevron on the right, 1px divider between rows. Tapping a row expands it inline to reveal its options.
- Close on backdrop tap, Escape, or a swipe-style "Done" affordance at the bottom (sticky **Apply** button).
- **Clear** resets all selections in the drawer (does not close it).

### Events page — Refine sections
1. **Sort by** — dropdown row with: Soonest (default), Newest added.
2. **When** — the existing time filter (All, Today, This Week, This Month, Past). The pills currently shown under the divider on the page will be **removed** and live only inside the drawer (so the page header is cleaner). Active selection is reflected in the count line.
3. **Tag** — list of available tags (from `tag`, `sub_tag_1`, `sub_tag_2`), single select, with an "All" option. Replaces the current tag popover.

### Specials page — Refine sections
1. **Sort by** — Default, Ending Soon, Newest, Best Value (existing `SORT_LABELS`). Replaces the current "Sort by" dropdown in the header — that control is removed from the page.
2. **Category** — multi-select chips of categories derived from `category` + `eyebrow_categories` (existing `categoryOptions`). Replaces the current inline filter chip panel.

### Behavior
- Selections apply live (no separate Apply needed) but a sticky **Show N results** button at the bottom closes the drawer; count updates as filters change.
- Filter icon on the page shows the existing "active" state (ink background) when any non-default refine is set.
- Drawer uses CSS transform for slide-in, `prefers-reduced-motion` respected.

### Files to change
- `src/pages/Events.tsx` — remove inline tag popover + time-filter pills row; wire icon to open new drawer.
- `src/pages/Specials.tsx` — remove inline filter panel + sort dropdown header row; wire icon to open new drawer.
- `src/components/RefineDrawer.tsx` (new) — generic drawer shell with sections passed as children, plus `Clear` and `Show N results` props.

### Open question
The reference screenshot's drawer slides in from the **right** (covering most of the screen, page peeks on the left). Your message says "fly out from the left." I'll go with the screenshot (right-side drawer) since that matches the visual; let me know if you actually want it anchored to the left edge.
