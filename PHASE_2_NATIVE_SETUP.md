# Phase 2 — native app: what's built, and what's needed from you

This covers the six items in your brief: **push notifications, share links &
deep linking, native Google/Apple sign-in, the native share sheet, the status
bar / safe areas**, plus the questions about policy pages, the password /
verification emails, and live content updates.

The **code and the iOS/Android projects are done**. What remains are the pieces
that can only be created in *your* developer accounts — signing keys, OAuth
client ids, DNS. Every one of those is called out under **You provide** below.

---

## 1. Status bar & safe areas — the white strip ✅ done

Fixed in three places so the cream background now runs to the very top and
bottom of the screen, behind the status bar and the home indicator:

- `index.html` — `viewport-fit=cover` (turns on the notch insets the layout
  already uses).
- `capacitor.config.ts` — `ios.contentInset: "never"`, and the `StatusBar`
  plugin set to overlay the web view on Android from launch (no white flash).
- `src/lib/nativeStatusBar.ts` — sets the status-bar text to dark on the light
  background, on both platforms, as the app starts.

**You provide:** nothing. It will look right on the first build.

---

## 2. Push notifications ✅ code done — needs your accounts

The whole pipeline already exists (see `MOBILE_PUSH_SETUP.md` for the deep
detail): every alert is a `business_notifications` row, a DB trigger calls the
`send-push` edge function, which delivers to **FCM (Android)** and **APNs
(iOS)**. It respects the notification toggles you already built — turning a
category off stops the row, which stops the push. The device-token registration
(`src/lib/nativePush.ts`) and the un-register on sign-out are wired in.

Native side now added: the `remote-notification` background mode and
`aps-environment` entitlement on iOS; the FCM default-icon/colour metadata,
`ic_stat_notify` monochrome icon and App Links on Android.

**You provide (once):**

| # | Item | Where |
|---|---|---|
| 1 | **Apple Developer Program** membership ($99/yr) | developer.apple.com |
| 2 | **APNs Auth Key** (`.p8`) + its Key ID + your Team ID | Apple Developer → Keys |
| 3 | **Firebase project**, Android app registered as `za.co.hellohoedspruit.app` | console.firebase.google.com |
| 4 | **`google-services.json`** → I drop it into `android/app/` | Firebase project settings |
| 5 | **Firebase service-account JSON** (for the server to call FCM) | Firebase → Service accounts |
| 6 | Google Play Developer account ($25 once) | play.google.com/console |

I then set the edge-function secrets (`APNS_KEY`, `APNS_KEY_ID`, `APNS_TEAM_ID`,
`APNS_BUNDLE_ID`, `FCM_SERVICE_ACCOUNT`) and the Vault entries that arm the
trigger. **iOS push only works on a real device**, not the simulator.

> **Your side, nothing extra in the app.** The notification settings screen you
> built is the source of truth; there's no separate push config to maintain.

---

## 3. Share links, deep linking & Universal / App Links ✅ code done — needs DNS + IDs

**Clean links:** every shared link is already normalised to your public origin
by `src/lib/publicOrigin.ts` / `src/lib/share.ts`. Set **`VITE_PUBLIC_SITE_URL=https://hellohoedspruit.co`**
in the environment and shared links become `https://hellohoedspruit.co/events/<id>`
instead of the `…lovableproject.com` URL.

**Opening in the app:** `src/lib/deepLinks.ts` (new) listens for
`@capacitor/app`'s `appUrlOpen`, and:

- `https://hellohoedspruit.co/events/<id>` → opens that screen in the app
  (iOS **Universal Links** / Android **App Links**).
- a reset-password or email-change link from an account email → handed to the
  existing reset / email-change screens (they can't see the app-shell URL on
  their own, so the raw link is fed to them — `ingestRecoveryDeepLink` /
  `ingestEmailChangeDeepLink`).
- `za.co.hellohoedspruit.app://…` → custom-scheme fallback for before the
  https association is verified.

**No app installed:** the same `https://hellohoedspruit.co/…` link just opens
the website — which is the app's web build — so it already works as a fallback.
An "open in app / get the app" interstitial can be added to the site later; it
is not required for the links to work.

Native side added: iOS **Associated Domains** entitlement
(`applinks:hellohoedspruit.co`), Android `autoVerify` intent-filters, and the
two association files at **`public/.well-known/`** (they ship in every build and
are served wherever the site is hosted).

**You provide:**

| # | Item | Used in |
|---|---|---|
| 1 | Apple **Team ID** → replaces `REPLACE_APPLE_TEAM_ID` in `public/.well-known/apple-app-site-association` (the id after it, `Hello-Hoedspruit`, is already the app's real iOS bundle id — see §4) | Universal Links |
| 2 | Android signing-cert **SHA-256** fingerprints (Play App Signing + upload key) → replace the placeholders in `public/.well-known/assetlinks.json` | App Links |
| 3 | Confirm the host serves `/.well-known/apple-app-site-association` as `application/json`, **no redirect** (Lovable/most hosts do; worth a check) | both |
| 4 | Point `hellohoedspruit.co` DNS at wherever the web app is hosted | both |

Verify afterwards with Apple's [AASA validator](https://branch.io/resources/aasa-validator/)
and `adb shell pm verify-app-links`.

---

## 4. Native Google & Apple sign-in ✅ code done — needs OAuth client ids

The web build still uses the browser redirect. **Apple** sign-in on the native
app uses the OS: `src/lib/nativeAuth.ts` shows the native **Sign in with
Apple** sheet (`@capacitor-community/apple-sign-in`), takes the identity token
it returns, and calls `supabase.auth.signInWithIdToken()` — the same session
the web flow produces, no redirect. `Welcome.tsx` picks this path
automatically on a device. Apple's "must offer Sign in with Apple" rule is
satisfied (native sheet + entitlement).

**Google is split by platform.** Android uses the real account picker
(`@capgo/capacitor-social-login`, pinned to `^6.0.1` for Capacitor 6
compatibility — same plugin/recipe as the Neatby app) the same
`signInWithIdToken` way as Apple. **iOS does not** — confirmed on-device
2026-09-03: this plugin version's iOS provider never lets the app supply a
nonce, yet GoogleSignIn's iOS SDK embeds its own self-generated one in the ID
token regardless, so Supabase rejects it ("Passed nonce and nonce in id_token
should either both exist or not") no matter what the app sends. There's no
way to know or reproduce a nonce the SDK chose on its own, this Supabase
project is Lovable-managed with no dashboard access to the "skip nonce
checks" provider toggle that would otherwise cover it, and the plugin version
that does forward the nonce needs Capacitor ≥7/8. So **iOS Google sign-in
goes through a system-browser OAuth round trip instead** — the same PKCE flow
the web build already uses, opened in an in-app `SFSafariViewController` (a
real system browser context, not an embedded webview — the thing Apple
actually disallows) via `@capacitor/browser`, and handed back to the app
through the custom URL scheme at `za.co.hellohoedspruit.app://auth-callback`,
the same mechanism a password-reset email link already arrives through
(`deepLinks.ts`).

Both native-SDK providers (Apple, and Google-on-Android) use a split nonce (a
raw value sent to Supabase, its SHA-256 hash sent to the provider). Adopting
`@capgo/capacitor-social-login` also raised the iOS deployment target from
13.0 to 14.0 (`ios/App/Podfile`, `App.xcodeproj`) — the plugin's pod requires
it; nothing else in the app needed the higher floor.

**The iOS Google browser round trip needs one more Supabase redirect URL than
the line below already covers**: `za.co.hellohoedspruit.app://auth-callback`
specifically (or a wildcard `za.co.hellohoedspruit.app://*`) — the bare-scheme
entry alone may not match Supabase's redirect allow-list depending on how it
matches paths, so add the `/auth-callback` path explicitly to be safe.

**iOS and Android intentionally have different app identifiers.** The iOS
project's real, code-signing bundle id (`PRODUCT_BUNDLE_IDENTIFIER` in
`App.xcodeproj`) is `Hello-Hoedspruit` — the one already on file with Apple
Developer from v1 — kept as-is so this stays the *same* App Store listing
rather than a new one. Android's `applicationId` and Capacitor's own `appId`
(`capacitor.config.ts`) stay `za.co.hellohoedspruit.app`; that string is also
still used everywhere as the app's custom URL *scheme* (`za.co.hellohoedspruit.app://…`),
which is unrelated to either platform's real app identifier and doesn't need
to match. Native Sign in with Apple on iOS is signed with the OS's own idea of
the bundle id regardless of any JS constant, so the one place this actually has
to be entered correctly is Supabase's Apple provider (see below).

**You provide:**

| # | Item | Where | Feeds |
|---|---|---|---|
| 1 | Google OAuth **Web** client id | Google Cloud console → Credentials | `VITE_GOOGLE_WEB_CLIENT_ID` + Supabase → Auth → Google → *Authorized Client IDs* |
| 2 | Google OAuth **iOS** client id (+ its reversed id) | same | `VITE_GOOGLE_IOS_CLIENT_ID`; reversed id replaces `REPLACE_GOOGLE_REVERSED_CLIENT_ID` in `ios/App/App/Info.plist` |
| 3 | Google OAuth **Android** client id — SHA-1 of the signing key registered | same | Google console only (no code) |
| 4 | Apple: **App ID** with *Sign in with Apple* capability enabled | Apple Developer → Identifiers | — |
| 5 | Apple provider configured in **Supabase → Auth → Providers → Apple** (`Hello-Hoedspruit` — the app's real iOS bundle id, from the v1 Apple registration — as the client id, **not** `za.co.hellohoedspruit.app`) | Supabase | — |
| 6 | *(Android/Web Apple login only)* an Apple **Services ID** | Apple Developer | `VITE_APPLE_SERVICES_ID` |

Add `hellohoedspruit.co` and `za.co.hellohoedspruit.app://` to **Supabase → Auth
→ URL Configuration → Redirect URLs** while you're there.

---

## 5. Native share sheet ✅ done, nothing needed

Already fully built (`src/lib/share.ts` → `@capacitor/share`). One tap opens the
real iOS/Android sheet — WhatsApp, Instagram, Messages, Copy, everything
installed. The in-app sheet only ever shows on desktop browsers that have no
system sheet. Tapping a target hands off to that app the way it expects. I've
added `whatsapp` / `instagram` to the iOS query-schemes list so those always
resolve.

**You provide:** nothing.

---

## 6. Your other changes & questions

**Policy / Terms linked out to hellohoedspruit.co — is that OK for the stores?**
Yes, with one caveat. Apple and Google both require a **privacy policy URL in
the store listing** (App Store Connect / Play Console) — a link out is fine, and
having it reachable from inside the app (even as an external link) satisfies the
"accessible within the app" expectation. Make sure the pages are reachable
without logging in. Account **deletion** must also be reachable (you have
`delete-account` — keep the button in the app).

**Forgot-password + 6-digit verification end to end on device.**
- The 6-digit codes are app-owned (`account-email` function) and don't depend on
  a link at all — they work on device as-is once the Resend domain is verified
  (see `EMAIL_VERIFICATION_SETUP.md`).
- The password-reset link and the email-change one-tap link now route back into
  the app through the deep-link handler (item 3). They fully work for the
  `?code=` (PKCE) and `?token_hash=` email formats — which is what Supabase
  sends. Keep the templates in `supabase/templates/` (already in the repo).
- **You provide:** the **Resend** account + the SPF/DKIM/DMARC DNS records for
  `hellohoedspruit.co`, and the `RESEND_API_KEY` / `AUTH_EMAIL_FROM` secrets
  (full steps in `EMAIL_VERIFICATION_SETUP.md`). Until then mail sends from the
  fallback domain and lands in spam.

**Can I keep editing listings / events / specials and see them live, no
resubmission?**
**Yes.** The app ships the web build in the bundle but all content is read from
Supabase at runtime. Add or edit a listing/event/special in the Lovable backend
and it shows in the app on the next load — no App Store / Play submission.

**Same for images?**
**Yes.** Images are served from Supabase storage by URL, so uploading or
swapping one updates the app live too. A **new app-store submission is only
needed when the app's own code changes** (a new screen, a bug fix, this Phase 2
work) — not for content or images.

---

## Summary — the "you provide" checklist

- [ ] Apple Developer Program + **Team ID**
- [ ] **APNs Auth Key** (`.p8`) + Key ID
- [ ] Google Play Developer account
- [ ] **Firebase project** + `google-services.json` + service-account JSON
- [ ] Google OAuth client ids — **Web**, **iOS** (+ reversed), **Android** (SHA-1 registered)
- [ ] Apple **App ID** with Sign in with Apple; Apple provider set in Supabase
- [ ] Android signing key **SHA-256** fingerprints (for `assetlinks.json`)
- [ ] `hellohoedspruit.co` DNS → web host; serves `/.well-known/*` as JSON, no redirect
- [ ] **Resend** account + SPF/DKIM/DMARC for `hellohoedspruit.co`
- [ ] Set env: `VITE_PUBLIC_SITE_URL`, `VITE_GOOGLE_WEB_CLIENT_ID`, `VITE_GOOGLE_IOS_CLIENT_ID` (`VITE_APPLE_SERVICES_ID` only if Apple-on-Android)
- [ ] Supabase → Auth → Redirect URLs: add `https://hellohoedspruit.co` + `za.co.hellohoedspruit.app://`
- [ ] Supabase edge secrets: `APNS_*`, `FCM_SERVICE_ACCOUNT`, `RESEND_API_KEY`, `AUTH_EMAIL_FROM`

Once those land I wire them in, run `npm run cap:sync`, and build the store
binaries.

---

## What changed in the code (Phase 2)

| File | Change |
|---|---|
| `src/lib/deepLinks.ts`, `src/components/DeepLinks.tsx` | **new** — Universal/App Link + custom-scheme routing, incl. auth-email links |
| `src/lib/nativeAuth.ts` | **new** — native Google + Apple sign-in → `signInWithIdToken` |
| `src/lib/nativeStatusBar.ts` | **new** — edge-to-edge status bar |
| `src/lib/passwordReset.ts`, `src/lib/emailChangeLink.ts` | `ingest*DeepLink()` so the reset / email-change screens see a link that arrived via the app shell |
| `src/hooks/useAuth.tsx` | `signOut` now unregisters this device from push |
| `src/pages/Welcome.tsx` | native branch in `handleOAuth` |
| `src/App.tsx`, `src/main.tsx` | mount `<DeepLinks/>`, init the status bar |
| `capacitor.config.ts` | `StatusBar` plugin config (Google sign-in configures itself at runtime) |
| `public/.well-known/apple-app-site-association`, `assetlinks.json` | **new** — association files (placeholders for Team ID / SHA-256) |
| `ios/App/App/App.entitlements` | **new** — push, Associated Domains, Sign in with Apple |
| `ios/App/App/Info.plist` | URL schemes, `remote-notification`, query schemes, plugin-owned status bar |
| `android/.../AndroidManifest.xml` | App Links + custom-scheme intent-filters, FCM icon/colour metadata |
| `android/.../res/values/colors.xml` | **new** — brand palette (was missing → would have failed release build) + notification tint |
| `android/.../res/drawable/ic_stat_notify.xml` | **new** — monochrome notification icon |
| `package.json` | `@capacitor/status-bar`, `@capacitor/browser`, `@capgo/capacitor-social-login`, `@capacitor-community/apple-sign-in` |
| `ios/App/Podfile`, `App.xcodeproj` | iOS deployment target 13.0 → 14.0 (required by `@capgo/capacitor-social-login`'s pod) |

Both native projects build clean: `./gradlew :app:assembleDebug` and
`xcodebuild … build` both succeed.
