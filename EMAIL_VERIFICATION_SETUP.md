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

## Supabase dashboard settings

`supabase/config.toml` covers these when the config is pushed with the Supabase
CLI. **If this project's auth settings are managed from the dashboard, mirror
them there — none of the flows above work until confirmations are on.**

| Where | Setting | Value |
| --- | --- | --- |
| Authentication → Sign In / Providers → Email | Confirm email | **On** |
| Authentication → Sign In / Providers → Email | Secure email change | **Off** |
| Authentication → Emails | Email OTP expiry | `900` seconds |
| Authentication → Emails | Email OTP length | `6` |
| Authentication → Emails → Confirm signup | Template | contents of `supabase/templates/confirmation.html` |
| Authentication → Emails → Change Email Address | Template | contents of `supabase/templates/email_change.html` |
| Authentication → URL Configuration → Redirect URLs | Allow list | must include `<site>/account-settings/info` and `<site>/reset-password` |

**Secure email change must be off.** With it on, Supabase emails *both* the old
and the new address and needs both codes — which is exactly the old, mistyped,
unreachable address someone is trying to escape. It would make a typo
permanent.

**The templates must contain `{{ .Token }}`.** That is the six-digit code the
app asks for. Supabase's stock templates are link-only; leave them in place and
the code never reaches anyone.

A working SMTP sender matters more now than it did for password resets, because
every new account depends on it. Supabase's built-in sender is limited to a
handful of emails an hour on free projects, which looks exactly like "the code
never came".

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

The fix is not to depend on the link:

- **Paste `supabase/templates/email_change.html` into Authentication → Emails →
  Change Email Address.** It leads with `{{ .Token }}` — six digits of plain
  text, which no spam filter can disable — and keeps the link only as a
  secondary "same device?" option. The app's confirmation sheet is already
  waiting for exactly that code. Same for
  `supabase/templates/confirmation.html` under Confirm signup.
- **Send from the app's own domain** (Authentication → SMTP Settings, a real
  provider on `hellohoedspruit.com` with SPF/DKIM). That is what stops the
  banner appearing in the first place, for every auth email.

**2. The link worked, but landed nowhere useful.** Supabase only redirects to
URLs on its allow list, so a template written before `emailRedirectTo` sends
the confirmation to the project's Site URL — the homepage — with the
credentials sitting unread in the address bar. `src/lib/emailChangeLink.ts`
handles this: it snapshots those credentials at start-up, `App.tsx` routes the
visit to Account Info, and Account Info redeems them and confirms the change.
For that to work, **Authentication → URL Configuration → Redirect URLs** must
include `<site>/account-settings/info`.

## Files

| File | Role |
| --- | --- |
| `src/lib/emailVerification.ts` | Sending, verifying, code normalising, friendly errors |
| `src/lib/emailChangeLink.ts` | Reading and redeeming the one-tap link in the change-of-address email |
| `src/components/auth/VerificationCodeInput.tsx` | The six-box code field |
| `src/pages/Welcome.tsx` | Signup verification, and unconfirmed log in |
| `src/pages/AccountInfo.tsx` | Email change and *Not verified yet* |
| `src/hooks/useAuth.tsx` | `signUp()` metadata and `needsVerification` |
| `supabase/templates/confirmation.html` | Signup code email |
| `supabase/templates/email_change.html` | Email-change code email |
| `supabase/migrations/20260730160000_email_verification_and_availability_rpcs.sql` | Profile/auth sync, deferred username claim, availability RPCs |

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
