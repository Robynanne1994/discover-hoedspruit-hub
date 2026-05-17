## Goal

Replace the current `/listing/:id` layout with a clean, mobile-first design matching the reference screenshot, using your tabs: **About · Details · Gallery · Location**. No bottom CTA.

## New page structure

```text
┌───────────────────────────────────────┐
│  ← Listing Detail        ♡   ⇪       │  sticky header (white bg)
├───────────────────────────────────────┤
│                                       │
│            HERO IMAGE  (4:3)          │
│                                       │
├───────────────────────────────────────┤
│  The Bush Café                        │  H1, Helvetica 400
│  Restaurant · Hoedspruit              │  category · location
│  ★ 4.7 (128)                          │  rating row
│                                       │
│  [ ☎ Call ] [ ⇲ Directions ] [ ⌬ Web ]│  pill action buttons
├───────────────────────────────────────┤
│  About   Details   Gallery   Location │  sticky tab bar w/ underline
├───────────────────────────────────────┤
│  (tab content)                        │
└───────────────────────────────────────┘
                  Bottom Nav (existing 74px)
```

## Tab contents (reuse existing data/sections)

- **About** — description paragraph, opening hours row ("Open · Closes 3pm"), address row with map-pin icon, contact rows (phone/email/website).
- **Details** — category-specific accordion content already on the page: cuisine, meals, vibe, seating, kids/family, accessibility, pricing, amenities, service, etc. Each shown as an icon + label + value row (no accordions — flat sections under small uppercase subheads).
- **Gallery** — existing gallery grid → opens `ImageLightbox`.
- **Location** — address line, "Get Directions" button (opens Google Maps), embedded static map placeholder (use existing `mapBg`/`mapGrid` styling already in the file).

## Header & action behaviour

- Back arrow: `navigate(-1)`.
- Heart: existing favourite toggle (`useFavourite` logic already in file).
- Share: existing `ShareButton` / Web Share API path.
- Call → `tel:`; Directions → existing `google_maps_link` or maps query; Website → opens in new tab. Buttons hidden individually if the listing has no value for that field.

## Styling (per project memory)

- Page background `#ebebeb`; sticky header & tab bar `#ffffff` with `1px` bottom border `#E8E4DF`.
- Title `#020202`, body `#2b2420`, muted `#8A8480`. Helvetica Neue 400 throughout. Headings uppercase with `letter-spacing: 0.01em`.
- Pill action buttons: white background, `1px` border `#E8E4DF`, `border-radius: 999px`, `padding: 10px 16px`, icon + label, primary brown `#715a3d` for icon & text.
- Tab bar: 4 equal-width tabs, active tab gets 2px underline in `#715a3d` and `#020202` label; inactive `#8A8480`. Tab bar becomes sticky under the header on scroll.
- 20px horizontal page padding, 16px card radii, 100px bottom padding above BottomNav.

## Implementation notes (technical)

- Single-file rewrite of `src/pages/ListingDetail.tsx`. Keep all existing queries (listing, gallery, specials, reviews, favourites) and helpers (SA holiday open/closed, `sanitizeDashes`, icon imports) — only the JSX render tree is restructured.
- Add `const [tab, setTab] = useState<'about'|'details'|'gallery'|'location'>('about')` and render one section at a time. No URL sync unless you want it later.
- Sticky bars: `position: sticky; top: 0` for header, `top: 56` for tab bar; both `zIndex: 30/20`. Hero scrolls under nothing — it sits below the header in normal flow.
- Keep `ImageLightbox` for the gallery tab.
- Specials tab is intentionally **not** included per your tab list; existing specials data stays available elsewhere (Specials page) and is removed from this view. Confirm in chat if you'd rather keep specials inline somewhere.
- Reviews are likewise not in your tab list — they'll be removed from this page. Same confirmation point.
- No backend or RLS changes.

## Out of scope

- Category page, admin pages, bottom navigation.
- New data fields — uses only what's already on `listings`.
