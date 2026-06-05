## Problem

When importing a category-scoped CSV (e.g. "Shopping"), data for listings that also belong to other categories (e.g. "Home & Garden") gets wiped. Two real causes inside `src/pages/admin/AdminImport.tsx`:

1. **Category links are reset for every imported listing.** Inside the per-listing sync loop (~line 449), the code does `DELETE FROM listing_categories WHERE listing_id = X` then re-inserts only the categories present in the CSV row. Importing the Shopping CSV with "categories = Shopping" drops the listing's Home & Garden junction. Same for `listing_subcategories`.
2. **Delete step removes whole listing rows.** Any listing in the selected category but absent from the CSV is hard-deleted (~line 480), which destroys its row in `listings` (including all the other category's specific fields) and removes every junction. Even if a listing legitimately should no longer be in the imported category, it shouldn't be deleted outright if it still belongs to other categories.

A smaller, related issue: category-specific arrays like `cuisine`, `payment_methods`, etc. coerce empty CSV cells to `[]` (`parseArray(...) ?? []`), which overwrites existing values when the column is blank. This is fine within the same category, but combined with #1 and #2 amplifies data loss.

## Fix (scoped to category-aware imports, "All Categories" mode unchanged)

Change `src/pages/admin/AdminImport.tsx` so a category-scoped import only ever touches its own category's link and its own category's specific fields. Other categories' data stays exactly as it was in the database.

### 1. Stop wiping cross-category links during upsert sync

Replace the per-listing "delete all junctions then re-insert" with a category-scoped sync:

- **Categories junction**: do not delete all junction rows. Instead:
  - Always ensure `(listing_id, selectedCategoryId)` exists (upsert with `onConflict: "listing_id,category_id"`).
  - For any extra category names the CSV's `categories` column lists, upsert those junction rows too (do not delete them if missing — same as today's add-only behavior for extras).
  - Never delete a junction row for a category other than the selected one.
- **Subcategories junction**: only manage subcategory links whose `subcategory.category_id === selectedCategoryId`.
  - Fetch existing `listing_subcategories` for this listing, filter to subs belonging to the selected category, delete just those, then insert the resolved subs (which by construction belong to the selected category).
  - Subcategories tied to other categories are left untouched.

For the "All Categories" universal mode, keep current behavior (sync everything from the CSV) since it's the explicit "rewrite everything" path.

### 2. Don't hard-delete multi-category listings

In the "delete listings not in CSV" step (~line 480), for category-scoped imports:

- For each existing listing in the selected category that's missing from the CSV, check whether it has junction rows in `listing_categories` to any *other* category.
- If yes → only `DELETE FROM listing_categories WHERE listing_id = X AND category_id = selectedCategoryId` (and only its subcategory links scoped to the selected category). Leave the `listings` row and all other data intact. Count these as "removed from category" rather than "deleted".
- If no → safe to fully delete the listing (current behavior).

Update the result counter to distinguish "deleted" vs "removed from this category" so the toast/results panel is honest about what happened. Update the upload-area helper text accordingly ("Listings missing from the CSV will be removed from this category; only listings that don't belong to any other category will be deleted entirely.").

### 3. Don't blank category-specific arrays/booleans when CSV cell is empty for an existing listing

For the selected category's specific fields, when the CSV cell is empty and the row is an update:

- Treat empty as "no change" (do not include the key in the payload) instead of setting `[]` / `null`.
- Keep the existing explicit-blank rule: `-` continues to mean "clear this field to null".

This applies only to the category-specific field block being processed (e.g. shopping fields during a shopping import). Universal fields keep current behavior (they're part of every category template, so re-downloading the template each time keeps them fresh; user said this is fine).

### 4. Light UI copy refresh

Update the helper text under the category selector and the dashed upload area to spell out the new guarantee: importing a Shopping CSV only edits shopping data + universal fields and never touches a listing's Home & Garden, Accommodation, Restaurant, etc. data or links.

## Files touched

- `src/pages/admin/AdminImport.tsx` — all the above (mutation logic + helper copy).

No DB migrations, no schema changes, no changes to export logic (export already pulls all junctions and category-specific fields correctly).

## Verification

1. Manual test using "Woodlands Garden Centre":
   - Export Shopping CSV, edit a shopping-only field, import → Home & Garden data + link preserved.
   - Export Home & Garden CSV, edit a home-and-garden-only field, import → Shopping data + link preserved.
2. Import a Shopping CSV that omits a listing currently in both Shopping and Home & Garden → listing remains, just removed from Shopping; results panel shows it under "removed from category", not "deleted".
3. Import a Shopping CSV that omits a Shopping-only listing → fully deleted (current behavior).
4. `bunx tsc --noEmit` passes.