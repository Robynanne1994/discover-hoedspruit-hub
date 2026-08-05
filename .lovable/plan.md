# Refine The Detail Page Header And Tabs

Bring the top section (under the hero image, above the tab content) and the tab bar on Listing, Event and Special detail pages in line with the reference screenshot. Visual and layout only — no data, query or business logic changes.

## What changes in the top section

1. Category eyebrow moves above the title
   - Small uppercase label ("RESTAURANTS & CAFÉS") sitting above the headline instead of the dot-separated brown line underneath it.
   - 10.5px, uppercase, 0.18em letter-spacing, brand brown #715A3D. Multiple categories stay dot-separated on one line.
2. Title
   - Slightly larger and tighter: 30px Bricolage/Nohemi heading weight 500, line-height 1.12, letter-spacing -0.3px (replaces the current +0.01em).
3. Open / closed status row
   - Same dot plus label, spacing tightened to sit directly under the title block.
   - Status label 14px, trailing detail ("· Closes 21:00") in quiet ink #2B2420 at 13.5px.
4. Rating and distance row
   - The rating loses its white pill: plain star, bold value, review count in muted grey, chevron only when a reviews link exists.
   - Distance keeps the pin icon, sits on the same row with a wider gap, both at 14px.
5. Header sheet tone
   - The title sheet and tab bar share the cream surface (#F5F0E8) with the tab content on the page canvas (#E6E0CC), so the header reads as one panel with the tabs attached, as in the screenshot.
6. Hero overlay controls
   - Share / save / edit group into one white rounded capsule instead of separate floating circles; back button stays its own circle.
   - Where a gallery exists, a small "1 / 12" counter pill appears bottom-right of the hero and opens the gallery.

## Tabs

- Tabs spread evenly across the width, 16px labels, active tab bold #1A1A1A with a 2px underline, inactive muted #6B6A5E.
- Underline sits on the sheet's bottom hairline so the active tab reads as connected to the content below.
- Scroll behaviour for 5+ tabs is unchanged.

## Applies to

- `src/pages/ListingDetail.tsx`
- `src/pages/EventDetail.tsx` (eyebrow uses the existing event tag; rating row omitted where absent)
- `src/pages/SpecialDetail.tsx` (eyebrow uses the linked business / deal label)

## Technical notes

- All three pages already use local `C` colour maps, a `floatBtn` style and a local `TabBtn`. The edits stay inside those, reusing existing tokens only — no new colours, fonts or radii.
- Existing tab keys, visibility conditions and content renderers are untouched, so which tabs appear and what they show does not change.

## Fix first: existing build error

`src/pages/admin/AdminEvents.tsx` (lines 274, 279, 284) reads `hosted_by_listing_id`, `_2` and `_3` directly off the typed event row, but those columns are not in the generated database types (the table only has `hosted_by_link`). This currently fails the typecheck. Fix by reading them through the same `(ev as any)` cast used by the neighbouring host fields.
