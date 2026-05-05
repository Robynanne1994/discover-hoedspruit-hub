I found the root cause.

Your CSV format is basically correct: the `categories` column uses `|` for multiple categories, for example:

```text
Accommodation|Restaurants & Cafés
Pets & Vets|Shopping
Sports & Fitness|Education
```

The problem is in the app/data flow after the recent import changes:

1. The Explore category detail pages only load listings through the `listing_categories` multi-category link table.
2. Your database currently has 447 listings, but only 3 rows in `listing_categories`.
3. Most listings still only have the old single `listings.category_id` value, so Explore can count them on the main Explore page but cannot show them inside each category page.
4. The current importer is fragile: it deletes category links first, then inserts new ones separately. If the insert step fails or is blocked, the app is left with empty category pages.
5. There is also at least one duplicate title (`Splinters`), which is risky because the bulk import matches listings by title.

Plan to fix it:

1. Repair the existing category links now
   - Backfill `listing_categories` from the current `listings.category_id` values so every listing appears in its current main category again.
   - For the attached CSV, also restore extra multi-category links from the `categories` column where a listing belongs to more than one category.
   - This will make category pages populate again.

2. Make the bulk importer safer
   - Keep supporting `|` as the official delimiter for multiple categories and subcategories.
   - Normalize category names before matching, including whitespace and case.
   - Treat category sync per listing more safely so a failed category insert cannot wipe all category membership silently.
   - Use `upsert`/conflict-safe inserts for `listing_categories` and `listing_subcategories` instead of plain inserts.
   - Surface clear import warnings when a category or subcategory from the CSV cannot be matched/created.

3. Make category pages resilient
   - Update category detail loading so it uses both:
     - the multi-category `listing_categories` table, and
     - the legacy `listings.category_id` fallback.
   - This prevents blank category pages if links are temporarily missing.
   - Add pagination-safe fetching so large categories are not affected by backend row limits.

4. Fix export consistency
   - Ensure the “All Categories (Universal Fields)” export includes all category names from multi-category links.
   - Add a fallback to include the legacy category if a listing has no `listing_categories` rows.
   - This means future exported CSVs will preserve multi-category assignments properly.

5. Add guardrails in the admin import UI
   - Show a preview/summary of how many category links will be created.
   - Show warnings for duplicate titles in the uploaded CSV, because title-based matching can update the wrong listing.
   - Explain in the UI that multiple categories must be separated with `|`.

Once approved, I’ll implement the code fixes and run the data repair so your Explore category pages populate correctly again.