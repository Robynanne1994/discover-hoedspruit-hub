# Password Reset ("Forgot Password")

How the flow works, and the one-time Supabase settings it depends on.

## The flow

1. **Ask for a link.** On the log in screen, *Forgot password?* opens the reset
   screen (`Welcome.tsx`, `mode: "forgot"`). Signed-in users get the same thing
   from Account Info → Change Password → *Forgot Password*.
2. **Send.** `sendPasswordResetEmail()` (`src/lib/passwordReset.ts`) calls
   `supabase.auth.resetPasswordForEmail()` with
   `redirectTo = <origin>/reset-password?issued=<epoch ms>`. The `issued` stamp
   is what lets the app enforce its own 15-minute window.
   The confirmation copy is deliberately vague ("if an account exists for…") so
   the screen can't be used to find out who is registered.
3. **Open the email.** The link goes through Supabase's `/auth/v1/verify`
   endpoint, which redeems the one-time token and redirects back to
   `/reset-password` with a recovery session.
4. **Choose a new password.** `ResetPassword.tsx` redeems whatever the link
   arrived with, then shows the new-password form with a live countdown, and
   saves via `supabase.auth.updateUser()`. The user lands on the homepage
   signed in.
5. **Expired or already used.** The screen explains it and offers to email a
   fresh link, rather than dead-ending.

## The 15-minute window

Enforced in two places, so it holds regardless of provider settings:

- **Provider side** — `otp_expiry = 900` in `supabase/config.toml`. Supabase
  stops accepting the token itself after 15 minutes.
- **App side** — every link carries the time it was issued. `ResetPassword.tsx`
  refuses anything older than `RESET_LINK_TTL_MINUTES`, ends any session the
  link granted, and flips the form to "expired" if the window closes while it's
  open.

To change the window, change `RESET_LINK_TTL_MINUTES` in
`src/lib/passwordReset.ts` and `otp_expiry` in `supabase/config.toml` (and the
dashboard value below) together. All user-facing copy reads the constant.

## Supabase dashboard settings

`supabase/config.toml` covers these when the config is pushed with the Supabase
CLI. If this project's auth settings are managed from the dashboard, mirror them
there once — the reset screen degrades gracefully if they aren't set, but the
emailed link's own lifetime is provider-side only.

| Where | Setting | Value |
| --- | --- | --- |
| Authentication → URL Configuration | Site URL | the app's production URL |
| Authentication → URL Configuration | Redirect URLs | add `<site>/reset-password` (or `<site>/**`) |
| Authentication → Emails | Email OTP expiry | `900` seconds |
| Authentication → Emails → Reset Password | Template | contents of `supabase/templates/recovery.html` |

**Redirect URLs is the one that silently breaks the flow.** If
`/reset-password` isn't allowed, Supabase ignores the requested redirect and
drops the user on the Site URL instead. The app compensates —
`RecoveryLinkRedirect` in `App.tsx` forwards a recovery link that lands on any
other route to `/reset-password` — but adding the URL keeps the address bar
honest.

Also make sure a working SMTP sender is configured (Authentication → Emails →
SMTP Settings). Supabase's built-in sender is rate-limited to a handful of
emails an hour on free projects, which looks exactly like "the button does
nothing".

## Files

| File | Role |
| --- | --- |
| `src/lib/passwordReset.ts` | TTL, link parsing, sending, redeeming, friendly errors |
| `src/hooks/useResendCooldown.ts` | 60-second countdown for the resend buttons |
| `src/pages/ResetPassword.tsx` | The `/reset-password` screen |
| `src/pages/Welcome.tsx` | *Forgot password?* on the log in screen |
| `src/pages/AccountInfo.tsx` | *Forgot Password* inside Change Password |
| `src/App.tsx` | `RecoveryLinkRedirect` |
| `supabase/templates/recovery.html` | Branded reset email |

## Notes for future changes

- The reset link is read from a **snapshot of the URL taken at start-up**
  (`src/lib/passwordReset.ts`). The Supabase client strips the tokens from the
  address bar as soon as it has redeemed them, so anything reading
  `window.location` later can wrongly conclude there was no link — which is what
  used to make valid links show "invalid or expired" after a few seconds. Keep
  reading the snapshot.
- Three link shapes are handled: tokens in the hash (implicit), `?code=` (PKCE)
  and `?token_hash=` (newer templates). Supabase picks the shape, so all three
  stay supported.
- Redeeming a link only ever fails on a real error or after a 20-second grace
  period. A slow connection must never be reported as a bad link.
