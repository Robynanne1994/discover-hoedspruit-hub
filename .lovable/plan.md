## Goal

Make `EventDetail.tsx` and `SpecialDetail.tsx` look like `ListingDetail.tsx`. Scope is **visual styling only** — no new sections, no removed data, no behavioural changes. Each page keeps its own tabs (Event: About / Details / Gallery / Location; Special: About / Details / Contact / Terms).

## Differences to fix

Comparing the three files, five concrete styling deltas need to flow from Listing → Event + Special:

1. **Hero chrome**
   - Listing: no sticky top bar. The Back / Heart / Share / Edit buttons float as white 40px circles directly over the hero image (top-left for Back, top-right for the rest), with a `boxShadow: 0 2px 8px rgba(0,0,0,0.18)` and respect for `env(safe-area-inset-top)`.
   - Event/Special today: opaque white sticky `<header>` strip above the hero with a "Event Details" / "Special Details" text label next to the arrow.
   - Change: remove the sticky text header on Event + Special. Move Back / Heart / Share / Edit into floating circular buttons over the hero, matching Listing exactly (same `floatBtn` style, same positions, same safe-area handling). Remove the now-unused "Event Details" / "Special Details" string.

2. **Section headings (`headStyle`)**
   - Listing: `fontWeight: 700, fontSize: 22, textTransform: "none", letterSpacing: 0` — bold proper-case "About", "Hours", etc.
   - Event/Special today: `fontWeight: 400, fontSize: 12, uppercase, letterSpacing: 0.08em` — tiny eyebrow style.
   - Change: update `headStyle` constant in both files to the Listing values so every `<h2>` (About, The Offer, Promo Code, Location, Terms & Conditions) renders as a bold proper-case heading.

3. **Page title block**
   - Listing: `fontWeight: 700, fontSize: 28, lineHeight: 1.15`.
   - Event/Special today: `fontWeight: 400, fontSize: 24, lineHeight: 1.2`.
   - Change: bump both title `<h1>` styles to match Listing's weight/size/line-height.

4. **Action pills (`PillBtn`)**
   - Listing: `padding: 14px 18px`, `fontSize: 14`, `gap: 8`, icon size 16, label + icon colored `C.heading` (black), letter-spacing `0.01em`.
   - Event/Special today: `padding: 10px 14px`, `fontSize: 13`, `gap: 6`, icon size 14, label + icon colored `C.primary` (brown).
   - Change: update `PillBtn` in both files to the Listing dimensions and colors. Keep the existing `pressScale`, `flexShrink`, `width: full` logic. The "Add to Calendar" button on Event keeps its `onClick` branch; only the styling moves.

5. **Sticky tab bar**
   - Listing: active tab uses `fontWeight: 700`, `borderBottom: 2px solid C.heading`.
   - Event/Special today: active tab uses `fontWeight: 400`, `borderBottom: 2px solid C.primary`.
   - Change: `TabBtn` in both files matches Listing — bold weight + heading-colored underline when active. The `top: 57` offset for Event/Special's tab bar (which exists because of the now-removed sticky header) drops back to `top: 0`, matching Listing.

## Out of scope (user picked "Visual styling only")

- No changes to tab keys, tab content order, or which sections are shown.
- No new "related events" / "related specials" / "related listings" carousels on either page.
- Special detail page has no gallery data today and stays without a gallery tab.
- Event keeps its own `EventEditDialog`; Special keeps its `SpecialEditDialog`. The floating Edit pencil over the hero still opens those dialogs (Listing routes to `/admin/listings` instead — we match the visual treatment, not the destination).
- No edits to `ListingDetail.tsx` itself.

## Files touched

- `src/pages/EventDetail.tsx` — replace header chrome, update `headStyle`, `<h1>` style, `PillBtn`, `TabBtn`.
- `src/pages/SpecialDetail.tsx` — same five edits.

Roughly ~60 lines changed per file, no new dependencies.
