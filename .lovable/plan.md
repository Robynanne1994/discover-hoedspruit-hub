## Goal
Add an optional "custom title" override for individual listings, events, and specials so titles that should display in non-title-case (e.g. ALL CAPS acronyms) render exactly as typed — everywhere that item's title shows (cards + detail pages). Default behaviour (auto title-case) stays in place for everything else.

## How it will work for you
In each backend editor (Listings, Events, Specials) you'll see, just below the Title field:

- A checkbox: **"Use custom title (overrides auto-capitalisation)"**
- When ticked, a second text input appears: **"Custom title"**
- Whatever you type there is rendered verbatim — wherever that item's title shows — bypassing the auto-title-case logic.
- Unticked = current behaviour (auto title-cased from the normal Title field). Search, sorting, and the underlying `title` field are unchanged.

## Technical plan

### 1. Database
Single migration adding one nullable column to each table:
- `listings.title_override text`
- `events.title_override text`
- `specials.title_override text`

Null/empty = use the normal title. Non-empty = render this string exactly.

### 2. Bypassing the global title-case transformer
`src/components/TitleCaseH1.tsx` and `TitleCaseH2.tsx` walk the DOM and re-case any `<h1>`/`<h2>` whose `children.length === 0` (leaf text nodes only). Two small reinforcements:

- Update both transformers to also skip any element with `data-no-title-case` (defense-in-depth, in case a heading has nested content).
- At every title render site, when an override exists, render the heading as:
  ```tsx
  <h1 data-no-title-case><span>{titleOverride}</span></h1>
  ```
  The inner `<span>` already makes `children.length > 0`, which the existing transformer skips; the data attribute is belt-and-braces.

### 3. Render sites to update
A small helper `useDisplayTitle(item)` returning `{ text, isOverride }` will be used at each site so the pattern is consistent.

Listings:
- `src/pages/ListingDetail.tsx` (detail H1)
- `src/components/home/HomeListings.tsx`, `HomeListingCarousel.tsx`, `VenueCard.tsx`, `FeaturedCarousel.tsx`, `EatSection.tsx`, `DoSection.tsx`, `StaySection.tsx`, `ShopSection.tsx` (any card that prints `listing.title`)
- `src/pages/CategoryPage.tsx`, `src/pages/Search.tsx`, `SavedListings.tsx`, `VisitedPlaces.tsx`, `Directories.tsx` (list/grid cards)

Events:
- `src/pages/EventDetail.tsx` (detail H1)
- `src/components/events/EventCard.tsx`, `src/components/home/HomeWhatsOn.tsx`, `WhatsOnToday.tsx`, `src/pages/Events.tsx`, `EventsCalendar.tsx`

Specials:
- `src/pages/SpecialDetail.tsx`
- `src/components/home/HomeSpecials.tsx`, `SpecialsSection.tsx`, `src/pages/Specials.tsx`

(Exact list will be confirmed by `rg` during implementation; the helper makes each change a one-line swap.)

### 4. Backend editor changes
- `src/pages/admin/AdminListings.tsx` — add checkbox + conditional input near the Title field in the edit form.
- `src/components/admin/EventEditDialog.tsx` and `src/pages/admin/AdminEvents.tsx` (create form) — same UI.
- `src/components/admin/SpecialEditDialog.tsx` and `src/pages/admin/AdminSpecials.tsx` (create form) — same UI; add `title_override` to the `FIELDS` array so it persists.

Checkbox state derives from `!!form.title_override` so existing rows just work. Untoggling clears the field on save.

### 5. Out of scope
- Bulk-import CSVs are untouched (column simply absent → no override).
- Business-owner self-service forms (`BusinessSpecialForm`, `BusinessEventForm`) — admin-only for now, as you described this as a backend editor need. Happy to extend to those forms if you want.

## Files touched (summary)
- 1 migration
- 2 small edits to `TitleCaseH1.tsx` / `TitleCaseH2.tsx`
- 1 new helper `src/lib/displayTitle.ts`
- ~15 render sites (one-line swap each)
- 5 admin editor files
