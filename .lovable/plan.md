## Goal
Support multiple email / phone / WhatsApp contacts per listing, event, and special, with a clean "Add another" UX in the backend editors and an aesthetic stacked render on the detail pages.

## Data model
Add three nullable `text[]` columns to each of `listings`, `events`, and `specials`:
- `additional_emails text[] default '{}'`
- `additional_phones text[] default '{}'`
- `additional_whatsapps text[] default '{}'`

The existing single fields stay as the **primary** contact (listings: `email`, `phone`, `whatsapp`; events/specials: `contact_email`, `contact_phone`, `contact_whatsapp`). No data migration needed — empty arrays by default.

Rationale: keeps existing CSV import, action buttons, and "primary contact" logic untouched. Extras are purely additive.

## Backend editors
Files: `src/pages/admin/AdminListings.tsx`, `src/pages/admin/AdminEvents.tsx`, `src/components/admin/EventEditDialog.tsx`, `src/pages/admin/AdminSpecials.tsx`, `src/components/admin/SpecialEditDialog.tsx`.

For each of the three contact fields:
- Render the existing single input as today (primary).
- Underneath, render a small list of extra inputs (one per array entry) each with a trash icon to remove.
- A `+ Add email` / `+ Add phone` / `+ Add WhatsApp` button appends a new empty entry.
- On save, trim and drop empty strings before writing the array.

Reusable component: `src/components/admin/MultiContactField.tsx` taking `{ label, icon, primary, onPrimaryChange, extras, onExtrasChange, placeholder, type }` so the same UI is shared across all three editors.

## Frontend rendering
Files: `src/pages/ListingDetail.tsx`, `src/pages/EventDetail.tsx`, `src/pages/SpecialDetail.tsx`.

- **Action buttons row (Call / WhatsApp / Email)**: keep using the **primary** value only — avoids cluttering the top CTAs.
- **Contact details panel** (the labelled rows lower down): expand to list every value. Each entry gets its own row with the same `Icon + Label + value` styling already in place. Labels are pluralised contextually (first row "Phone", subsequent "Phone 2", "Phone 3" — or simply repeat the icon with no label suffix; will pick the cleaner look during build).
- Helper added to each detail page (or shared in `src/lib/contacts.ts`): `collectContacts(primary, extras)` → returns a deduped, trimmed array.

## Out of scope
- Bulk CSV import columns for the extras (admin can add them inline after import).
- Business-owner self-service edit forms.
- The "edit suggestion" form on listing detail.

## Steps
1. Migration: add three array columns to each of the 3 tables (await approval).
2. Build `MultiContactField` component.
3. Wire it into all 5 admin editor files for email / phone / WhatsApp.
4. Add `collectContacts` helper and update the contact-details panel in `ListingDetail`, `EventDetail`, `SpecialDetail`.
5. Verify build, then spot-check a listing in preview.