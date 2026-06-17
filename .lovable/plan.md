# Admin User-Report Moderation Workflow

Today `AdminUserReports.tsx` lets you mark reports read/reviewed/dismissed or delete them. There is no way to act on the reported user, no audit trail, no warning/suspension/ban mechanism, and reporters never hear back. This plan adds a complete, repeatable moderation workflow.

## Suggested admin process (the human side)

When a "new user report" notification arrives, work the report in this order:

1. **Triage (≤30 s)** — Open Admin → Reported Users. Read reason + detail. Check if the same reported user has other open or past reports (repeat offender heuristic).
2. **Gather evidence** — From the report card, jump to:
   - Reported user's public profile (already linked)
   - Their recent reviews, listings/events submitted, follow activity
   - Reporter's profile (to spot retaliatory/bad-faith reports)
3. **Decide severity**
   - *No violation* → **Dismiss** with a one-line admin note.
   - *Minor* (rude tone, low-quality content) → **Warn** the user (in-app notification) + note.
   - *Moderate* (harassment, repeated spam, misleading listing) → **Suspend** for N days (default 7). User can sign in but cannot post reviews, submit listings/events, follow, or report.
   - *Severe* (hate speech, threats, impersonation, scam, CSAM-adjacent) → **Ban** permanently. Same restrictions, plus profile hidden from search/discovery.
   - *Content-specific* (one bad review, one bad listing edit) → leave account alone, **remove the offending content** via existing admin pages, then resolve report.
4. **Notify the reporter** — One-click "Thanks, we acted" or "Thanks, no action needed" message so users feel heard and keep reporting.
5. **Resolve** — Set status to `reviewed` / `dismissed`. The action and note are written to an audit log so the next admin can see the history if the user is reported again.
6. **Escalation rule** — Any user with ≥3 upheld reports in 30 days auto-flags for ban review at the top of the queue.

## What gets built

### 1. Schema (one migration)

- Add to `user_reports`:
  - `severity text` (`none|minor|moderate|severe`)
  - `action_taken text` (`none|warned|content_removed|suspended|banned`)
  - widen `status` allowed values to include `reviewed` and `dismissed` (already used in code)
- Add columns to `profiles`:
  - `moderation_status text default 'active'` (`active|warned|suspended|banned`)
  - `suspended_until timestamptz`
  - `moderation_reason text`
- New table `moderation_actions` (audit log): `target_user_id`, `actor_admin_id`, `action` (`warn|suspend|unsuspend|ban|unban|note|content_removed`), `reason`, `duration_days`, `related_report_id`, `created_at`. Admin-only RLS.
- Trigger / RPC `apply_moderation_action(report_id, action, severity, duration_days, admin_note, notify_reporter_message)` (security definer) that, in one transaction:
  - updates the profile flags,
  - updates the report (`status`, `severity`, `action_taken`, `admin_note`, `resolved_at`, `is_read`),
  - inserts a row in `moderation_actions`,
  - inserts a `business_notifications` row for the reported user ("Your account has been warned/suspended/banned — reason: …"),
  - optionally inserts a `business_notifications` row for the reporter ("Thanks — we reviewed your report and …").
- Helper RPC `get_user_moderation_summary(_user_id)` returning open report count, total reports, current status, last action — for the admin card.

### 2. Enforcement (where the flags actually bite)

A new `useModerationStatus()` hook + a tiny `requireActiveAccount()` guard called inside the existing mutation paths:

- Posting a review (`reviews` insert)
- Submitting a listing/event/special (`*_pending` inserts)
- Following a user (`follows` insert)
- Submitting a report (`user_reports` insert)
- Sending feedback / contact

If `moderation_status = 'banned'` → block. If `'suspended'` and `suspended_until > now()` → block with a clear toast: "Your account is suspended until <date>." A daily cron-style edge function (or a trigger on read) auto-clears expired suspensions back to `active`.

Search/discovery RPCs (`search_public_profiles`, `get_followers`, `get_following`, suggested users) get a `WHERE moderation_status <> 'banned'` filter so banned accounts disappear from passive discovery.

### 3. Admin UI changes

`AdminUserReports.tsx`:

- New "Other reports about this user" inline chip showing count, clickable to filter to that user.
- New **Act on user** dropdown on each report card with: Warn, Suspend 1d / 7d / 30d / custom, Ban, Remove content only, Dismiss. Each opens a small dialog with required admin note + optional reporter message, then calls `apply_moderation_action`.
- Reported-user line shows a colored pill for current `moderation_status` (`active` / `warned` / `suspended until X` / `banned`).
- New filter tab: **Repeat offenders** (users with ≥2 pending reports).
- "Moderation history" expandable section per card showing rows from `moderation_actions` for the reported user.

New admin page `AdminModeratedUsers.tsx` (link from Admin sidebar): list of currently warned/suspended/banned users with an **Unsuspend / Unban** button (also writes to audit log).

### 4. User-facing surfaces

- Banned/suspended users see a small banner on their own profile and on the sign-in success screen explaining status and (for suspensions) the end date — pulled from `profiles.moderation_status` + `suspended_until` + `moderation_reason`.
- Reporters get a notification in their existing notifications inbox when their report is actioned or dismissed, closing the loop.

## Technical notes

- All RLS additions: `moderation_actions` admin-only select/insert; `profiles.moderation_status` readable by everyone (already public columns); writable only by the RPC (security definer, checks `has_role(auth.uid(),'admin')`).
- The single `apply_moderation_action` RPC keeps the client simple and the audit trail guaranteed — admin UI never writes profile flags directly.
- No change to existing `business_notifications` schema; we reuse `kind = 'moderation'` for outgoing messages and `kind = 'report_update'` for reporter feedback.
- Expired-suspension cleanup: cheap nightly edge function `clear-expired-suspensions` running `UPDATE profiles SET moderation_status='active', suspended_until=NULL WHERE moderation_status='suspended' AND suspended_until < now()`.

## Out of scope (flag for later if you want)

- Appeals flow for banned users
- Email (not just in-app) notifications to actioned users
- Shadow-banning (content visible only to the author)
- IP/device-level blocks
