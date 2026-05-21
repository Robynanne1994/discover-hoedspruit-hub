# Specials Editor Overhaul

## 1. Categories (replace eyebrow + single category)

- Remove the **Eyebrow Categories** (3-input grid) section from `SpecialEditDialog`.
- Replace the single **Category** text input with a **multi-select pill picker**:
  - Query all distinct values currently used across `specials.category` + `specials.eyebrow_categories` (via a `useQuery` on the full specials list, deduped client-side) to build the pill list.
  - Selected categories render as filled brown pills; unselected as outlined pills. Tap to toggle.
  - Below the pills: an inline **"+ Add new"** input + button. Typing a new name and clicking Add (or Enter) adds it to both the current selection and the available pill list immediately (local state merge), so future specials see it too once saved.
- Storage: write the full selected array to `eyebrow_categories` and set `category` to the first selected value (keeps existing listing/detail rendering working without code changes on the public side).

## 2. Highlight Sections → simplified Price block + dual images

**Remove** the entire "Highlight Sections" card (Price/Price Sublabel, Offer Headline/Sublabel, Duration Headline/Sublabel, Original Price).

**Replace** with a clean 3-field block:
- **Price** → `price`
- **Price notes** (free text, e.g. "per person", "weekends only") → reuses existing `price_label` column
- **Original price** (optional, strikethrough) → `original_price`

Offer/duration columns (`offer_headline`, `offer_sublabel`, `duration_headline`, `duration_sublabel`) stay in the DB but are no longer editable here. The public `SpecialDetail` page already only renders them when present, so dropping them from the editor is safe.

**Images** — replace the single `image_url` field with two `ImageUpload` components (matching `EventEditDialog` pattern):
- **Card Cover Image** → `image_url`, `aspect={3/4}` (matches listing-card 3:4 ratio used on the Specials page)
- **Detail Cover Image** → new column `detail_image_url`, `aspect={4/3}` (matches the special detail hero)
- `ImageUpload` already supplies the crop dialog + eyedrop/reposition tool, and `aspect` locks the default crop frame to the target display size.
- On the public side, `SpecialDetail` switches to `detail_image_url || image_url`; the Specials listing page keeps using `image_url`.

## 3. "Always active" toggle next to validity dates

- Add a checkbox **"Always active — no end date"** beside the Valid From / Valid Until inputs.
- When ticked: both date inputs are disabled and cleared, and on save `valid_from`/`valid_until` are written as `null`. The existing `is_active` auto-calc already treats null `valid_until` as active, so the special stays live indefinitely.
- The card footer's auto "Valid until…" text already falls back gracefully when no dates are set (and can be overridden by `card_footer_text`).

## Database migration

Single migration adding one column:
```sql
ALTER TABLE public.specials ADD COLUMN detail_image_url text;
```
No data backfill needed — public pages fall back to `image_url` when `detail_image_url` is null.

## Files touched

- `supabase/migrations/<new>.sql` — add `detail_image_url`
- `src/components/admin/SpecialEditDialog.tsx` — all UI changes above
- `src/pages/SpecialDetail.tsx` — use `detail_image_url || image_url` for the hero image

## Out of scope

- The business-facing `BusinessSpecialForm.tsx` editor is not touched (user asked about the admin backend editor only).
- Public Specials listing card layout is unchanged.
