# Search Page Redesign

Replace the search dialog with a dedicated `/search` route, styled in the Hello Hoedspruit brand system and laid out like the Strava reference.

## Layout (top to bottom)

1. **Header row** (20px horizontal padding)
   - Left: back arrow + "Home" label (matches existing back-button pattern)
   - Center: "Search" title (uppercase, Helvetica Neue, #020202)
2. **Top tabs — Users / Businesses**
   - Two-tab switcher (active tab: bold #020202 with #715a3d underline; inactive: muted)
   - Controls which sub-pills + result types are shown
3. **Search input** (full-width, 999 radius, #f5f0e8 ivory background, search icon left, placeholder changes per top tab)
4. **Sub-pills row** (3 icon+label pills, active pill underlined in #715a3d)
   - When **Users** tab active: `Suggested`, `Followers`, `Following`
   - When **Businesses** tab active: `Listings`, `Events`, `Specials`
5. **Default state (no query)** — Suggested list for the active sub-pill:
   - Users → suggested users (UserCard style)
   - Listings → featured/popular listings with a small Save (heart) button on the right
   - Events → upcoming events with Interested button
   - Specials → active specials with Save button
   - Section header above the list (e.g. "SUGGESTED LISTINGS") in uppercase
6. **Live results state (query present)** — same row style, filtered by sub-pill scope only

## Row styling

- 1px bottom divider between rows (#ebebeb)
- Avatar/thumbnail left (round 48px for users, 56×56 rounded-12 for listings/events/specials)
- Title #020202, secondary line #2b2420 muted
- Right action button in #715a3d outline pill ("Follow" / heart icon / interested)

## Routing changes

- Add `/search` route in `src/App.tsx` → new `src/pages/Search.tsx`
- `HomeMasthead` search icon: change from opening `SearchDialog` to `navigate('/search')`
- Keep `SearchDialog` file in place for now (can be removed later if unused elsewhere)

## Data sources (frontend only, reuse existing tables)

- Users: `profiles` (display_name, username, avatar_url) + existing `useFollows` hook for Follow button
- Listings: `listings` table, ordered by featured/popular fallback to recent
- Events: `events` table, upcoming first
- Specials: `specials` table, active ones
- All queries via React Query, `ilike` filtering on `title`/`display_name` when query present

## Files to create / edit

- **Create** `src/pages/Search.tsx`
- **Edit** `src/App.tsx` — register `/search`
- **Edit** `src/components/home/HomeMasthead.tsx` — search button → `Link to="/search"` instead of dialog
- (No DB / RLS / auth changes)

## Out of scope

- Recent searches persistence
- QR-code style discovery
- Any backend or schema changes
