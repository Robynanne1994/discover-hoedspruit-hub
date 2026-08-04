# Email Verification

Every account has to prove its email address — at signup, and again whenever the
address is changed. The address is the only way we can reset someone's password
or reach them about their account, so an address nobody owns is worse than no
address at all.

There are two ways to prove one, and which applies depends on how the account
was made:

| How the account was made | How the address is proved |
| --- | --- |
| Email and password | A six-digit code we email, typed back into the app |
| Google or Apple | Already proved by the provider — no code, but the rest of the profile still has to be filled in |

## The codes are ours

The codes are minted, emailed and checked by
`supabase/functions/account-email/index.ts`, and stored (hashed) in
`public.email_verification_codes`. Nothing about them depends on a setting in
the Supabase dashboard.

**This is a deliberate change, and it is worth knowing why.** Both flows used to
use Supabase Auth's own one-time codes. Those are delivered by whatever email
template the project has configured — which is a dashboard setting no code in
this repo can reach. When that template is the stock one, three things go wrong
at once, and they are what this replaces:

1. **The email has no code in it.** The stock template is link-only. The app
   asks for six digits that were never sent, and there is no way to tell from
   inside the app that that is what happened.
2. **The button in it does the wrong thing.** A stock confirmation link is a
   generic `/auth/v1/verify` redirect that comes back into the app carrying
   credentials which look, from the URL alone, exactly like a password reset's.
   Tapping it opened the reset-password screen — while the app sat on the code
   screen waiting for a code that was never coming.
3. **It may not arrive at all.** The built-in sender is a shared, heavily
   rate-limited development convenience, on a domain `hellohoedspruit.co` has
   never vouched for. What does arrive lands in spam under a red banner, and a
   banner-flagged message has every link in it disabled.

The email the app sends now contains the code and no link at all. A spam filter
can disable a link; it cannot disable six digits of plain text.

Point 3 is only half fixed by owning the codes — the mail still has to be sent
from a domain we control. That is **Setup** below, and it is still worth doing.

## The flows

### 1. Creating an account with an email address

1. **Sign up.** `Welcome.tsx` (`mode: "signup"`) validates the form, checks the
   username, then calls `signUp()` → `startSignup()` → `account-email`
   (`signup-start`).
2. **The account is created, unconfirmed.** Through the admin API, so Supabase
   sends nothing itself. It cannot be signed in to: `enable_confirmations` is on,
   so Supabase refuses a password sign-in for an unconfirmed address. That
   refusal is the gate.
3. **The code goes out.** Six digits, good for 30 minutes, from our own sender.
4. **Enter the code.** Six boxes (`VerificationCodeInput`), auto-submitting on
   the last digit, with paste support so a code copied out of the email works
   whatever punctuation comes with it.
5. **In.** `signup-verify` confirms the address; the app then signs in with the
   password just chosen. Confirming is also what claims the username and
   residency (see below).
6. **Didn't arrive.** *Send a new code* re-issues, counting down the 60-second
   limit. *Go back* returns to the form with everything still filled in, so a
   mistyped address can be corrected — and coming back to the same address picks
   the half-finished attempt up rather than calling it "already in use".
7. **Already taken.** If the address belongs to a confirmed account, signup is
   refused with a message and two buttons: log in instead, or use a different
   email.

### 2. Creating an account with Google or Apple

1. **Tap Continue with Google / Apple.** The provider proves the address, so
   there is no code and no password.
2. **Already taken.** If the address belongs to an existing email-and-password
   account, Supabase refuses rather than quietly taking it over.
   `friendlyOAuthError()` turns that into "that email already has an account —
   log in with your email and password, or use a different email".
3. **Finish the profile.** A provider gives us an email address and very little
   else. `ProfileSetupGate` (in `App.tsx`) sends any provider account with gaps
   to `/complete-profile`, which asks for name, username and residency and won't
   let the app be used until they are filled in. Without it the account exists
   with nothing on it but an email address.
4. **No password, and that's fine.** Account Info says so on the Password row
   and offers to email a link for setting one, rather than asking for a current
   password that has never existed.

### 3. Changing your email

1. **Edit and save.** Account Info saves every other field immediately. The
   email is left alone until the new address answers.
2. **Refused if it's taken.** `change-start` checks the address against every
   other account — `is_email_available` reads both `profiles` and `auth.users`,
   so an address that is only ever used to log in still counts — and refuses
   with a message rather than starting something that cannot finish.
3. **Code to the new address.** The account keeps its current address the whole
   time, so a typo cannot strand it.
4. **Confirm.** `VerifyEmailSheet` takes the code → `change-verify`, which moves
   the address and confirms it in one step, mirrors it onto `profiles.email`,
   and refreshes the session so the app stops reading back the old one.
5. **Interrupted.** The code lives for 30 minutes whether or not the app stayed
   open, so re-opening Account Info picks the request back up
   (`change-status`) rather than losing it.
6. **Cancelled.** *Cancel and keep …* abandons it (`change-cancel`). Nothing on
   the account ever moved.

### 4. Accounts made before any of this

Those accounts have no `email_confirmed_at`, and Supabase refuses their password
sign-in with "Email not confirmed".

- **On the log in screen** that is caught (`explainSignInFailure()` classifies it
  as `unconfirmed`), a code is sent, and the same verify step appears — no dead
  end.
- **In Account Info** the email row says *Not verified yet* and offers *Send me a
  code*, so a signed-in user can confirm without changing anything.

### 5. Passwords

Unchanged, and still Supabase's own: **Forgot password** emails a link
(`resetPasswordForEmail`), and **Change password** in Account Info re-checks the
current one before updating. See `PASSWORD_RESET_SETUP.md`.

Two things about the reset link are worth knowing:

- Every link we send carries the time it was issued (`?issued=…`), and
  `ResetPassword.tsx` refuses anything older than `RESET_LINK_TTL_MINUTES`, with
  a countdown on screen. The window is honoured whatever the provider-side
  expiry says.
- `parseRecoveryUrl()` will only claim credentials that are actually a reset's —
  it checks the `type`, the `issued` stamp and the path they landed on. Before
  that check existed it claimed *every* auth link, which is what sent the email
  change confirmation to the password reset screen.

## Why the username isn't claimed until the address is confirmed

`handle_new_user()` creates the profile row at signup but deliberately leaves
`username` and `location` empty. `apply_signup_metadata()` fills them in when
`email_confirmed_at` is first set.

Without this, someone who mistypes their email at signup and goes back to try
again finds their own abandoned attempt sitting on the handle they want. A
username taken in the meantime is dropped rather than failing the confirmation —
the user can pick another in Account Info, and `profiles_username_unique_ci`
stays the final guard.

## Setup

Owning the codes fixes what was *in* the email. It does not fix what a
receiving server thinks of the sender — only DNS does that, and none of it can
be done from the codebase.

### 1. A sending domain (this is what stops the spam warnings)

1. Create a [Resend](https://resend.com) account. The free tier covers 3,000
   emails a month, far more than signups will need.
2. **Domains → Add Domain →** `hellohoedspruit.co`.
3. Resend shows three DNS records (SPF, DKIM, DMARC). Add them wherever the
   domain's DNS is managed, then press Verify. This is the step that
   authenticates the mail as genuinely ours, and the one that removes the
   warning banner.
4. **API Keys → Create**, with *Sending access*. Copy the key.

Until this is done, sending falls back to the Lovable sender so the flows keep
working — but the deliverability problem is *not* fixed by the fallback.

**Whichever sender is in use, the From address has to be on a domain that
sender has verified, and the two do not share one.** The Lovable sender is
verified for `notify.hellohoedspruit.co` and refuses anything else with
`403 no_matching_sender`; Resend will be verified for whatever you add in step
2 above. Get this wrong and nothing goes out — the app reports "we couldn't
send that email just now" and the provider's real answer only ever lands in
`email_send_log.error_message`, which is the first place to look when account
email stops arriving.

### 2. Secrets

In Supabase → **Edge Functions → Secrets**:

| Secret | Value | Needed for |
| --- | --- | --- |
| `RESEND_API_KEY` | the key from step 1 | deliverability |
| `AUTH_EMAIL_FROM` | `Hello Hoedspruit <noreply@hellohoedspruit.co>` | deliverability |
| `AUTH_EMAIL_REPLY_TO` | `hello@hellohoedspruit.co` | deliverability |
| `VERIFICATION_CODE_PEPPER` | any long random string | optional; falls back to the service role key |
| `SEND_EMAIL_HOOK_SECRET` | generated in step 4 | only if the send-email hook is used |

`AUTH_EMAIL_FROM` **must** be on the domain verified in step 1. Sending as a
domain you haven't verified is worse than not sending at all.

Set it only once Resend is verified. Until then, leave it unset: the built-in
default is `noreply@notify.hellohoedspruit.co`, which is the address the
fallback sender is verified for, and an `AUTH_EMAIL_FROM` pointing at a
Resend-only domain would break the fallback while Resend is still being set up.

### 3. Auth settings

`supabase/config.toml` covers these when pushed with the Supabase CLI. **If this
project's auth settings are managed from the dashboard, mirror them there.**

| Where | Setting | Value |
| --- | --- | --- |
| Authentication → Sign In / Providers → Email | Confirm email | **On** |
| Authentication → Emails | Email OTP expiry | `1800` seconds |
| Authentication → URL Configuration → Redirect URLs | Allow list | must include `<site>/reset-password` and `<site>/**` |

**Confirm email must stay on.** It is the only thing stopping an unverified
account from being signed in to: the app creates accounts unconfirmed and lets
Supabase refuse them until the code comes back. With it off, an unverified
address would be a working account.

### 4. The send-email hook (optional now)

`supabase/functions/send-auth-email` is still registered as Supabase's **Send
Email Hook** and still renders the templates in this repo. It now only affects
the emails Supabase still sends itself — password resets, chiefly. Verification
codes no longer go through it.

- Enable it, type **HTTPS**.
- URL: `https://dgkfsavtyclwkramearr.supabase.co/functions/v1/send-auth-email`
- Generate the secret, and paste that same value into `SEND_EMAIL_HOOK_SECRET`.

The function refuses any request it cannot verify against that secret — a
mismatch fails closed, and no mail goes out at all.

### 5. The public site URL

Emailed links have to point at a real web address. Inside the app shell
`window.location.origin` is `capacitor://localhost` — a private scheme belonging
to that one phone's webview, which Supabase drops (not on the allow list) and no
mail client can open. `src/lib/publicOrigin.ts` rewrites it.

It defaults to `https://hello-hoedspruit-hub.lovable.app`. **When the app moves
to hellohoedspruit.co, set `VITE_PUBLIC_SITE_URL` to it** and add that origin to
the redirect allow list.

## Checking it worked

1. Sign up in the app with a real address you can open.
2. The email should arrive in the **inbox**, not spam, within a few seconds,
   with the six digits in the subject line and at the top of the body — and no
   button at all.
3. In Gmail, **Show original** should read `SPF: PASS`, `DKIM: PASS`,
   `DMARC: PASS`. If any says FAIL, the DNS records in step 1 aren't right yet.
4. If nothing arrives, look at the `account-email` logs in the Supabase
   dashboard, and at `select * from email_send_log order by created_at desc` —
   every attempt is recorded there with its error.

## Files

| File | Role |
| --- | --- |
| `supabase/functions/account-email/index.ts` | **The verification codes.** Issues, emails and redeems them; creates the account; moves the address |
| `supabase/functions/_shared/emailSender.ts` | One send: suppression check, Resend or fallback, send log |
| `supabase/functions/_shared/authEmailTemplates.ts` | The templates — code first, HTML + plain text |
| `supabase/functions/send-auth-email/index.ts` | Supabase's Send Email Hook, for the mail Supabase still sends (password resets) |
| `src/lib/emailVerification.ts` | The client side of the codes, and the friendly errors |
| `src/lib/authProviders.ts` | Google/Apple accounts: no password, and what the profile is still missing |
| `src/lib/passwordReset.ts` | Sending and reading back a reset link |
| `src/lib/emailChangeLink.ts` | Legacy: redeeming a confirmation link from an older email |
| `src/lib/publicOrigin.ts` | Rewrites `capacitor://localhost` to an address an inbox can open |
| `src/components/auth/VerificationCodeInput.tsx` | The six-box code field |
| `src/pages/Welcome.tsx` | Signup, log in, and the verify step |
| `src/pages/CompleteProfile.tsx` | The rest of the account, after a Google/Apple signup |
| `src/pages/AccountInfo.tsx` | Email change, *Not verified yet*, and passwords |
| `supabase/migrations/20260804120000_app_owned_verification_codes.sql` | The code table and the auth.users lookup |
| `supabase/migrations/20260730160000_email_verification_and_availability_rpcs.sql` | Profile/auth sync, deferred username claim, availability RPCs |

## Tests

- `src/lib/emailVerification.test.ts` — code normalising and the error copy.
- `src/lib/passwordReset.test.ts` — link parsing, including the cases where a
  reset link must *not* claim another flow's credentials.
- `src/lib/emailChangeLink.test.ts` — the same, the other way round.
- `src/lib/authProviders.test.ts` — password-vs-provider accounts, profile gaps.
- `src/test/authEmailHook.test.ts` — the hook's signature check and templates.
- `src/lib/publicOrigin.test.ts` — the native-origin rewrite.

## Notes for future changes

- `VERIFICATION_CODE_LENGTH` and `VERIFICATION_CODE_TTL_MINUTES` in
  `src/lib/emailVerification.ts` mirror `CODE_LENGTH` and `TTL_MINUTES` in
  `supabase/functions/account-email/index.ts`. All user-facing copy reads the
  constants; change both sides together.
- Redeeming a code deliberately does **not** hand back a session. It proves the
  inbox, not the person — the password is what signs someone in.
- `profiles.email` is a mirror, never the source of truth — `auth.users.email`
  is. The `on_auth_user_email_changed` trigger keeps them together, so nothing
  in the app should write `profiles.email` for an address that hasn't been
  confirmed.
- After anything changes the address server-side, the client has to
  `refreshSession()`: the access token it is holding still carries the old
  address in its claims until it does.
