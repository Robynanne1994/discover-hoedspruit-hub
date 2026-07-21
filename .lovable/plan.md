## Admin user management enhancements

Add delete-user capability, richer activity stats, admin notes, and UX polish to the Admin → Users dialog.

### 1. Delete user (with confirmation)
- Add a red "Delete User" button in the user details dialog (bottom of panel).
- Clicking it opens an AlertDialog "Are you sure? This permanently removes the user and all their data. This cannot be undone."
- On confirm, call an edge function `admin-delete-user` which:
  - Validates caller is admin.
  - Deletes user-owned rows from: `favourites`, `been_here`, `reviews`, `follows` (as follower_id AND following_id), `notification_preferences`, `feedback`, `collection_items` (via collections), `collections`, `user_roles`, `user_blocks` (both sides), `user_reports` (as reporter — keep reports against them for audit? see technical), `business_notifications`, `listing_edits_pending`, `events_pending`, `specials_pending`, `contact_submissions` (if user_id), `follow` notifications, `profiles`, then `auth.admin.deleteUser`.
  - Returns success.
- After success, refresh the users list and close the dialog.

### 2. Deleted-user experience
- On app boot / auth state change in `useAuth`, if `getUser` returns "user not found" / session invalid after previously being signed in, sign out locally and route to `/welcome` with a toast: *"Something went wrong with your account. Please continue as a guest or create another account. Feel free to reach out to us at hello@hellohoedspruit.com."*
- Show the same message inline on the Welcome screen when redirected with the `?deleted=1` query flag.

### 3. User ID truncation
- Display truncated ID (first 8 + … + last 4) with a click-to-expand toggle. Also add a copy button next to it.

### 4. Extra activity fields in dialog
Fetch counts alongside the existing user list (in `admin-list-users` edge function) for each user:
- Feedback submitted
- Reports filed (as reporter)
- Reports received (as reported user)
- Users blocked
- Listing edit suggestions submitted (`listing_edits_pending`)
- Local channel resources submitted (if tracked by `submitted_by` on `bush_telegraph_resources` — verify column exists; if not, skip)
- Events submitted (`events_pending`)
- Specials submitted (`specials_pending`)
- Followers / Following counts

Show these in a compact "Activity" section in the dialog.

### 5. Admin notes per user
- New table `public.admin_user_notes` (user_id, note text, updated_by, updated_at). One row per user (unique on user_id).
- Only admins can select/insert/update via RLS using `has_role(auth.uid(),'admin')`.
- Dialog shows a textarea preloaded with the note; "Save note" button upserts it.

### 6. Dialog visual polish
- Row labels ("Email", "Phone", etc.) become darker/bolder: `#1A1A1A`, weight 600.
- Values stay right-aligned with normal weight.

### Technical notes
- New file: `supabase/functions/admin-delete-user/index.ts` (mirrors `delete-account` but requires admin caller and takes a `user_id` param).
- Update `supabase/functions/admin-list-users/index.ts` to add the extra counts (parallel queries, then map by user_id).
- Migration: create `admin_user_notes` with GRANT + RLS + updated_at trigger.
- `src/pages/admin/AdminUsers.tsx`: expand dialog with activity block, notes textarea, ID toggle+copy, delete button + AlertDialog.
- `src/hooks/useAuth.tsx` + `src/pages/Welcome.tsx`: handle deleted-account redirect + toast.
- Keep `user_reports` rows where the deleted user was the reported party? Recommend: keep the row but null out `reported_user_id` FK behaviour — since these rows may have FK to auth.users with cascade, verify and adjust in the delete function accordingly. Same for reviews/comments authored by the user (delete them per current pattern).
