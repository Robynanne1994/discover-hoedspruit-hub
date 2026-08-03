# Email Verification

Every account has to prove its email address with a six-digit code — at signup,
and again whenever the address is changed. The address is the only way we can
reset someone's password or reach them about their account, so an address
nobody owns is worse than no address at all.

## The flows

### 1. Creating an account

1. **Sign up.** `Welcome.tsx` (`mode: "signup"`) validates the form, checks the
   username, then calls `signUp()`. The username and residency travel as user
   metadata, not as a `profiles` write — with confirmation on there is no
   session yet, so the client has nothing it is allowed to write with.
2. **No session means a code was sent.** `signUp()` returns
   `needsVerification` when Supabase withholds the session. The screen switches
   to `mode: "verify"`.
3. **Enter the code.** Six boxes (`VerificationCodeInput`), auto-submitting on
   the last digit, with paste support so a code copied out of the email works
   whatever punctuation comes with it. `verifySignupCode()` calls
   `verifyOtp({ type: "signup" })`.
4. **In.** Verifying returns a session. The DB trigger claims the chosen
   username and residency (see below), and the user lands on the homepage.
5. **Didn't arrive.** *Send a new code* resends, counting down the 60-second
   provider limit. *Go back* returns to the form with everything still filled
   in, so a mistyped address can be corrected.

### 2. Changing your email

1. **Edit and save.** Account Info saves every other field immediately. The
   email is left alone: it belongs to Supabase Auth, and it only moves once the
   new address answers.
2. **Code to the new address.** `sendEmailChangeCode()` →
   `supabase.auth.updateUser({ email })`. The account keeps its current address
   the whole time, so a typo cannot strand it.
3. **Confirm.** `VerifyEmailSheet` takes the code →
   `verifyOtp({ type: "email_change" })`. The `on_auth_user_email_changed`
   trigger mirrors the new address onto `profiles.email`.
4. **Interrupted.** Supabase parks the requested address on `user.new_email`
   until it is confirmed, so re-opening Account Info picks the request back up
   rather than losing it.
5. **Or they tap the link instead.** The same email carries a one-tap
   confirmation link. `emailChangeLink.ts` reads it off the URL the app was
   opened with, `App.tsx` sends that visit to Account Info, and Account Info
   redeems it and reports the result — so the link finishes the change too
   rather than dropping someone on the homepage. See *"The button in the email
   doesn't do anything"* below.

### 3. Accounts made before any of this

Those accounts have no `email_confirmed_at`, and Supabase refuses their
password sign-in with "Email not confirmed".

- **On the log in screen** that is caught (`isEmailNotConfirmedError`), a code
  is sent, and the same verify step appears — no dead end.
- **In Account Info** the email row says *Not verified yet* and offers *Send me
  a code*, so a signed-in user can confirm without changing anything.

## Why the username isn't claimed until the address is confirmed

`handle_new_user()` creates the profile row at signup but deliberately leaves
`username` and `location` empty. `apply_signup_metadata()` fills them in when
`email_confirmed_at` is first set.

Without this, someone who mistypes their email at signup and goes back to try
again finds their own abandoned attempt sitting on the handle they want. A
username taken in the meantime is dropped rather than failing the confirmation —
the user can pick another in Account Info, and
`profiles_username_unique_ci` stays the final guard.

## Why the emails never arrived

Three separate faults, all of which produce the same symptom — an empty inbox,
or a message in spam with a red banner and a button that does nothing.

**1. Nothing was sending them properly.** Auth email was going out through the
platform's built-in sender. That sender is a shared development convenience,
rate-limited to a handful of messages an hour on a free project. Past that
limit it simply stops, silently, and the app carries on saying "check your
email".

**2. The mail wasn't from us.** It came from a shared provider domain that
hellohoedspruit.com has never vouched for. A receiving server checks three DNS
records — SPF, DKIM, DMARC — to decide whether a message really is from who it
claims. With none of them pointing our way the message fails all three, which is
what earns the spam folder and the red *"this message might be dangerous"*
banner. **A banner-flagged message also has every link in it disabled** — the
button renders, tapping it does nothing, and no amount of HTML can undo that.

**3. The template had no code in it.** The app asks for six digits. The stock
template is link-only. Those digits were never in the email.

`supabase/functions/send-auth-email/index.ts` fixes all three. Registered as a
Supabase **Send Email Hook**, it takes auth email away from the built-in sender
entirely: Supabase hands it every message, and it renders the templates that
ship in this repo (code first, link optional) and sends them through a provider
on a domain we control.

## Setup — do these in order

Steps 1–3 are the ones that make email arrive. Nothing else in this document
matters until they are done, and none of them can be done from the codebase.

### 1. A sending domain (this is what stops the spam warnings)

1. Create a [Resend](https://resend.com) account. The free tier covers 3,000
   emails a month, which is far more than signups will need.
2. **Domains → Add Domain →** `hellohoedspruit.com`.
3. Resend shows three DNS records. Add them wherever the domain's DNS is
   managed, then press Verify. This is the step that authenticates the mail as
   genuinely ours, and it is the one that removes the warning banner.
4. **API Keys → Create**, with *Sending access*. Copy the key.

Until this is done the function falls back to the existing Lovable sender so
the flows keep working — but the deliverability problem is *not* fixed by the
fallback. Only the DNS records fix that.

### 2. Secrets

In Supabase → **Edge Functions → Secrets**:

| Secret | Value |
| --- | --- |
| `RESEND_API_KEY` | the key from step 1 |
| `SEND_EMAIL_HOOK_SECRET` | generated in step 3 below |
| `AUTH_EMAIL_FROM` | `Hello Hoedspruit <noreply@hellohoedspruit.com>` |
| `AUTH_EMAIL_REPLY_TO` | `hello@hellohoedspruit.com` |

`AUTH_EMAIL_FROM` **must** be on the domain verified in step 1. Sending as a
domain you haven't verified is worse than not sending at all.

### 3. Register the hook

Supabase → **Authentication → Hooks → Send Email Hook**:

- Enable it, type **HTTPS**.
- URL: `https://dgkfsavtyclwkramearr.supabase.co/functions/v1/send-auth-email`
- Generate the secret, and paste that same value into `SEND_EMAIL_HOOK_SECRET`
  above.

The function refuses any request it cannot verify against that secret. Without
it the endpoint would email a valid six-digit login code to whatever address a
caller named — so a mismatch here fails closed, and no mail goes out at all.

### 4. The rest of the auth settings

`supabase/config.toml` covers these when pushed with the Supabase CLI. **If this
project's auth settings are managed from the dashboard, mirror them there — the
flows above don't work until confirmations are on.**

| Where | Setting | Value |
| --- | --- | --- |
| Authentication → Sign In / Providers → Email | Confirm email | **On** |
| Authentication → Sign In / Providers → Email | Secure email change | **Off** |
| Authentication → Emails | Email OTP expiry | `900` seconds |
| Authentication → Emails | Email OTP length | `6` |
| Authentication → URL Configuration → Redirect URLs | Allow list | must include `<site>/account-settings/info`, `<site>/reset-password` and `<site>/**` |

**Secure email change must be off.** With it on, Supabase emails *both* the old
and the new address and needs both codes — which is exactly the old, mistyped,
unreachable address someone is trying to escape. It would make a typo
permanent.

The `[auth.email.template.*]` files in `supabase/templates/` are now only a
safety net for the hook being switched off. While the hook is on, the templates
that actually go out are the ones in
`supabase/functions/_shared/authEmailTemplates.ts`.

### 5. The public site URL

Emailed links have to point at a real web address. Inside the app shell
`window.location.origin` is `capacitor://localhost` — a private scheme belonging
to that one phone's webview, which Supabase drops (not on the allow list) and no
mail client can open. `src/lib/publicOrigin.ts` rewrites it.

It defaults to `https://hello-hoedspruit-hub.lovable.app`. **When the app moves
to hellohoedspruit.com, set `VITE_PUBLIC_SITE_URL` to it** and add that origin
to the redirect allow list in step 4.

## Checking it worked

1. Sign up in the app with a real address you can open.
2. The email should arrive in the **inbox**, not spam, within a few seconds,
   with the six digits in the subject line.
3. In Gmail, **Show original** should read `SPF: PASS`, `DKIM: PASS`,
   `DMARC: PASS`. If any says FAIL, the DNS records in step 1 aren't right yet.
4. If nothing arrives, look at the `send-auth-email` logs in the Supabase
   dashboard, and at `select * from email_send_log order by created_at desc` —
   every attempt is recorded there with its error.

## "The button in the email doesn't do anything"

The stock provider template for a change of address is link-only: a **Confirm
Email Change** button and nothing else. Two separate things go wrong with it,
and they look identical from the inbox.

**1. The mail client disabled the link.** When Gmail puts a red *"This message
might be dangerous — it contains a suspicious link"* banner on a message, it
neutralises every link in the body. The button still renders; tapping it does
nothing at all. Nothing in the HTML can undo that. It happens because the link
is a `verify?token=…&redirect_to=…` redirector on shared provider
infrastructure (`no-reply@auth.lovable.cloud`), which is the same shape a
phishing redirect has.

The fix is not to depend on the link, and both halves are now in place:

- **The code leads, the link is optional.** Every template in
  `supabase/functions/_shared/authEmailTemplates.ts` puts six digits of plain
  text in the subject line and at the top of the body. No filter can disable
  plain text, and the app only ever asks for the digits. A test asserts the code
  is present in all three parts for all six email types.
- **The mail comes from our own domain**, via the hook and Resend (setup steps
  1–3). That is what stops the banner appearing in the first place.

**2. The link worked, but landed nowhere useful.** Supabase only redirects to
URLs on its allow list. Two things sent the confirmation to the project's Site
URL — the homepage — with the credentials sitting unread in the address bar:

- A template written before `emailRedirectTo` existed.
  `src/lib/emailChangeLink.ts` handles this: it snapshots those credentials at
  start-up, `App.tsx` routes the visit to Account Info, and Account Info
  redeems them and confirms the change.
- **The redirect the app asked for was unusable.** Inside the app shell, all
  three redirect builders were sending Supabase
  `capacitor://localhost/account-settings/info`. That is not on the allow list
  and is not an address any inbox can open, so it was discarded and the link
  fell back to the Site URL *every single time the request came from the phone*
  — which is every time, for a native app. `src/lib/publicOrigin.ts` now
  rewrites it to the public site.

For both, **Authentication → URL Configuration → Redirect URLs** must include
`<site>/account-settings/info`.

## Files

| File | Role |
| --- | --- |
| `supabase/functions/send-auth-email/index.ts` | **The sender.** Supabase's Send Email Hook: renders and delivers every auth email |
| `supabase/functions/_shared/authEmailTemplates.ts` | The templates that actually go out — code first, HTML + plain text |
| `supabase/functions/_shared/verifyWebhookSignature.ts` | Proves a hook call really came from Supabase |
| `src/lib/publicOrigin.ts` | Rewrites `capacitor://localhost` to an address an inbox can open |
| `src/lib/emailVerification.ts` | Sending, verifying, code normalising, friendly errors |
| `src/lib/emailChangeLink.ts` | Reading and redeeming the one-tap link in the change-of-address email |
| `src/components/auth/VerificationCodeInput.tsx` | The six-box code field |
| `src/pages/Welcome.tsx` | Signup verification, and unconfirmed log in |
| `src/pages/AccountInfo.tsx` | Email change and *Not verified yet* |
| `src/hooks/useAuth.tsx` | `signUp()` metadata and `needsVerification` |
| `supabase/templates/*.html` | Fallback templates, used only if the hook is switched off |
| `supabase/migrations/20260730160000_email_verification_and_availability_rpcs.sql` | Profile/auth sync, deferred username claim, availability RPCs |

## Tests

`src/test/authEmailHook.test.ts` covers the two parts that carry real risk — the
signature check (tampering, replay, wrong secret, rotation) and the templates
(the code is present in subject, HTML and text for every email type; no remote
content; escaping). `src/lib/publicOrigin.test.ts` covers the native-origin
rewrite. Both modules are deliberately free of Deno APIs so they run in the
app's own `npx vitest run`.

## Notes for future changes

- `VERIFICATION_CODE_LENGTH` and `VERIFICATION_CODE_TTL_MINUTES` in
  `src/lib/emailVerification.ts` mirror `otp_length` and `otp_expiry` in
  `supabase/config.toml`. All user-facing copy reads the constants; change both
  sides together.
- Verifying a code **signs the user in**. That is what makes the unconfirmed
  log in path work, and why the signup path has a session to finish with.
- `profiles.email` is a mirror, never the source of truth — `auth.users.email`
  is. The `on_auth_user_email_changed` trigger keeps them together, so nothing
  in the app should write `profiles.email` for an address that hasn't been
  confirmed.
