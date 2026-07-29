---
name: Follow Requests & Private Accounts
description: Private-account toggle, follow approval flow, and locked-down follows RLS
type: feature
---
- `profiles.is_private` (bool, default false) — when true, new follows insert as `status='pending'` and the target user must approve in `/follow-requests`.
- `follows.status` enum (`pending` | `accepted`). Existing follows were backfilled as `accepted`. Trigger `set_follow_status_on_insert` enforces follower identity, blocks two-way blocked-user follows, and sets status from target's privacy.
- RLS: `follows` SELECT is restricted to rows where `auth.uid()` is follower or following. Counts and follower/following lists for other users are served by SECURITY DEFINER RPCs `get_follow_counts`, `get_followers`, `get_following` (accepted-only, also filter out blocked pairs).
- `useIsFollowing` now returns `'accepted' | 'pending' | null` (not boolean). FollowButton renders Follow / Requested / Following accordingly. UserProfile shows a "This account is private" lock when target is private and viewer is not an accepted follower.
- Privacy toggles + Follow Requests link live in AccountInfo's Privacy section.
- Accept/decline goes through the SECURITY DEFINER RPC `respond_to_follow_request(_request_id, _accept)` from all three call sites (`useRespondToFollowRequest`, MyNotifications, NotificationsDropdown). Accept UPDATEs the row to `accepted`; decline DELETEs it. Already-resolved requests are a no-op.
- `cleanup_follow_request_notification` (AFTER UPDATE OR DELETE on follows) turns the resolved request into permanent history — `follow_request_accepted` / `follow_request_declined` / `follow_request_withdrawn` — and inserts the requester's `follow_accepted` notification. Never compare `follows.status` against `''`: it is an enum and the constant is folded at plan time, which aborts the whole transaction.
- The Accept/Decline handlers must surface RPC errors (toast). Silently returning on error is what previously made the buttons appear dead.
