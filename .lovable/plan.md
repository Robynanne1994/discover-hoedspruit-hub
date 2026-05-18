## Category Listing Page Redesign

Redesign `src/pages/CategoryPage.tsx` to match the attached screenshot. All current logic (data fetching, subcategory filter, search, refine drawer, favourites, open-now calc) stays unchanged — only the presentation layer is rewritten.

### Page chrome

- Background: `#E6E0CC` (replace `C.olive` page background).
- Top bar:
  - Centered title block: bold title `Restaurants & Cafes` on top, small uppercase eyebrow `24 PLACES` underneath (uses existing `totalCount`).
  - Left: circular back button (white/ivory bg, dark arrow).
  - Right: circular search button (white/ivory bg, dark icon) that opens the existing search input (toggle an inline search field or reuse the SearchDialog).
- Remove the standalone search bar that currently sits below the header (replaced by the search-icon toggle). Keep the text-search state and filtering logic.

### Filter pills row

A horizontally scrollable row directly under the header:
- `⇄ FILTERS` pill — dark `#2A2A24` bg, ivory text, opens existing Refine drawer. Shows count badge when `activeFilterCount > 0`.
- `OPEN NOW` pill — white bg, dark text; toggles existing `filterOpenNow`.
- `TOP RATED` pill — white bg; toggles sort to `rating` (and back to `default`).
- Additional quick pills if useful: `SAVED` (toggles `filterSaved`).
- Active state for non-FILTERS pills: dark fill matching FILTERS.

The current "X listings" count line and divider are removed (count now lives in the eyebrow).

### Listing cards

White cards (`#FFFFFF`), 20–24px radius, ~16px vertical gap, no shadow (or a very soft one):

- Image area: full-width, ~200px tall, image fills with `object-cover`.
  - Top-left chip: rounded pill with ivory translucent bg, `☆ 4.8 (312)` — star icon + rating + reviews count in parentheses. Hide when no rating.
  - Top-right: heart button (existing `CardHeart`), restyled to match (white translucent circle, dark outline heart, rust fill when saved).
- Body padding ~20px:
  - Row 1: Bold title (left, large sans-serif, `#020202`) and right-aligned status badge:
    - `OPEN` — pill with green border + green text, transparent bg.
    - `CLOSED` — pill with red border + red text.
    - Hidden when no opening hours.
  - Row 2: Subtitle `Category • Subcategory` (e.g. `Restaurant • African`) — small muted text. Built from category title + first listing subcategory if available; falls back to existing `category_label`/`subtitle`.
  - Row 3: Location row with map-pin icon: `Location • X km` (distance only shown if we already have it — otherwise just location). Muted text.
  - Description paragraph removed to match screenshot.

### Empty / loading states

Keep existing logic; restyle text colour to dark ink (`#2A2A24` / muted) for the new light background, and the "Clear filters" button to dark pill.

### Technical notes

- File touched: `src/pages/CategoryPage.tsx` only (plus possibly a small subcategory lookup query if we want `Restaurant • African`-style subtitle; otherwise fall back to existing fields).
- Refine drawer styling, share/favourite hooks, routing, and data queries are untouched.
- Colors used as inline constants matching current pattern: `page #E6E0CC`, `card #FFFFFF`, `ink #020202`, `muted #6B6A5E`, `pillDark #2A2A24`, `open #2E7D4F`, `closed #C0392B`.
