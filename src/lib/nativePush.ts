// Native push notifications (iOS/Android via Capacitor).
//
// This module is a no-op on the web build: everything is guarded by a runtime
// check for the Capacitor native bridge and loaded with dynamic imports, so the
// web app never pulls the native plugin into its critical path and never runs
// this code in a browser.
//
// On a native device it:
//   1. asks the OS for notification permission,
//   2. registers with FCM (Android) / APNs (iOS) and stores the device token
//      in Supabase via the register_push_device RPC,
//   3. deep-links to the tapped notification's target screen.
import { supabase } from "@/integrations/supabase/client";
import { isNativeApp, nativePlatform as currentPlatform } from "@/lib/nativeBridge";

type NavigateFn = (path: string) => void;

let initialised = false;

// The last token APNs/FCM handed us, kept so it can be saved once a session
// exists. The OS fires "registration" once per launch, and on a cold start it
// usually wins the race against Supabase restoring the session from storage —
// so the very first save attempt often has no user to attach the token to.
// Without this the token was simply dropped and never saved at all.
let lastToken: string | null = null;

export async function initNativePush(navigate: NavigateFn): Promise<void> {
  if (initialised || !isNativeApp()) return;
  initialised = true;

  try {
    // @ts-ignore native-only dependency, present in the mobile build
    const { PushNotifications } = await import("@capacitor/push-notifications");

    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== "granted") {
      initialised = false;
      return;
    }

    // Fired once registration with APNs/FCM succeeds, and again if the token
    // rotates — persist every value we receive.
    await PushNotifications.addListener("registration", (token) => {
      void saveToken(token.value);
    });

    await PushNotifications.addListener("registrationError", (err) => {
      console.warn("[nativePush] registration error", err);
    });

    // User tapped the notification (app was backgrounded / closed) -> deep link.
    await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      const link = (action?.notification?.data as any)?.link;
      if (link) navigate(String(link));
    });

    await PushNotifications.register();
  } catch (err) {
    console.warn("[nativePush] init failed", err);
    initialised = false;
  }
}

async function saveToken(token: string): Promise<void> {
  if (!token) return;
  lastToken = token;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      // Not signed in yet — keep the token; savePendingPushToken() retries
      // this as soon as a session appears (see useAuth.tsx).
      console.warn("[nativePush] token held, no session yet");
      return;
    }
    // RPC is SECURITY DEFINER so it upserts cleanly even when a device switches
    // between accounts on a shared phone.
    await supabase.rpc("register_push_device" as any, {
      _token: token,
      _platform: currentPlatform(),
    } as any);
  } catch (err) {
    console.warn("[nativePush] saveToken failed", err);
  }
}

/**
 * Save the token the OS already gave us, now that somebody is signed in.
 *
 * Called on every sign-in, because the token almost always arrives before the
 * session does on a cold start. Safe to call repeatedly — the RPC upserts on
 * the token, so re-saving the same one just refreshes `last_seen` (and moves
 * the row to the new user when accounts switch on a shared phone).
 */
export async function savePendingPushToken(): Promise<void> {
  if (!isNativeApp() || !lastToken) return;
  await saveToken(lastToken);
}

// Call on sign-out so a shared device stops receiving the previous user's pushes.
export async function unregisterNativePush(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    // @ts-ignore native-only dependency, present in the mobile build
    const { PushNotifications } = await import("@capacitor/push-notifications");
    await PushNotifications.removeAllListeners();
    initialised = false;
  } catch {
    /* ignore */
  }
}
