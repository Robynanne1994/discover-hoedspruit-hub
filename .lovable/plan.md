## Plan

**1. Add Settings icon to `MyNotifications` header**
- In `src/pages/MyNotifications.tsx`, add a `Settings` (gear) icon button positioned absolutely on the right side of the top bar, vertically aligned with the centered "Notifications" title (mirror of the left back button).
- On click, navigate to `/notification-settings`.

**2. Create the Notification Settings page**
- Add route `/notification-settings` in `src/App.tsx`.
- The existing `src/pages/Notifications.tsx` already implements the full preferences UI (push toggle, per-type toggles, category pickers, save to `notification_preferences`). Reuse it: point `/notification-settings` at `<Notifications />` and update its header to read "Notification Settings" with a Back arrow returning to `/my-notifications`.
- Keep the existing `/notifications` → `/my-notifications` redirect untouched so old links still work.

**3. Visual consistency**
- Match the new gear icon to the back button: same 22px stroke-2 lucide icon, same `INK` color, same hit area.
- The Notification Settings page keeps the existing styling; only the title text and back target change.

No data model or RLS changes needed — `notification_preferences` table already exists and is wired up.