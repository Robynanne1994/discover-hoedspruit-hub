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
