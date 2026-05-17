## Goal

Rebuild `src/pages/EventDetail.tsx` to match the new `ListingDetail` design system, with About / Details / Gallery / Location tabs and an "Add to Calendar" action.

## Design tokens (match listing page)

- Page bg `#ebebeb`, surface `#ffffff`, ivory `#f5f0e8`, border `#E8E4DF`, divider `#EDE9E3`
- Heading `#020202`, body `#2b2420`, muted `#8A8480`, primary `#715a3d`
- Helvetica Neue 400 everywhere, 20px page padding, 16px card radius, 100px bottom padding

## Layout

1. **Sticky header**: back arrow + "Event Details" label; right side Heart (save), Share, Pencil (admin) — same `iconBtn` style.
2. **Hero**: 4:3 image, full-bleed, ivory gradient fallback.
3. **Title block**:
   - Category eyebrow (event category or first tag) — uppercase, muted, 0.12em.
   - `<h1>` title in same size/weight as listing.
   - Date + time row with `Calendar` icon (muted).
   - Location row with `MapPin` icon below date.
4. **Action pills row** (`PillBtn` pattern, 2x2 grid if 4, scroll-row otherwise):
   - Book / Tickets (uses `booking_link` w/ optional `booking_link_label`)
   - Website / Social (uses `social_media_link` w/ `social_media_label`)
   - Directions (Google Maps link or geocoded location)
   - Add to Calendar — generates `.ics` blob on the fly, no external API. Uses event title, description, location, start/end datetime; download triggered by anchor + `Blob`/`URL.createObjectURL`. Includes Google Calendar URL fallback when ICS unsupported (mobile detection: if iOS use `.ics` link; otherwise open Google Calendar template link in new tab).
5. **Sticky tab strip** below title: ABOUT, DETAILS, GALLERY, LOCATION.

## Tab content

**About**
- "About" h2 + description with 3-line clamp + Read more/Show less (mirrors listing).
- If event has organiser notes / special notes, add a second section "Notes" using the same body styling.

**Details**
- Single white card with rows (icon, eyebrow label, value, optional ArrowUpRight):
  - Date (full date range using existing `formatEventDateRange`)
  - Time (start–end formatted)
  - Recurrence (if `recurrence` field populated — e.g. "Every Saturday")
  - Price / cost (if any free-text price field)
  - Phone (clickable `tel:`)
  - WhatsApp (clickable `wa.me`)
  - Email (clickable `mailto:`)
- Empty state: "No additional details yet."

**Gallery**
- 2-column 1:1 grid, opens `ImageLightbox` on tap (reuse component).
- Empty state: "No photos yet."

**Location**
- Same OpenStreetMap iframe block + MapPin row as listing page, plus a brown "Get Directions" pill CTA at bottom (existing pattern). Reuses the geocoding logic from ListingDetail: try `google_maps_link` regex parse first, then Nominatim fallback.

## Components reused

- `BackArrowIcon`, `BottomNav`, `ImageLightbox` (already imported in current EventDetail).
- Re-define `C`, `FONT`, `pressScale`, `iconBtn`, `headStyle`, `paraStyle`, `PillBtn`, `TabBtn` inline (matches Listing/Special pattern — self-contained pages).
- Keep existing data: `useQuery` for event, favourite query/mutation, admin `EventEditDialog` triggered via header pencil, share handler, `formatEventDateRange` helper.

## ICS generation (Add to Calendar)

Inline helper `buildIcs(event)` returns a string:
```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Hello Hoedspruit//Events//EN
BEGIN:VEVENT
UID:{event.id}@hellohoedspruit
DTSTAMP:{now}
DTSTART:{start utc}
DTEND:{end utc or start+1h}
SUMMARY:{title}
DESCRIPTION:{description, escaped}
LOCATION:{location}
END:VEVENT
END:VCALENDAR
```
Triggered by creating a `Blob`, `URL.createObjectURL`, and clicking a hidden `<a download>`. Skip the pill entirely if event has no parseable start date.

## Out of scope

- No event card list changes, no data model changes, no route changes.
- Drop the existing dark green/serif overlay buttons and PAGE_BG aesthetic — replaced by light token system.
- No real Google Calendar API integration (the connector is for the developer's own account, not end users).

## Files

- Rewrite `src/pages/EventDetail.tsx`.

## QA

- Event with full data, event without image, event without booking/social/maps, event with no end_time, gallery with 0 / 1 / many images, admin pencil visibility.
