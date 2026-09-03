// Turning a link tapped outside the app into a screen inside it.
//
// Three kinds of link have to land in the right place:
//
//   1. A shared link — `https://hellohoedspruit.co/events/<id>`. If the app is
//      installed the OS hands it to us (iOS Universal Links / Android App
//      Links) instead of opening a browser; we route it to `/events/<id>`.
//   2. A password-reset or email-change link from an account email. Same https
//      host, but it carries `?code=` / `?token_hash=` / a recovery hash. Those
//      have to reach the existing reset / email-change machinery, which reads
//      the URL it was *opened* with — and inside the app shell that URL is
//      `capacitor://localhost/`, not the link. So the raw link is handed to
//      `ingestRecoveryDeepLink()` / `ingestEmailChangeDeepLink()` first.
//   3. The custom-scheme fallback `za.co.hellohoedspruit.app://<path>`, for
//      environments where the https association isn't verified.
//
// Native-only: `initDeepLinks()` returns immediately in a browser.
import { App } from "@capacitor/app";
import { isNativeApp } from "@/lib/nativeBridge";
import { PUBLIC_ORIGIN } from "@/lib/publicOrigin";
import { RESET_PASSWORD_PATH, ingestRecoveryDeepLink } from "@/lib/passwordReset";
import { EMAIL_CHANGE_PATH, ingestEmailChangeDeepLink } from "@/lib/emailChangeLink";

/** The bundle id, also registered as a private URL scheme (Info.plist / manifest). */
const CUSTOM_SCHEME = "za.co.hellohoedspruit.app";

/** https hosts whose links belong to this app. */
const APP_HOSTS = new Set(
  [
    "hellohoedspruit.co",
    "www.hellohoedspruit.co",
    hostOf(PUBLIC_ORIGIN),
    // Pre-domain testing on the Lovable-hosted build.
    "hello-hoedspruit-hub.lovable.app",
  ].filter((h): h is string => !!h),
);

function hostOf(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

/**
 * The in-app path a link maps to, or null when the link isn't ours.
 *
 * Exported for tests.
 */
export function deepLinkToPath(rawUrl: string): string | null {
  let u: URL;
  try {
    u = new URL(rawUrl);
  } catch {
    return null;
  }

  if (u.protocol === `${CUSTOM_SCHEME}:`) {
    // za.co.hellohoedspruit.app://events/123 → host is "events", pathname "/123"
    const path = `/${u.host}${u.pathname}`.replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/";
    return `${path}${u.search}${u.hash}`;
  }

  if ((u.protocol === "https:" || u.protocol === "http:") && APP_HOSTS.has(u.host)) {
    return `${u.pathname || "/"}${u.search}${u.hash}`;
  }

  return null;
}

function route(navigate: (path: string) => void, rawUrl: string | undefined | null): void {
  if (!rawUrl) return;
  const path = deepLinkToPath(rawUrl);
  if (!path) return;

  // Account-email links have to be redeemed by their own screens; hand them the
  // raw URL, then send the user there.
  if (ingestRecoveryDeepLink(rawUrl)) {
    navigate(RESET_PASSWORD_PATH);
    return;
  }
  if (ingestEmailChangeDeepLink(rawUrl)) {
    navigate(EMAIL_CHANGE_PATH);
    return;
  }

  navigate(path);
}

/**
 * Start listening for links. Handles the link the app was cold-started from
 * (`getLaunchUrl`) and every link that arrives while it's running
 * (`appUrlOpen`). Returns a cleanup function.
 */
export function initDeepLinks(navigate: (path: string) => void): () => void {
  if (!isNativeApp()) return () => {};

  let disposed = false;

  App.getLaunchUrl()
    .then((res) => {
      if (!disposed) route(navigate, res?.url);
    })
    .catch(() => {
      /* no launch URL — normal start */
    });

  const handlePromise = App.addListener("appUrlOpen", (event) => {
    route(navigate, event.url);
  });

  return () => {
    disposed = true;
    handlePromise.then((handle) => handle.remove()).catch(() => {});
  };
}
