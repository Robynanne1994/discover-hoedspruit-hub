## Goal
Make the notification preference toggles (the items shown when a user drills into "New Listings", "Listing Updates", "New Specials", "New Events") editable from the admin backend instead of being hardcoded in `src/lib/notificationCategories.ts`.

## Approach

### 1. Database (new tables)
Create two simple tables, plus seed them with the current hardcoded values:

- `notification_category_groups`
  - `id` (uuid), `filter_type` (text: `events_new` | `listings_new` | `listings_updates` | `specials_new`), `label` (text), `sort_order` (int)
- `notification_category_items`
  - `id` (uuid), `group_id` (uuid fk → groups), `slug` (text, stable — saved in user prefs), `label` (text), `sort_order` (int)

RLS:
- Public SELECT (so the user-facing notifications page can read them).
- Admin-only INSERT/UPDATE/DELETE via `has_role(auth.uid(), 'admin')`.

Note: a single shared catalog (`listings_new`/`listings_updates`/`specials_new` all use the LISTING groups today). To keep it editable per-type without duplication confusion, I'll store one row per `filter_type` even if the labels overlap — admins can then customise specials vs listings separately if they want. Seed will copy the same listing list into all three listing-based types.

### 2. Admin page
New route `/admin/notification-categories` (link from AdminLayout sidebar).

UI per filter type tab (Events, New Listings, Listing Updates, Specials):
- List of groups with drag-handle reorder (or up/down buttons — simpler).
- Inside each group, list of items with label + slug + reorder + delete.
- "Add group" and "Add item" buttons.
- Edit label inline; slug auto-generated from label on create but editable (warning shown that changing slug breaks saved preferences).
- Save button persists changes.

### 3. User-facing page
`NotificationCategories.tsx` currently imports static `FILTER_TYPE_META` / `LISTING_CATEGORY_GROUPS` / `EVENT_CATEGORY_GROUPS`. Replace with a `useQuery` that fetches groups + items for the active `filter_type` from the new tables. Keep the static `FILTER_TYPE_META` for page header copy (eyebrow/title/subline/column) — only the groups become dynamic.

The `count` field (grey number next to each toggle today, e.g. "Restaurants & Cafés 52") will be dropped from the editor since it's category-listing counts that don't really match these slugs — or I can keep it as an optional editable number. **Question for you below.**

### 4. Migration of existing user data
No change needed — user preferences are stored by slug in `notification_preferences.*_categories` arrays. As long as seeded slugs match the current hardcoded ones, existing saved selections keep working.

## Technical details
- Files added: `supabase/migrations/<ts>_notification_categories.sql`, `src/pages/admin/AdminNotificationCategories.tsx`, `src/hooks/useNotificationCategories.ts`.
- Files changed: `src/App.tsx` (route), `src/pages/admin/AdminLayout.tsx` (nav link), `src/pages/NotificationCategories.tsx` (replace static import with query), `src/lib/notificationCategories.ts` (keep `FILTER_TYPE_META` headers, remove the group arrays or mark them as fallback only).

## One question before I build
The grey number (e.g. "Restaurants & Cafés **52**") next to each toggle — do you want:
1. To **remove** it (cleanest editor, less to maintain), or
2. To keep it as a **manually editable number** in the admin, or
3. To have it **auto-calculate** from how many real listings/events match that slug?
