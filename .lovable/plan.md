## Goal

Restyle the top of `/my-profile` to match the reference screenshot, while keeping the rest of the page (saved listings, activity, etc.) intact.

## Changes (src/pages/MyProfile.tsx only)

1. **Top bar**
   - Keep back arrow on the left.
   - Replace the right-side Share + More buttons with a single Settings (gear) icon button that links to `/my-account`.

2. **Profile header (replace centered sun-rays masthead)**
   - Horizontal row, left-aligned, 20px page padding:
     - Circular avatar ~84px on the left (uses `profile.avatar_url`, fallback initial), no sun-ray decoration.
     - To the right: full name (display_name, bold, ~26px) on one line, optional `@username` underneath in muted small text.
   - Below that row: Followers / Following counts in a left-aligned row (numbers bold, labels muted) — links remain to `/profile/:id/followers` and `/profile/:id/following`. Keep existing follow count source (`useFollowCounts`).
   - Bio (if present) sits below the stats, left-aligned.

3. **Theme adjustments for the header area**
   - Header sits on the existing page background; use brand tokens (cream/ink) consistent with the rest of the app — no orange accents from the reference screenshot.
   - Remove the `SunRays` SVG usage (component can stay defined but unused, or be deleted).

4. **Preserve untouched**
   - Stats card lower section, saved listings/events/specials, activity timeline, share/copy logic (still callable from settings page or removed from header only). The `menuOpen` sheet and share handlers can remain in place but are no longer triggered from the header — leaving them is fine; no other page references them.

## Out of scope

- No changes to MyAccount, routing, data model, or other pages.
- Profile photo entry point from homepage already navigates to `/my-account` per prior change — switching it to `/my-profile` is **not** requested here (user said "click profile photo icon from homepage takes you to my profile"). I will update `src/components/home/HomeMasthead.tsx` `Link to` from `/my-account` back to `/my-profile`.

## Files touched

- `src/pages/MyProfile.tsx` — header redesign.
- `src/components/home/HomeMasthead.tsx` — change avatar link target to `/my-profile`.
