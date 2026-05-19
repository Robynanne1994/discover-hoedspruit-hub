# Listings Editor Refinements

All changes are scoped to the admin listings editor and a couple of small UI components.

## 1. Strip helper text from labels
In `src/pages/admin/AdminListings.tsx`:
- `Google Rating (0-5)` → `Google Rating`
- `Google Reviews Count` (already clean — no change)
- `Website Display Text (optional — shown instead of the URL)` → `Website Display Text`

## 2. Inline "Add new" for Categories & Subcategories
In the Categories checkbox group, append an **+ Add category** button that opens a small inline input + Save. On save:
- Insert a row into `categories` (title + next `sort_order`, default icon `Folder`).
- Invalidate the `admin-categories-select` query so the new row appears.
- Auto-tick it via `toggleCat(newId)`.

Same pattern under Subcategories (only visible once at least one parent category is selected): asks which selected parent category to attach to (single-select if only one parent is chosen, skip the picker), inserts into `subcategories`, refreshes, auto-ticks.

Errors are surfaced via `toast.error`. Duplicates (case-insensitive match against existing titles in the same scope) just re-use the existing row and tick it.

## 3. Gallery: hide the URL textarea by default
In `src/components/admin/GalleryUpload.tsx`:
- Hide the URL `<Textarea>` by default.
- Add an **Add image URLs** button next to **Upload Images**.
- Clicking it reveals the textarea (state `showUrlInput`). Once open it stays open for the session of the dialog. Auto-opens on edit when `value` already contains URLs.

No change to upload/crop logic.

## 4. Always show attributes (remove the toggle)
In `AdminListings.tsx`:
- Remove the `Switch` + label "Show restaurant attributes on detail page" and the `{form.show_attributes && (...)}` guard — render the attributes block unconditionally inside `isRestaurantType`.
- Force `show_attributes: true` in the upsert payload and in `emptyForm`/`startEdit`.
- One-time backfill: on save, always send `show_attributes: true`. No migration needed (existing rows will flip the next time they're edited; UI on the public detail page reads attributes regardless, so check ListingDetail to confirm it doesn't gate on `show_attributes`).

Technical note: I'll verify `ListingDetail.tsx` displays attributes without checking `show_attributes`. If it does check, remove that guard too so all listings render attributes consistently.

## 5. Editable Meal / Vibe / Cuisine / Seating / Service Type
These already store as free `text[]` on `listings`, so any value persists per-listing. To make new values appear as selectable chips for **future** listings without a new table:

- Add a query that aggregates distinct values from existing rows per field (one `supabase.rpc`-free `select` per field, dedup client-side) and merges with the hard-coded `MEAL_OPTIONS` / `VIBE_OPTIONS` etc.
- Below each chip group add a small **+ Add option** inline input. On save, the typed value is added to that listing's array and (because of the distinct aggregation) becomes a chip for every future listing automatically.
- Only show this for the restaurant chip groups (where these fields live today).

This avoids new tables and keeps options category-dependent (only restaurant listings see/use them, exactly as today).

## 6. Tri-state toggle label styling
In `src/components/ui/label.tsx` the base `labelVariants` is currently `text-lg font-bold text-red-700` (the red comes from here, not the toggle). This is the root cause of red labels across the editor.

Fix locally in `src/components/admin/TriStateToggle.tsx` by giving the label its own className that overrides the base:
```
<Label className="text-sm font-semibold text-foreground">{label}</Label>
```
(`text-foreground` resolves to near-black per the design tokens, `text-sm` is slightly smaller than the default `text-lg`, `font-semibold` per request.)

I'll leave the global `Label` definition alone to avoid touching every other form across the app.

## Out of scope
- No DB schema changes.
- No changes to public detail page logic beyond removing a `show_attributes` gate if one exists.
- No changes to bulk import or CSV.
