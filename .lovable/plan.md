## Goal
Add a Home & Garden category-specific field layer with 4 new fields, following the existing trades/restaurants/accommodation pattern.

## Database (migration)
Add to `listings`:
- `services_offered text[]` (nullable, default `'{}'`)
- `plant_types text[]` (nullable, default `'{}'`)

Reuse existing columns: `business_started_year`, `years_in_business`, `specialities` (already on the table).

## Shared config (`src/lib/categoryFields.ts`)
- Add `HOME_GARDEN_ONLY_FIELDS = ["services_offered", "plant_types", "business_started_year", "years_in_business", "specialities"]`
- Add `HOME_GARDEN_CATEGORY_PATTERN = /home\s*(&|and)?\s*garden/i` and `isHomeGardenCategory()`
- Extend `getCSVHeadersForCategory` to append `HOME_GARDEN_ONLY_FIELDS` when the category matches.

## Admin editor (`AdminListings.tsx`)
- Add `services_offered`, `plant_types` to `emptyForm`, load mapping, and save payload.
- Define option lists:
  - `SERVICES_OFFERED_OPTIONS`: Nursery, Landscaping, Garden maintenance, Irrigation, Tree felling/pruning, Interior design, Upholstery, Equipment rental, Equipment servicing/repairs
  - `PLANT_TYPES_OPTIONS`: Indigenous, Water-wise, Exotic, Trees, Succulents, Veggies & Herbs, Pot plants
- Add an `isHomeGardenType` flag mirroring `isTradesType`.
- Render a new "Home & Garden details" section when `isHomeGardenType`:
  - Multi-select chips for `services_offered` (same pattern as cuisine/vibe).
  - Multi-select chips for `plant_types` — **only rendered when `form.services_offered.includes("Nursery")`**; if Nursery is removed, clear `plant_types` to `[]` on save.
  - Tenure radio (Year started / Years in business) and `specialities` textarea — reuse the existing trades JSX block.

## Listing detail (`ListingDetail.tsx`)
- Add `isListingHomeGarden` flag.
- When true, render new sections (existing icon-row renderer patterns):
  - **"Services"** — tick row per `services_offered` value (icon: `Wrench`).
  - **"Plant types"** — only if Nursery is in `services_offered` AND `plant_types.length > 0`; tick rows (icon: `Leaf`).
  - **Tenure row** — reuse the existing `Calendar` tenure row already used by trades.
  - **Specialities** — reuse the trades specialities block.

## Out of scope
- Filtering on the Home & Garden category page.
- Showing these fields on home/category cards.

## Steps
1. Migration: add 2 new columns (await approval).
2. Update `categoryFields.ts`.
3. Update `AdminListings.tsx` — form state, options, conditional UI, save logic.
4. Update `ListingDetail.tsx` — new sections gated by `isListingHomeGarden`.
5. Verify in preview on a Home & Garden listing.
