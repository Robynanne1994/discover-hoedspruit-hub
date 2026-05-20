# Unify the top search bar

Right now every page with a search field has rolled its own input. Heights, backgrounds, borders, icon weight and font size are all slightly different:

| Page | Height | Background | Border | Radius | Icon size / stroke | Icon colour |
|---|---|---|---|---|---|---|
| Search | 48 | #FFFFFF | none | 999 | 18 / 1.6 | INK |
| CategoryPage | 44 | #FFFFFF | none | 999 | 16 / 1.8 | INK |
| Events | 40 | transparent | 1px ink/12 | 999 | — (no icon) | — |
| Specials | 44 | cardBg | 1px pillBorder | 999 | — (no icon) | — |
| SavedListings | 52 | cream/92 | none | 999 | 18 / 1.6 | MUTED |
| Headlines | 52 | cream/92 | none | 999 | 18 / 1.6 | MUTED |
| VisitedPlaces | ~48 | ink/04 | 1px ink/08 | 16 | 18 / 2 | ink/30 |
| FAQs | 48 | card | none + shadow | 14 | 18 / 1.8 | MUTED |

## Goal

One canonical search bar, used everywhere. Same height, radius, padding, icon, font, placeholder treatment. Two background variants only — one for light page backgrounds, one for the olive/dark page backgrounds — but every other attribute is identical.

## Canonical spec

- Height: 48
- Radius: 999 (full pill)
- Horizontal padding: 20
- Gap between icon and input: 12
- Border: none
- Icon: lucide `Search`, size 18, strokeWidth 1.6
- Font: Helvetica Neue, weight 400, size 14, color `#2b2420`
- Placeholder: same font, color `#2b2420` at 60% opacity
- Variants (background + icon colour only):
  - `light` — background `#FFFFFF`, icon `#020202`. Used on ivory/grey page backgrounds (CategoryPage, Specials, Events, FAQs, VisitedPlaces).
  - `cream` — background `rgba(238,232,218,0.92)`, icon `#6B6A5E`. Used on olive/dark page backgrounds (Search, SavedListings, Headlines).

Press/focus behaviour stays the same as today (no outline). No shadow on either variant.

## Implementation

1. **New component** `src/components/ui/SearchBar.tsx`
   - Props: `value`, `onChange`, `placeholder`, `variant?: "light" | "cream"` (default `light`), `autoFocus?`, `inputRef?`, `onKeyDown?`, `ariaLabel?`.
   - Renders the pill + icon + input exactly per the canonical spec above.

2. **Replace existing inline search bars** with `<SearchBar />`, preserving each page's existing state, placeholder text and conditional `searchOpen` toggle:
   - `src/pages/Search.tsx` → variant `cream`
   - `src/pages/CategoryPage.tsx` → variant `light`
   - `src/pages/Events.tsx` → variant `light` (adds the missing search icon to match the rest)
   - `src/pages/Specials.tsx` → variant `light`
   - `src/pages/SavedListings.tsx` → variant `cream`
   - `src/pages/Headlines.tsx` → variant `cream`
   - `src/pages/VisitedPlaces.tsx` → variant `light` (pill replaces the current rounded-16 box)
   - `src/pages/FAQs.tsx` → variant `light` (pill replaces the current radius-14 box, drops the shadow)

3. Leave outer wrapper spacing (`paddingLeft/Right`, `marginBottom`) per page as-is so surrounding rhythm is unchanged.

## Out of scope

- Admin search inputs (`AdminUsers`, `AdminListings`, `AdminHomepage`, etc.) — those are admin-only desktop UI, not the mobile app top search bar.
- The homepage masthead search **button** (circular icon button in `HomeMasthead.tsx`) — that's a navigation affordance, not an input.
- `SearchDialog.tsx` — not currently mounted on the mobile flow.
- Filter/sort logic, results rendering, placeholder copy.
