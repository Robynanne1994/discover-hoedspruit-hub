// Native Google / Apple sign-in for the iOS & Android app.
//
// On the web the app signs in through a browser redirect (see
// src/integrations/lovable/index.ts and Welcome.tsx). That flow is wrong inside
// a native web view: the provider page either can't hand control back to the
// app, or Google refuses the embedded user-agent outright.
//
// Here the OS does the sign-in:
//   * Google on Android — `@capgo/capacitor-social-login` opens the real
//     account picker and returns an OpenID Connect ID token, verified via
//     `signInWithIdToken`. Same plugin/recipe as the Neatby app
//     (iOSServerClientId, split nonce) but pinned to `^6.0.1`, not Neatby's
//     `^8.3.9`: this project is still on Capacitor 6, and every
//     `@capgo/capacitor-social-login` release from 7.x onward requires
//     Capacitor >=7/8. `6.0.1` is the last release with the same API on a
//     Capacitor-6-compatible peer dependency.
//   * Google on iOS — a real system-browser OAuth round trip instead
//     (`signInWithGoogleBrowser`, below). NOT the native account-picker SDK.
//     Confirmed on-device (2026-09-03): this plugin version's iOS provider
//     never lets the app supply a nonce, yet GoogleSignIn's iOS SDK embeds its
//     own self-generated nonce claim in the ID token regardless — Supabase then
//     rejects it ("Passed nonce and nonce in id_token should either both exist
//     or not"), because there's no way for the app to know or reproduce a
//     value it never chose. This project's Supabase instance is Lovable-managed
//     with no dashboard access to the "skip nonce checks" provider setting that
//     would otherwise paper over it, and upgrading the plugin to a version that
//     does forward the nonce means upgrading the whole app off Capacitor 6. The
//     browser round trip sidesteps the ID-token/nonce path entirely — it's the
//     same PKCE code exchange the web build already uses, just opened in an
//     in-app `SFSafariViewController`/`ASWebAuthenticationSession` (a real
//     system browser context, not an embedded webview — the thing Apple
//     actually disallows) and handed back to the app via the custom URL scheme,
//     the same way a password-reset email link already comes back in
//     (deepLinks.ts).
//   * Apple — `@capacitor-community/apple-sign-in` shows the native
//     "Sign in with Apple" sheet and returns an identity token, verified via
//     `signInWithIdToken`. Unaffected by the above: `ASAuthorizationController`
//     manages its own nonce, and this plugin does let the app supply and
//     verify it (confirmed working).
//
// Everything is dynamically imported and guarded by `isNativeApp()`, so the web
// bundle never pulls the native plugins in and this module is inert in a
// browser.
//
// Required build-time config (Vite env — set in .env / the host's env):
//   VITE_GOOGLE_WEB_CLIENT_ID   Google OAuth *Web* client id. Passed as both
//                               `webClientId` and `iOSServerClientId` — the
//                               latter is what makes the ID token's audience
//                               the web client, which is what
//                               Supabase → Auth → Providers → Google →
//                               "Authorized Client IDs" must contain. Without
//                               it the token comes back addressed to the iOS
//                               client and Supabase rejects it.
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

// Must match CUSTOM_SCHEME in src/lib/deepLinks.ts — that module owns the
// custom-scheme registration and routes every other deep link; this is the
// one path ("/auth-callback") it deliberately ignores so this module's own
// listener can consume it instead (see deepLinks.ts).
const CUSTOM_SCHEME = "za.co.hellohoedspruit.app";
const OAUTH_CALLBACK_URL = `${CUSTOM_SCHEME}://auth-callback`;

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

async function signInWithGoogleNative(): Promise<NativeAuthResult> {
  await ensureGoogleInitialised();
  const { SocialLogin } = await import("@capgo/capacitor-social-login");

  // Hand Google the *hashed* nonce; hand Supabase the *raw* one. (Android
  // only — see the file-level note for why iOS takes signInWithGoogleBrowser
  // instead.)
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

/**
 * Google sign-in via a system-browser PKCE round trip — the iOS path. See the
 * file-level note for why: the native SDK path can't be trusted to produce a
 * nonce Supabase will accept on this plugin version.
 *
 * `signInWithOAuth({ skipBrowserRedirect: true })` hands back the provider's
 * auth URL instead of navigating the page (there is no "page" to navigate,
 * this is a native app). That URL opens in `@capacitor/browser` — a real
 * system browser context — and Google/Supabase eventually redirect to
 * `OAUTH_CALLBACK_URL`, which the OS hands back to the app as an
 * `appUrlOpen` event (the same mechanism a password-reset email link arrives
 * through). Whichever happens first — the callback lands, or the user closes
 * the browser without finishing — resolves this promise exactly once.
 */
async function signInWithGoogleBrowser(): Promise<NativeAuthResult> {
  const [{ Browser }, { App }] = await Promise.all([
    import("@capacitor/browser"),
    import("@capacitor/app"),
  ]);

  const { data, error: urlError } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: OAUTH_CALLBACK_URL, skipBrowserRedirect: true },
  });
  if (urlError) throw urlError;
  if (!data?.url) throw new Error("Could not start Google sign-in.");

  return new Promise<NativeAuthResult>((resolve) => {
    let settled = false;

    const finish = (result: NativeAuthResult) => {
      if (settled) return;
      settled = true;
      urlOpenHandle.then((h) => h.remove()).catch(() => {});
      browserFinishedHandle.then((h) => h.remove()).catch(() => {});
      void Browser.close().catch(() => {});
      resolve(result);
    };

    const urlOpenHandle = App.addListener("appUrlOpen", (event) => {
      if (!event.url.startsWith(OAUTH_CALLBACK_URL)) return;
      // exchangeCodeForSession wants the bare auth code, not the callback URL.
      const code = new URL(event.url).searchParams.get("code");
      if (!code) {
        const err = new URL(event.url).searchParams.get("error_description");
        finish({ error: new Error(err || "Google sign-in didn't return an auth code.") });
        return;
      }
      supabase.auth
        .exchangeCodeForSession(code)
        .then(({ error }) => finish({ error: (error as Error) ?? null }))
        .catch((err) => finish({ error: err instanceof Error ? err : new Error(String(err)) }));
    });

    // The user backed out of the browser without completing sign-in — not an
    // error, `isCancellation` reads this "cancelled" code the same as the
    // native-sheet dismissals below.
    const browserFinishedHandle = Browser.addListener("browserFinished", () => {
      finish({ error: Object.assign(new Error("cancelled"), { code: CANCELLED }) });
    });

    Browser.open({ url: data.url, windowName: "_self" }).catch((err) =>
      finish({ error: err instanceof Error ? err : new Error(String(err)) }),
    );
  });
}

async function signInWithGoogle(): Promise<NativeAuthResult> {
  // The Android native picker needs the client ids up front; the iOS browser
  // round trip is just an OAuth redirect (same as the web build) and needs
  // none of them — Supabase's own Google provider config covers it.
  if (nativePlatform() === "ios") return signInWithGoogleBrowser();
  if (!GOOGLE_WEB_CLIENT_ID) {
    throw new Error("Google sign-in isn't configured yet (VITE_GOOGLE_WEB_CLIENT_ID is not set).");
  }
  return signInWithGoogleNative();
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
  if (provider === "google") {
    // iOS goes through the browser/PKCE path, which needs no client id here —
    // just Supabase's own Google provider config. Android's native picker
    // does need one.
    return nativePlatform() === "ios" || !!GOOGLE_WEB_CLIENT_ID;
  }
  // Native Apple on iOS needs nothing extra; Android/web also needs a Services ID.
  return nativePlatform() === "ios" || !!APPLE_SERVICES_ID;
}
