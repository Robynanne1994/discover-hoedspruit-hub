## Changes to Restaurants & Cafes editor + detail page

### 1. Drinks card — re-add Coffee
- Restore `has_coffee` to the Drinks toggles (admin editor + listing detail), alongside Iced Coffee, Milkshakes, Mocktails, Beers/Ciders, etc.
- The DB column `has_coffee` still exists, so no migration needed.

### 2. Split Cuisine into two cards: Cuisine + Foods
- **Cuisine** (regional styles only): Italian, Indian, Mexican, Asian, Local, Vegan, Vegetarian, Healthy Eats.
- **Foods** (actual dishes): Burgers, Pizzas, Seafood, Sushi, Grill, Ribs, Steaks, Tapas, Pasta, Baked Goods, Desserts, Fast Food.
- New DB column `foods text[]` on `listings`.
- Admin editor: new "Foods" multi-select card right after Cuisine, with the same free-add behaviour (you can type your own values, same as Cuisine works today).
- Listing detail: render Foods as its own section/row beneath Cuisine using the same chip styling.
- Existing data: a one-time backfill will move any items in `cuisine` that match the Foods list above into the new `foods` column so nothing is lost.

### 3. New "Business Type" card with Franchise toggle
- New DB column `is_franchise boolean` on `listings`.
- Admin editor: new "Business Type" card (shown for Restaurants & Cafes) containing a tri-state Franchise toggle (Yes / No / Not set).
- Listing detail: when set to Yes, show a small "Franchise" chip in the listing's attributes row.
- Card is structured so we can add Independent / Chain / Group later without another migration.

### Technical notes
- Migration adds `foods text[] default '{}'` and `is_franchise boolean` to `listings`, plus the backfill UPDATE for known food items.
- Files touched: `supabase/migrations/*` (new), `src/pages/admin/AdminListings.tsx` (split CUISINE_OPTIONS into CUISINE_OPTIONS + FOODS_OPTIONS, add Foods MultiSelect card, add Business Type card with Franchise toggle, re-add `has_coffee` toggle, include `foods` and `is_franchise` in emptyForm/save/openEdit), `src/pages/ListingDetail.tsx` (re-add Coffee in drinks, add Foods section, add Franchise chip), `src/lib/categoryFields.ts` if needed for category-aware visibility.
- `src/integrations/supabase/types.ts` regenerates automatically.