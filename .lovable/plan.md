# Conditional tabs on Listing Detail page

Make the tab strip on `src/pages/ListingDetail.tsx` dynamic so it only shows tabs that have content.

## Tabs to show (in order)
1. **About** — always
2. **Details** — always
3. **Specials** — only if this listing has ≥1 active special
4. **Events** — only if this listing has ≥1 upcoming event
5. **Gallery** — only if `galleryImages.length > 0`
6. **Location** — always

## Data fetching

Add two lightweight queries alongside the existing listing query, both enabled only after `listing.id` is known:

- **Specials**: `supabase.from("specials").select("id,title,deal_label,image_url,valid_until,offer_headline,price,original_price").eq("business_id", listing.id).eq("is_active", true)` then filter client-side to keep rows where `valid_until` is null or `>= today` (YYYY-MM-DD compare).
- **Events**: `supabase.from("events").select("id,title,date,start_date,end_date,start_time,image_url,location").eq("business_id", listing.id)` then filter to upcoming: keep where `end_date >= today` OR (`end_date` is null AND `start_date >= today`) OR (both null — keep, since `date` is free-text).

Derive booleans `hasSpecials` and `hasEvents` from query results. Derive `hasGallery` from existing `galleryImages.length > 0`.

## Tab rendering

- Extend `TabKey` to `"about" | "details" | "specials" | "events" | "gallery" | "location"`.
- Build a `visibleTabs` array of `{key,label}` filtered by the booleans above.
- Render the tab strip by mapping `visibleTabs` (keeps existing `TabBtn` styling, sticky bar, horizontal layout — add `overflowX:"auto"` with `scrollbar-hide` since up to 6 tabs may not fit on narrow screens).
- After queries resolve, if current `tab` is no longer in `visibleTabs` (e.g. previously on Gallery, now hidden), reset to `"about"` via a `useEffect` watching `visibleTabs`.

## Tab content

- `renderSpecials()` — list of card rows linking to `/specials/:id`. Each row: 64×64 rounded thumbnail (image_url with ivory fallback), title, deal_label as a small pill in `C.primary`. Wrapper: white card, `borderRadius:16`, `border:1px solid C.border`, 20px page padding, 12px gap between rows.
- `renderEvents()` — same card pattern linking to `/events/:id`. Show title + formatted date (reuse the same date-display logic style as event cards: prefer `start_date` formatted, fallback to `date` text). Optional location line in `C.muted`.
- Keep both renderers simple — just navigation entry points, not full detail.

## Out of scope

- No schema changes, no admin/editor changes, no Specials/Events page changes.
- No changes to EventDetail or SpecialDetail.
- Action pills row stays as-is.

## Files

- `src/pages/ListingDetail.tsx` — add two queries, derive visibleTabs, conditionally render tabs and add two new content renderers.
