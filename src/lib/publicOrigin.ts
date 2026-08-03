// The origin a link has to carry when it is going to be opened somewhere other
// than where it was created.
//
// Inside the iOS/Android shell `window.location.origin` is "capacitor://localhost"
// (or "ionic://localhost", or "file://"). That is a private scheme belonging to
// the webview on that one handset. It is fine for in-app navigation and useless
// for anything that leaves the device.
//
// Two things leave the device, and they need slightly different answers:
//
//   * A shared link — opened by someone else, on their phone. Nothing local
//     works, so "http://localhost:5173" is just as broken as "capacitor://".
//     See src/lib/share.ts.
//   * An auth link we ask Supabase to email back to us — a password reset, a
//     signup or email-change confirmation. Here "localhost" IS meaningful: a
//     developer running the app on their own machine wants the emailed link to
//     come back to that dev server. Only the non-web schemes have to be
//     rewritten.
//
// Getting this wrong is silent and total: Supabase only redirects to URLs on
// its allow list, so a "capacitor://localhost/..." redirect is dropped and the
// confirmation link in the email falls back to the project's Site URL — which
// is why a tapped button appears to do nothing.

/**
 * The app's public web address. Every emailed or shared link resolves against
 * this when the runtime origin can't leave the device.
 *
 * Override per environment with `VITE_PUBLIC_SITE_URL`. It must be an origin
 * that is (a) actually serving the app and (b) on the Supabase
 * Authentication → URL Configuration → Redirect URLs allow list.
 */
export const PUBLIC_ORIGIN = (
  import.meta.env.VITE_PUBLIC_SITE_URL || "https://hello-hoedspruit-hub.lovable.app"
).replace(/\/+$/, "");

/** Schemes that exist only inside this one webview. Never emailable. */
const NON_WEB_SCHEME = /^(?:capacitor|ionic|file):/i;

/** Web origins that only resolve on the machine that produced them. */
const LOCAL_ORIGIN = /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i;

function currentOrigin(): string {
  return typeof window !== "undefined" ? window.location.origin || "" : "";
}

/**
 * The origin an emailed auth link should come back to.
 *
 * Rewrites the native webview's private scheme to the public site, and leaves
 * a localhost dev server alone so local testing still round-trips.
 */
export function authOrigin(): string {
  const origin = currentOrigin();
  if (!origin || NON_WEB_SCHEME.test(origin)) return PUBLIC_ORIGIN;
  return origin;
}

/** Build an absolute auth redirect URL for an in-app path ("/reset-password"). */
export function authUrl(path: string): string {
  return `${authOrigin()}${path.startsWith("/") ? "" : "/"}${path}`;
}

/**
 * The origin a link handed to another person must carry. Stricter than
 * `authOrigin()`: a dev server is no more reachable to a recipient than the
 * native scheme is.
 */
export function shareOrigin(): string {
  const origin = currentOrigin();
  if (!origin || NON_WEB_SCHEME.test(origin) || LOCAL_ORIGIN.test(origin)) {
    return PUBLIC_ORIGIN;
  }
  return origin;
}
