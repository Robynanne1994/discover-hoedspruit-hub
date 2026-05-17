## Goal

Rebuild `src/pages/SpecialDetail.tsx` to match the new `ListingDetail` design language while preserving all special-only data (price/offer band, validity status, promo code, terms, booking link).

## Design tokens (match listing page)

- Page bg `#ebebeb`, card surface `#ffffff`, ivory `#f5f0e8`, border `#E8E4DF`, divider `#EDE9E3`
- Heading `#020202`, body `#2b2420`, muted `#8A8480`, primary `#715a3d`
- Helvetica Neue weight 400 everywhere. Uppercase section headers, letter-spacing 0.08em
- 20px page padding, 16px card radius, 100px bottom padding

## Layout

1. **Sticky header** (white, 1px bottom border): back arrow + "Special Details" label, right side icons = Heart (save), Share, Pencil (admin only) — same `iconBtn` styling as listing.
2. **Hero**: 4:3 image, full-bleed, no overlay buttons (header handles them). Falls back to ivory gradient if no `image_url`.
3. **Title block** (20px padding):
   - Category eyebrow (uppercase, muted, 0.12em tracking) using `eyebrow_categories[0]` or `deal_label`
   - `<h1>` title — same size/weight as listing detail
   - Business name row below title (links to `/listing/{business_id}` if present), with Store icon and muted styling — mirrors listing's location row
   - Validity status pill row: small colored dot (gold/rust/muted) + label + italic date range — restyled into the new palette (no more dark green chip). Keep the existing live/expired/ending-soon logic.
4. **Action pills row** (same `PillBtn` component pattern as listing): Call, WhatsApp, Booking, Visit Business (link to parent listing). 2x2 grid if 4 actions, single row otherwise — same rule as listing.
5. **Tabs strip** (same `TabBtn` component): `ABOUT`, `DETAILS`, `CONTACT`, `TERMS`.

## Tab content

**About**
- About heading + description with 3-line clamp + "Read more / Show less" button (same pattern as listing).
- Offer band (price / offer / duration headline + sublabel) — restyled into a white card with `1px solid border` and divider columns instead of the cream block. Skip if all three cols empty.
- Promo code card if present: dashed-border white card, monospace-feel uppercase code + Copy button (existing copy-to-clipboard behavior).
- SuggestEditFooter at bottom.

**Details**
- Single white card with rows for: Business (link with ArrowUpRight), Price (with original strikethrough if set), Days, Valid from/until — using the same row pattern as listing's Contact card.
- Empty state: "No additional details yet."

**Contact**
- White rounded card mirroring listing's contact rows: Phone, WhatsApp, Booking link — each row has icon, label eyebrow, value, ArrowUpRight.
- Hidden entirely if none present.

**Terms**
- White card with section heading "Terms & Conditions" and the `special.terms` text in body styling. Empty state: "No terms provided."

## Components & behaviors to reuse / copy from ListingDetail

- `C` token object, `FONT`, `pressScale`, `iconBtn`, `headStyle`, `paraStyle`, `PillBtn`, `TabBtn`, `SuggestEditFooter` patterns (re-defined inline in SpecialDetail to keep pages self-contained, matching how ListingDetail does it).
- Keep `SpecialEditDialog` integration for admins (triggered via header pencil).
- Keep all existing data queries, favourite mutation, share handler, formatPrice helper, validity computation untouched — only the rendering layer changes.

## Out of scope

- No tab for promo code (it lives inside About since it's part of the deal context).
- No gallery/location tabs (specials don't have those fields).
- No data model changes, no route changes, no changes to Specials list page or cards.

## Files

- Rewrite `src/pages/SpecialDetail.tsx` (single-file change).

## QA after build

- Test special with full data, special with no image, expired special, special without promo code, and as admin (pencil visible) vs anonymous user.
