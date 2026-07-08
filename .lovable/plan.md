
## Goal

Let an admin set a custom display order for listings within each category. When a listing has a custom position for that category, it uses it. When it doesn't, it falls back to the current behaviour (featured first, then arbitrary DB order). All existing filters/sorts (name, distance, rating, refine drawer) remain unchanged — this only affects the "Default" sort before any user interaction.

## How ordering will work

New table `listing_category_order`:
- `category_id` (FK to categories)
- `listing_id` (FK to listings)
- `position` (integer, lower = higher up)
- unique (category_id, listing_id)

RLS: public read; write restricted to admins (via existing `has_role`).

Default-sort logic on `CategoryPage.tsx`:
1. `is_featured DESC` (unchanged — featured still pins to top).
2. Then listings that have a `position` row for this category, sorted ascending by `position`.
3. Then everything else in current arbitrary DB order.

If no listing in the category has a custom position, behaviour is byte-identical to today.

## Admin UI

New "Order listings" control inside `src/pages/admin/AdminCategories.tsx` (or a dedicated sub-page per category):
- Opens a drag-to-reorder list of all listings in that category.
- Save writes `position` values (1..N) for the ones the admin arranged. Listings the admin doesn't touch stay unordered and fall through to the arbitrary tail.
- "Reset" clears all custom positions for the category, restoring pure default.

Uses existing `@dnd-kit` if already installed, otherwise up/down arrow buttons (no new dependency needed — I'll check first and pick whichever is already present).

## Files to change

- New migration: create `listing_category_order` table + GRANTs + RLS + admin-write policy.
- `src/pages/CategoryPage.tsx`: extend the default listings query to left-join / merge custom order and apply the 3-tier sort above only when `sortBy === "default"`.
- `src/pages/admin/AdminCategories.tsx` (+ possibly a new `AdminCategoryOrder.tsx`): add the reorder UI and save/reset handlers.

## Out of scope

- No changes to name/distance/rating sorts.
- No changes to filters, subcategory pills, search, or refine drawer.
- No changes to home page, events, or specials ordering.
- No changes to CSV import/export (custom order is managed only through the admin UI).
