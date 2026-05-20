## Goal
Add a `years_in_business` alternative to `business_started_year`, with a radio toggle in admin to populate only one, and matching icons on the listing detail page.

## Database
Migration: add `years_in_business integer nullable` to `listings`.

## Admin editor (`AdminListings.tsx`)
Replace the single "Year Business Started" input in the Trades & Services section with:
- A radio group: ( ) Year business started · ( ) Years in business
- Default selection inferred from existing data (if `business_started_year` is set → "Year started"; else if `years_in_business` is set → "Years in business"; else "Year started").
- When "Year started" is active: show number input → writes `business_started_year`, clears `years_in_business` on save.
- When "Years in business" is active: show number input → writes `years_in_business`, clears `business_started_year` on save.
- Helper text under each: "Displayed as 'Since YYYY'" / "Displayed as 'X years in business'".
- Add `years_in_business` to `emptyForm`, the load mapping, the save payload, and `TRADES_ONLY_FIELDS` in `categoryFields.ts`.

## Listing detail (`ListingDetail.tsx`)
In the trades section that currently emits "Since YYYY":
- Keep `Since YYYY` when `business_started_year` is set.
- Else if `years_in_business` is set, emit `${n} years in business`.
- Render this single row with its own dedicated icon to the left (instead of grouping under the generic Service info `Info` icon). Use `Calendar` from lucide-react (calendar matches "since YYYY" and tenure). Keep `After hours available` and `Callout fee` in their existing two-column Service info block.

Implementation: split sections so the tenure row becomes its own section `{ key: "trades-tenure", title: "In business", iconComp: Calendar, fields: [{ label, on: true }] }` — uses the existing tick-icon row renderer.

## Out of scope
- CSV import column for the new field (admin can edit inline after import); will be auto-included via `TRADES_ONLY_FIELDS`.
- Showing tenure on landing-page cards.

## Steps
1. Migration: add `years_in_business` column (await approval).
2. Update `categoryFields.ts` to include the new field.
3. Update `AdminListings.tsx`: radio toggle + conditional inputs + save logic.
4. Update `ListingDetail.tsx`: new tenure section with Calendar icon, supporting both fields.
5. Spot-check in preview on a trades listing.
