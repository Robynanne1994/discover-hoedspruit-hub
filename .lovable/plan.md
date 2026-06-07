## Goal

Add two new accommodation-only fields:
- **Average price per person per night** (text, e.g. "R 1 250")
- **Number of rooms** (integer)

Editable in the admin listing editor and included as the last two CSV columns for accommodation imports/exports.

## Changes

### 1. Database (`listings` table)
New migration adding two nullable columns:
- `avg_price_per_person_per_night text`
- `rooms_count integer`

(Text for the price so admins can format with currency/spaces like other price fields; integer for rooms.)

### 2. Field schema — `src/lib/categoryFields.ts`
- Add both fields to `LISTING_FIELD_SPECS` (`avg_price_per_person_per_night: str`, `rooms_count: int`).
- Append both to `ACCOMMODATION_ONLY_FIELDS` at the end so they become the **last two CSV columns** for accommodation imports/exports (the CSV header builder uses array order).

### 3. Admin editor — `src/pages/admin/AdminListings.tsx`
- Add both fields to `emptyForm` defaults.
- Hydrate them in the load-from-listing block (~line 629).
- Include them in the accommodation submit payload (~line 413).
- Add two inputs inside the Accommodation Fields section (~line 1381), placed near the existing `sleeps` / `km_from_town` inputs:
  - "Average price per person per night" — text input
  - "Number of rooms" — number input

### 4. CSV import/export — `src/pages/admin/AdminImport.tsx`
No structural changes needed. The schema-driven serializer/parser already uses `LISTING_FIELD_SPECS` and `ACCOMMODATION_ONLY_FIELDS`, so both new fields will appear automatically as the last two columns on accommodation exports and be parsed on import.

## Files touched
- New migration (add 2 columns to `listings`)
- `src/lib/categoryFields.ts`
- `src/pages/admin/AdminListings.tsx`

## Verification
- Export accommodation CSV → last two headers are `avg_price_per_person_per_night`, `rooms_count`.
- Edit a listing in admin → both inputs render under Accommodation Fields, save persists.
- Import a modified CSV → values round-trip correctly; empty cells leave existing values untouched (per existing import rules).
