# Plan: Functional Quick Filters on Explore page

## Current state
- The Explore page (`src/pages/Categories.tsx`) shows four Quick Filter pills: **Open Now**, **Saved**, **Kid Friendly**, **Pet Friendly**.
- These pills currently only toggle local `activeQuick` state and do **nothing** to the content below.
- The data needed for each filter already exists in the app:
  - `opening_hours` JSON field on `listings` (used by `isOpenNow()` in `CategoryPage.tsx`).
  - `child_friendly` and `good_for_kids` boolean fields for kid-friendly listings.
  - `pets_allowed` boolean field for pet-friendly listings.
  - `favourites` table with `item_type = 'listing'` for saved listings.

## Proposed behaviour
When a user taps a Quick Filter pill, the page switches from **category browsing** to a **filtered listing-results feed** showing every listing across all categories that matches the active filter(s).

### Filter mapping
| Pill | Filter rule |
|------|-------------|
| **Open Now** | `isOpenNow(listing.opening_hours) === true` |
| **Saved** | `listing.id` is in the current user's `favourites` where `item_type = 'listing'` |
| **Kid Friendly** | `listing.child_friendly === true` OR `listing.good_for_kids === true` |
| **Pet Friendly** | `listing.pets_allowed === true` |

### Interaction rules
1. **Toggle selection**: tapping a pill adds/removes that filter. Multiple active pills combine with **AND** logic.
2. **Results view**: when at least one pill is active, hide the category grid/list and show a vertical feed of matching listings.
3. **Header update**: the "All Categories" section title changes to the active filter label(s), e.g. "Open Now · Pet Friendly" or just "Saved".
4. **Result count**: show the number of matching listings under the header.
5. **Clear control**: show a small "Clear" text button when filters are active.
6. **Empty state**: if no listings match, show "Nothing here." with a one-line prompt to adjust filters.
7. **Auth gate**: tapping **Saved** while logged out triggers the existing `useRequireAuth` auth gate instead of showing results.
8. **Card design**: reuse the existing listing result card already shown for search results (image left, title, location, `ArrowUpRight`).
9. **Navigation**: tapping a result card navigates to `/listing/:id`.
10. **Loading state**: show skeleton cards while the filtered query runs.

## Technical implementation
1. Replace the dummy `activeQuick` state with four explicit boolean states (or keep the array but map each label to a real filter).
2. Add a new `useQuery` that fetches filtered listings from `supabase.from("listings").select("id, title, title_override, image_url, location, category_id, opening_hours, child_friendly, good_for_kids, pets_allowed")` and applies the active filters in JavaScript (or via `.eq`/`.in` where possible).
3. Fetch the current user's saved listing IDs with the existing favourites query pattern used in `CategoryPage.tsx`.
4. Import the shared `isOpenNow` helper from `CategoryPage.tsx` (or move it to a shared util).
5. Render the filtered results in the same white-card style already used for listing search results on this page.
6. Add a clear/reset button that empties all active quick filters and returns the view to categories.

## Out of scope for this plan
- Adding new database columns (existing fields are sufficient).
- Changing the pill visual style (already matches the screenshot provided).
- Filtering the category grid itself when no search/filter is active.

## Files to change
- `src/pages/Categories.tsx` — main page logic and UI.
- Optionally extract `isOpenNow` / `todayHours` into `src/lib/openHours.ts` if it is not already shared.

## Acceptance criteria
- Tapping each pill shows real listings that match the filter.
- Multiple pills can be active together and only listings matching all active filters are shown.
- Saved filter requires login; guests see the auth gate.
- Results use the existing listing card style and navigate to detail pages.
- Clear button returns the page to the normal category grid.