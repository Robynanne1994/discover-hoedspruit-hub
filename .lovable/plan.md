# Feedback replies: notification polish + Replies tab

## 1. Admin reply → notification changes
In `src/pages/admin/AdminSubmissions.tsx` (`sendReply` mutation):
- Set notification `title` to exactly: `Admin has replied to your feedback`.
- Set `body` to the admin reply text (unchanged).
- Set `link` to `/feedback?tab=replies`.
- Keep `ref_table = 'feedback'`, `ref_id = feedback.id`, `kind = 'feedback_reply'`.

## 2. Notification card rendering (`src/pages/MyNotifications.tsx`)
For notifications where `kind === 'feedback_reply'`:
- Do NOT render the left icon tile (skip the icon square entirely so the text spans full width).
- Layout:
  - Title: `Admin has replied to your feedback` (existing 15/700 style).
  - Subject line directly under the title: `Subject: <feedback.subject>` — 12px, weight 500, color `MUTED`, single line with ellipsis.
  - Reply body: existing 13.5px body style, clamped to **2 lines** with ellipsis (already `WebkitLineClamp: 2`).
  - Timestamp underneath as normal.
- To get the subject, batch-fetch feedback rows for all feedback_reply notif `ref_id`s in a `useQuery` (mirrors the existing follow-request actor fetch pattern). Cache into a `Record<feedbackId, subject>`.
- Clicking the card navigates to `/feedback?tab=replies` (uses existing `n.link`).

Same treatment (no icon, subject line, 2-line clamp, link) applied to `src/components/NotificationsDropdown.tsx` for `feedback_reply` items so the bell dropdown matches.

## 3. Feedback page tabs (`src/pages/Feedback.tsx`)
- Read `?tab=` via `useSearchParams`. Values: `submit` (default) and `replies`.
- Query on mount: `select id, subject, message, admin_reply, replied_at, created_at from feedback where user_id = auth.uid() and admin_reply is not null order by replied_at desc`.
- If the user has **at least one reply**, render a two-tab switcher directly under the `PageHeader` title:
  - Tab 1: `Submit Feedback` (current form).
  - Tab 2: `Feedback Replies`.
  - Styling: same pill/segmented style used elsewhere in the app (ivory background, active pill = `#423324` bg / white text), 20px horizontal page padding, sits above the form.
- If no replies exist, hide the tabs and show the form only (current behaviour).

### Replies tab content
Same page background/header. For each reply, render an ivory card (same 16px radius, white bg, HN 400) with:
- Top row: `SUBJECT` micro-label (11px uppercase, letter-spaced, muted) + subject text (15px, INK).
- Divider (1px hairline).
- Admin reply text in full (14px, 1.5 line-height).
- Bottom meta row: date replied (e.g. `12 JUL 2026`) in the muted 11px uppercase style.
- Original message shown as a small secondary block under the reply prefixed `Your message:` (13px muted, 3-line clamp) so the user has context.

No other layout changes to the submit form.

## 4. Data / backend
No schema changes required — `feedback.subject`, `admin_reply`, `replied_at` already exist. All queries are client-side reads under existing RLS (users can already select their own feedback rows).

## Files touched
- `src/pages/admin/AdminSubmissions.tsx` — title + link string.
- `src/pages/MyNotifications.tsx` — feedback_reply special-case rendering + subject fetch.
- `src/components/NotificationsDropdown.tsx` — same feedback_reply rendering tweak.
- `src/pages/Feedback.tsx` — tabs, replies query, replies list UI.
