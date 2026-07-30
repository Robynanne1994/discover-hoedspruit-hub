# Mobile app + push notifications — setup guide

This repo now contains everything needed to ship **Hello Hoedspruit** as real
iOS + Android apps with native push notifications. The code is done; what's left
are the steps that can only happen on a Mac/PC with the right developer accounts
(they can't run in the cloud build).

---

## How it works

Every alert in the app is already written as a row in the
`business_notifications` table — and a row is only created for a user who has the
matching preference toggle switched on. So the push layer piggybacks on that:

```
content/reminder/follow trigger
        │  (already respects every notification toggle)
        ▼
INSERT into business_notifications (push = true)
        │
        ▼  AFTER INSERT trigger: dispatch_push_notification()
calls the  send-push  edge function
        │
        ├── Android device tokens ──► Firebase Cloud Messaging ──► phone
        └── iOS device tokens     ──► Apple Push Notification svc ──► phone
```

Because pushes fan out from the same rows the in-app list uses, **the
preference screen keeps working exactly as-is** — turning "New Specials" off
stops the row being created, which stops both the in-app alert *and* the push.
No separate push settings to maintain.

New pieces added to the repo:

| File | Purpose |
|---|---|
| `capacitor.config.ts` | Capacitor app config (appId, appName). |
| `src/lib/nativePush.ts` | Registers the device token, handles taps. No-op on web. |
| `src/components/NativePush.tsx` | Mounts the push init once a user is signed in. |
| `supabase/functions/send-push/` | Sends to FCM (Android) + APNs (iOS). |
| `supabase/migrations/20260727130000_native_push_devices_and_dispatch.sql` | `push_devices` table, `register_push_device` RPC, dispatch trigger. |

---

## 0. Prerequisites (one-time accounts)

- **Apple Developer Program** — US$99/year (required for iOS + the App Store).
- **Google Play Developer** — US$25 once (required for the Play Store).
- **Firebase project** — free (used for Android FCM, and to hold the config).
- A **Mac with Xcode** for iOS builds. Android can be built on Mac/Windows/Linux
  with Android Studio.

---

## 1. Install the native tooling (local machine)

```bash
npm install
npx cap add ios       # creates the ios/ project (Mac only)
npx cap add android   # creates the android/ project
npm run cap:sync      # builds the web app and copies it into the native shells
```

> If you change `appId` in `capacitor.config.ts`, do it **before** `cap add`.
> The current value is `za.co.hellohoedspruit.app` — it must match everywhere
> below (Firebase, Apple App ID, `APNS_BUNDLE_ID`).

---

## 2. Firebase / Android (FCM)

1. Create a Firebase project at <https://console.firebase.google.com>.
2. **Add an Android app** with package name `za.co.hellohoedspruit.app`.
3. Download **`google-services.json`** and put it in `android/app/`.
4. Create a **service account key** for the server to send messages:
   Firebase Console → Project settings → *Service accounts* → *Generate new
   private key*. This downloads a JSON file — you'll paste its contents into the
   `FCM_SERVICE_ACCOUNT` secret in step 4.

---

## 3. Apple / iOS (APNs)

1. In the [Apple Developer](https://developer.apple.com) portal, create an
   **App ID** `za.co.hellohoedspruit.app` with the **Push Notifications**
   capability enabled.
2. Create an **APNs Auth Key** (Keys → +, tick *Apple Push Notifications
   service*). Download the `AuthKey_XXXXXXXXXX.p8` file — **you only get to
   download it once**. Note the **Key ID** and your **Team ID**.
3. In Xcode (`npx cap open ios`), select the app target → *Signing &
   Capabilities* → add the **Push Notifications** capability.

For testing on a device with a development build, set `APNS_HOST` to
`api.sandbox.push.apple.com`. App Store / TestFlight builds use the default
`api.push.apple.com`.

---

## 4. Supabase edge-function secrets

Deploy the function and set its secrets (Supabase CLI shown; the dashboard's
*Edge Functions → send-push → Secrets* works too):

```bash
supabase functions deploy send-push

# Android (paste the whole service-account JSON as one value)
supabase secrets set FCM_SERVICE_ACCOUNT="$(cat path/to/firebase-service-account.json)"

# iOS
supabase secrets set APNS_KEY="$(cat path/to/AuthKey_XXXXXXXXXX.p8)"
supabase secrets set APNS_KEY_ID="XXXXXXXXXX"
supabase secrets set APNS_TEAM_ID="YOURTEAMID"
supabase secrets set APNS_BUNDLE_ID="za.co.hellohoedspruit.app"
# Optional: development testing only
# supabase secrets set APNS_HOST="api.sandbox.push.apple.com"
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

---

## 5. Wire the database trigger to the function

The migration adds a trigger that calls `send-push` whenever a pushable
notification row is inserted. It reads two values from **Supabase Vault** so no
secret is committed to the repo. Create them once
(Dashboard → *Project Settings → Vault → New secret*), or via SQL:

```sql
select vault.create_secret(
  'https://dgkfsavtyclwkramearr.supabase.co/functions/v1/send-push',
  'edge_send_push_url'
);
select vault.create_secret(
  '<YOUR_SERVICE_ROLE_KEY>',      -- Settings → API → service_role key
  'edge_service_role_key'
);
```

Until both secrets exist the trigger is inert (it just does nothing), so
applying the migration is always safe.

**Alternative (no Vault):** delete the trigger and instead create a
*Database Webhook* in the dashboard — Table `business_notifications`, event
*Insert*, type *Supabase Edge Function → send-push*, and add an
`Authorization: Bearer <service_role_key>` header. The function accepts that
payload shape too.

---

## 6. Apply migrations

```bash
supabase db push
```

This creates `push_devices`, the `register_push_device` RPC, and the dispatch
trigger.

---

## 7. Build, run, and test

```bash
npm run cap:sync
npx cap open ios       # run on a real device (push doesn't work in the iOS simulator)
npx cap open android   # emulator or device
```

On first launch, signed in, the app asks for notification permission and stores
the device token in `push_devices`. To test end to end, trigger any alert the
signed-in user is opted into — e.g. add a special in the admin area, or send an
App Update from **Admin → App Updates** — and the phone should receive a push.
Check `select * from public.push_devices;` to confirm the token registered, and
the `send-push` function logs for delivery results.

---

## 8. Store submission (later)

- **iOS:** archive in Xcode → upload to App Store Connect → TestFlight → review.
- **Android:** `Build → Generate Signed Bundle (.aab)` → upload to Play Console.

Both stores need the usual listing assets (icon, screenshots, privacy policy —
it lives at https://hellohoedspruit.co/legal/privacy-policy).

---

## Notes & gotchas

- **iOS push requires a real device** — the simulator can't receive APNs.
- **Android 13+** shows a runtime permission prompt (already handled by the
  code). Older Android grants it automatically.
- Provide a small **monochrome notification icon** for Android
  (`android/app/src/main/res/drawable/ic_stat_*`) or it falls back to a generic
  bell.
- Dead tokens are pruned automatically: if FCM/APNs reports a token as
  unregistered, `send-push` deletes it from `push_devices`.
- The web app is unaffected — all native code is guarded behind the Capacitor
  runtime check, so `npm run build` / the Lovable site behaves exactly as before.
