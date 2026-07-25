# Account Notices page

Give users a place to review every moderation action taken on their account (warnings, content removals, suspensions, bans, restorations), instead of dropping them on `/account-settings` with nothing to see.

## Data source

Two tables already hold everything we need — no schema changes required:

- `moderation_actions` — full audit log: `action`, `reason`, `duration_days`, `created_at`, `related_report_id`, `target_user_id`. Currently admin-only via RLS.
- `business_notifications` (kind = `moderation`) — the user-facing copy already sent at the time of the action.

We'll surface `moderation_actions` rows for the signed-in user (`target_user_id = auth.uid()`).

## Changes

1. **RLS policy** on `moderation_actions`: allow a user to `SELECT` their own rows (`target_user_id = auth.uid()`). Admin policies stay as-is. No grants change needed beyond `SELECT` to `authenticated` if not already present.

2. **New route `/account-notices`** → `src/pages/AccountNotices.tsx`:
   - Standard `PageHeader` ("Account Notices") and back button.
   - Fetches the user's `moderation_actions` ordered by `created_at desc`.
   - Each row is an ivory card showing:
     - Title derived from `action` (Account Warning, Account Suspended, Account Banned, Content Removed, Account Restored).
     - Date (e.g. "17 Jun 2026").
     - `reason` / admin note body.
     - For suspensions: "Until {created_at + duration_days}".
     - Current status pill if this is the active state (pulled from `profiles.moderation_status`).
   - Empty state: "No account notices. Your account is in good standing."

3. **Entry point in Account Settings**: add an "Account Notices" row in the existing grouped list on `src/pages/AccountSettings.tsx` (same 22px icon + ArrowUpRight pattern used by the other rows). Show a small red dot if there are any unread moderation notifications.

4. **Notification link**: update `apply_moderation_action` so newly created `business_notifications` rows for warnings/suspensions/bans/content-removed/restored use `link = '/account-notices'` instead of `/account-settings`. Also run a one-off `UPDATE` on existing `business_notifications` rows with `kind = 'moderation'` to repoint their `link`.

## Out of scope

- No new admin surface (admins already have their moderation dashboard).
- No changes to how notifications are rendered — only the destination changes.
- Not exposing the reporter's identity or the original report contents.

## Technical notes

- Route registered in `App.tsx` behind the same auth gate as other account pages.
- Reuse existing card/typography tokens from the design system (ivory `#F5F0E8` card, Bricolage title, Helvetica body, hairline dividers).
- Query with react-query, keyed by user id.
