// Native Google / Apple sign-in for the iOS & Android app.
//
// On the web the app signs in through a browser redirect (see
// src/integrations/lovable/index.ts and Welcome.tsx). That flow is wrong inside
// a native web view: the provider page either can't hand control back to the
// app, or Google refuses the embedded user-agent outright.
//
// Here the OS does the sign-in, the same way on both platforms:
//   * Google — `@capgo/capacitor-social-login` opens the real account picker
//     and returns an OpenID Connect ID token. Same plugin, version, and
//     recipe as the Neatby app (iOSServerClientId, split nonce, the
//     Info.plist reversed-client-id URL scheme) — `^8.3.9`, installed here
//     with `--legacy-peer-deps` since its declared peer dependency
//     (`@capacitor/core >=8.0.0`) is only an npm-level advisory: the actual
//     Swift/Kotlin plugin API (`CAPPlugin`/`CAPBridgedPlugin`) is unchanged
//     since early Capacitor and compiles fine against this project's
//     Capacitor 6. Its iOS pod needs iOS 15+, hence the deployment target
//     bump in ios/App/Podfile and App.xcodeproj.
//
//     An earlier attempt pinned `^6.0.1` instead, the newest release whose
//     npm peer dependency actually matches Capacitor 6 — but its iOS
//     provider (confirmed by reading the Swift source) never forwarded a
//     nonce to Google's SDK, while the SDK embedded its own anyway, so
//     Supabase rejected every sign-in ("nonce mismatch") no matter what the
//     app sent. `8.3.9`'s iOS provider does forward it (also confirmed by
//     reading the source), which is what makes this version worth the
//     deployment-target bump.
//   * Apple  — `@capacitor-community/apple-sign-in` shows the native
//     "Sign in with Apple" sheet and returns an identity token.
// Either token goes straight to Supabase via `signInWithIdToken`, which verifies
// it with the provider and mints the same session the web flow produces.
//
// Everything is dynamically imported and guarded by `isNativeApp()`, so the web
// bundle never pulls the native plugins in and this module is inert in a
// browser.
//
// Required build-time config (Vite env — set in .env / the host's env):
//   VITE_GOOGLE_WEB_CLIENT_ID   Google OAuth *Web* client id. Used as the ID
//                               token audience on Android and as the value
//                               Supabase → Auth → Providers → Google →
//                               "Authorized Client IDs" must contain.
//   VITE_GOOGLE_IOS_CLIENT_ID   Google OAuth *iOS* client id. Its reversed form
//                               (com.googleusercontent.apps.…) also has to be a
//                               URL scheme in ios/App/App/Info.plist.
//   VITE_APPLE_SERVICES_ID      Apple *Services ID* — only used for Apple
//                               sign-in on Android/web. Native iOS uses the
//                               bundle id automatically; safe to leave unset for
//                               an iOS-only launch.
import { supabase } from "@/integrations/supabase/client";
import { isNativeApp, nativePlatform } from "@/lib/nativeBridge";
import { PUBLIC_ORIGIN } from "@/lib/publicOrigin";

const GOOGLE_WEB_CLIENT_ID = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID as string | undefined;
const GOOGLE_IOS_CLIENT_ID = import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID as string | undefined;
const APPLE_SERVICES_ID = import.meta.env.VITE_APPLE_SERVICES_ID as string | undefined;

// The iOS app's *actual* bundle id — the one registered with Apple Developer
// (and on the App Store from v1), set as `PRODUCT_BUNDLE_IDENTIFIER` in
// ios/App/App.xcodeproj. It does NOT match `appId` in capacitor.config.ts
// (that's `za.co.hellohoedspruit.app`, used for Android and for the app's
// custom URL scheme) — the two were allowed to diverge deliberately so this
// app keeps its existing Apple identity across the v1 → v2 rebuild. Native
// iOS ignores this constant (the OS signs with the real bundle id
// automatically); it only matters for the Android/web Apple-login fallback.
const APP_BUNDLE_ID = "Hello-Hoedspruit";

export type NativeAuthResult = { error: (Error & { code?: string }) | null };

/** A user backing out of the OS sheet — not something to toast about. */
export const CANCELLED = "cancelled";

let googleInit: Promise<void> | null = null;

async function ensureGoogleInitialised(): Promise<void> {
  if (googleInit) return googleInit;
  googleInit = (async () => {
    const { SocialLogin } = await import("@capgo/capacitor-social-login");
    await SocialLogin.initialize({
      google: {
        webClientId: GOOGLE_WEB_CLIENT_ID,
        iOSClientId: GOOGLE_IOS_CLIENT_ID,
        // Same value as webClientId — this is what makes the ID token's
        // audience the web client Supabase already trusts. See the note atop
        // this file.
        iOSServerClientId: GOOGLE_WEB_CLIENT_ID,
      },
    });
  })().catch((err) => {
    googleInit = null; // let the next attempt retry
    throw err;
  });
  return googleInit;
}

/** Random URL-safe string for the nonce (Google + Apple). */
function randomNonce(bytes = 32): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._";
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => alphabet[b % alphabet.length]).join("");
}

/** Hex SHA-256 — the hashed form Google/Apple want in the outgoing nonce. */
async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

function isCancellation(err: unknown): boolean {
  const e = err as { code?: string | number; message?: string; error?: string } | null;
  const text = `${e?.code ?? ""} ${e?.error ?? ""} ${e?.message ?? ""}`.toLowerCase();
  return /cancel|canceled|cancelled|closed|dismiss|1001|12501|popup_closed|user.?cancel|abort/.test(text);
}

async function signInWithGoogle(): Promise<NativeAuthResult> {
  if (!GOOGLE_WEB_CLIENT_ID) {
    throw new Error("Google sign-in isn't configured yet (VITE_GOOGLE_WEB_CLIENT_ID is not set).");
  }
  await ensureGoogleInitialised();
  const { SocialLogin } = await import("@capgo/capacitor-social-login");

  // Hand Google the *hashed* nonce; hand Supabase the *raw* one.
  const rawNonce = randomNonce();
  const hashedNonce = await sha256Hex(rawNonce);

  const result = await SocialLogin.login({
    provider: "google",
    options: {
      scopes: ["email", "profile"],
      nonce: hashedNonce,
      forcePrompt: true,
    },
  });

  const idToken = (result?.result as { idToken?: string } | undefined)?.idToken;
  if (!idToken) throw new Error("Google didn't return an ID token.");
  const { error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: idToken,
    nonce: rawNonce,
  });
  return { error: (error as Error) ?? null };
}

async function signInWithApple(): Promise<NativeAuthResult> {
  const { SignInWithApple } = await import("@capacitor-community/apple-sign-in");
  // Hand Apple the *hashed* nonce; hand Supabase the *raw* one.
  const rawNonce = randomNonce();
  const hashedNonce = await sha256Hex(rawNonce);

  const res = (await SignInWithApple.authorize({
    // clientId / redirectURI are ignored by the native iOS sheet (it uses the
    // bundle id) but the plugin's type requires them; they matter only on the
    // Android/web fallback.
    clientId: APPLE_SERVICES_ID || APP_BUNDLE_ID,
    redirectURI: `${PUBLIC_ORIGIN}/welcome`,
    scopes: "email name",
    nonce: hashedNonce,
    state: rawNonce.slice(0, 12),
  })) as { response?: { identityToken?: string } };

  const idToken = res?.response?.identityToken;
  if (!idToken) throw new Error("Apple didn't return an identity token.");
  const { error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: idToken,
    nonce: rawNonce,
  });
  return { error: (error as Error) ?? null };
}

/**
 * Sign in with Google or Apple through the operating system.
 *
 * Resolves `{ error: null }` once Supabase has a session. On failure the Error
 * carries a `code` of `"cancelled"` when the user simply dismissed the sheet,
 * so the caller can stay silent rather than showing an error.
 */
export async function nativeSignIn(provider: "google" | "apple"): Promise<NativeAuthResult> {
  if (!isNativeApp()) {
    return { error: new Error("nativeSignIn is only for the native app") };
  }
  try {
    return provider === "google" ? await signInWithGoogle() : await signInWithApple();
  } catch (err) {
    if (isCancellation(err)) {
      return { error: Object.assign(new Error("cancelled"), { code: CANCELLED }) };
    }
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/** True once the required client ids for `provider` are present in the build. */
export function nativeAuthConfigured(provider: "google" | "apple"): boolean {
  if (provider === "google") return !!GOOGLE_WEB_CLIENT_ID;
  // Native Apple on iOS needs nothing extra; Android/web also needs a Services ID.
  return nativePlatform() === "ios" || !!APPLE_SERVICES_ID;
}
