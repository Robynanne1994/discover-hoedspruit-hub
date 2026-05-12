
## Cleanup decisions (chosen for you)

1. **Notifications**: keep `/my-notifications`. Make `/notifications` redirect to it.
2. **Help Centre lives in GlobalMenu only.** Remove it from the MyAccount "Help & Settings" group.
3. **Add "Contact Us" as a 4th row** inside the Help Centre hub, then remove Contact from elsewhere.

## Edits

### 1. `src/components/GlobalMenu.tsx`
Replace the entire "Help Centre" section with a single row:

```text
Help & Info → Help Centre   (→ /help-centre)
```
Remove rows: Help, Contact Us, About, Privacy & Security.
Privacy & Security stays reachable via Settings.

### 2. `src/pages/AccountSettings.tsx`
- Delete the `supportRows` array and its `<SettingsGroup label="Support & Legal" …>` render call.
- Update `accountRows`: change Notification Preferences `href` from `/notifications` to `/my-notifications`.
Settings now shows only: Account Info, Notification Preferences, Privacy & Security, plus Delete account at the foot.

### 3. `src/pages/MyAccount.tsx`
- In `helpItems`, remove the "Help Centre" entry. Final list: Settings, My Business.
- In `getInTouchItems`, remove the "Contact" entry. Final list: Advertise, Feedback.

### 4. `src/pages/HelpCentre.tsx`
Add a 4th row to the `ROWS` array:

```ts
{ title: "Contact Us", desc: "Drop us a note. We read every message.", to: "/contact" },
```
The rust "Drop us a line" CTA stays — but now points to `/contact` (was `/feedback`) so it matches the row, since Feedback already lives under MyAccount → Get In Touch.

### 5. `src/App.tsx`
Replace the `/notifications` route element with a redirect:

```tsx
import { Navigate } from "react-router-dom";
…
<Route path="/notifications" element={<Navigate to="/my-notifications" replace />} />
```
Keep the `Notifications.tsx` file in place for now (no deletion) so nothing else that imports it breaks; it's just unreachable via URL.

## Final mental model after the cleanup

```text
GlobalMenu (hamburger)
  Saved        → My Hoedspruit
  Account      → Notifications, Account Info, Settings
  Help & Info  → Help Centre

Help Centre (/help-centre)
  FAQs · About · Terms & Policies · Contact Us
  + rust card "Drop us a line" → /contact

Settings (/account-settings)
  Account Info · Notification Preferences · Privacy & Security
  · delete account

My Account
  Saved
  Help & Settings → Settings, My Business
  Resources       → Local Channels, The Lowveld Lowdown
  Get In Touch    → Advertise, Feedback
```

Every destination has exactly one canonical menu path. No duplicate notification routes. No support links scattered across three pages.
