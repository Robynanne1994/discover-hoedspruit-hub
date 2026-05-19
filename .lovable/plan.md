## Goal

Restyle `src/pages/ListingDetail.tsx` so the individual listing page matches the attached reference. No data‑model or routing changes — purely presentational.

## Changes

### 1. Hero + header
- Remove the sticky white "Listing Details" header bar entirely.
- Hero image bleeds to the very top of the page (keeps 4:3 ratio and `detail_image_url || image_url` source).
- Float four circular white icon buttons over the hero:
  - **Top‑left**: back arrow.
  - **Top‑right**: heart (save), share, and (admin only) edit pencil — grouped with small gaps.
- Each circular button: 40×40, `background: #FFFFFF`, subtle shadow, icon in `C.heading`. Heart fills with `C.primary` when favourited.
- Buttons sit on a safe‑area‑aware inset (`top: calc(env(safe-area-inset-top) + 16px)`, `left/right: 16px`).

### 2. Title block (white panel under hero)
- Keep the eyebrow category line as is (uppercase, tracked, muted).
- Make the **title bold and bigger**: `fontWeight: 700`, `fontSize: 28`, `lineHeight: 1.15`, `color: C.heading`.
- Keep location row (pin icon + text) and star rating row exactly as now.
- Action pills: keep outlined white style, bump to `padding: 14px 18px`, `fontSize: 14`, icon size 16. Continue rendering a 2×2 grid when 4 actions, horizontal scroll otherwise.

### 3. Tab bar
- Remove the `top: 57` offset (no sticky header anymore) so tabs sit naturally below the title block (still `position: sticky; top: 0`).
- Active tab: `color: C.heading`, **bold (700)**, underline color `C.heading` (was `C.primary`).
- Inactive tabs: `color: C.muted`, weight 400.
- Keep uppercase + tracking.

### 4. Tab content background
- Wrap the `<main>` so tab content sits on the page's `C.bg` (`#E6E0CC`) cream — matches the reference's ivory feel under the white title block.

### 5. Section headings ("About", "Hours", "Contact", etc.)
- Replace the existing small tracked uppercase `headStyle` with a **bold Title Case heading**:
  - `fontSize: 22`, `fontWeight: 700`, `letterSpacing: 0`, `textTransform: none`, `color: C.heading`, `margin: 0 0 12px`.
- Applies to About/Hours/Contact and the other tab section heads (Details, Specials, Events, Gallery, Location) for consistency.

### 6. Hours card
- Keep the white rounded card with hairline dividers.
- **Today's row bold**: when `isToday`, render both the day label and the time in `fontWeight: 700`, `color: C.heading` (currently regular weight). Other rows unchanged.
- Keep the green/red dot + "Open now · Closes 16:00" status line above the card.

### 7. Contact rows
- Inside the white card, simplify each row to: left icon (brown, 20px) + value text (no uppercase "PHONE/EMAIL/WHATSAPP/WEBSITE" mini‑label above) + `ArrowUpRight` on the right (muted).
- Value text: `fontSize: 15`, `color: C.heading`, `fontWeight: 400`.
- Keep hairline dividers between rows and the existing `href` behaviour (tel:, mailto:, wa.me, website).

### 8. "Suggest an edit to this listing." footer
- Unchanged.

## Out of scope

- No changes to Details / Specials / Events / Gallery / Location tab internals beyond the new section heading style.
- No DB schema changes.
- No changes to `CategoryPage`, admin, or other pages.

## Technical notes

- All edits live in `src/pages/ListingDetail.tsx`.
- `headStyle` constant is reused across tab renderers — updating it once cascades the new heading look everywhere.
- Floating buttons need `position: absolute` inside a `position: relative` hero wrapper, with `zIndex: 2` so they sit above the image.
- Removing the sticky header means the tab bar's existing `top: 57` must drop to `top: 0`.
- No new dependencies.
