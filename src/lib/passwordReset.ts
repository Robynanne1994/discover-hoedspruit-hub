// The "forgot password" flow: sending a reset link, and reading the link back
// when the user opens it from their inbox.
//
// A reset link is good for RESET_LINK_TTL_MINUTES minutes. Two things enforce
// that window:
//   1. Supabase's own emailed-link expiry (supabase/config.toml -> otp_expiry,
//      mirrored in the dashboard under Authentication -> Email).
//   2. This module: every link we send carries the time it was issued in the
//      `issued` query param, and the reset screen refuses anything older.
// The app-side check means the window is always honoured — and can be explained
// to the user with a countdown — no matter what the provider-side expiry is set
// to.
import { supabase } from "@/integrations/supabase/client";
import { authUrl } from "@/lib/publicOrigin";

/** How long an emailed reset link stays usable. */
export const RESET_LINK_TTL_MINUTES = 15;
export const RESET_LINK_TTL_MS = RESET_LINK_TTL_MINUTES * 60 * 1000;

/**
 * Supabase only sends one auth email per address per minute, so the resend
 * buttons count down for the same period rather than failing the request.
 */
export const RESEND_COOLDOWN_SECONDS = 60;

/** Where the emailed link lands. */
export const RESET_PASSWORD_PATH = "/reset-password";

/**
 * Snapshot of the URL the app was opened with.
 *
 * Supabase delivers the recovery credentials in the URL and its client strips
 * them from the address bar as soon as it has swapped them for a session. That
 * happens asynchronously, so the URL is captured here at module-evaluation time
 * — synchronously, before any promise callback can run — and everything below
 * reads the snapshot instead of `window.location`. Without this, a perfectly
 * good link can look like "no credentials at all" to the reset screen and get
 * rejected.
 */
const initialUrl =
  typeof window === "undefined"
    ? null
    : {
        search: window.location.search,
        hash: window.location.hash,
        pathname: window.location.pathname,
      };

/** What kind of recovery credentials (if any) the app was opened with. */
export type RecoveryLink =
  /** Not opened from a reset link. */
  | { kind: "none" }
  /** The link was expired, already used, or otherwise rejected by Supabase. */
  | { kind: "expired" }
  /** Tokens arrived in the URL hash; the Supabase client redeems them itself. */
  | { kind: "implicit" }
  /** PKCE flow: an authorization code to exchange for a session. */
  | { kind: "code"; code: string }
  /** Newer email templates: a token hash to verify as a recovery OTP. */
  | { kind: "tokenHash"; tokenHash: string };

export type RecoveryLinkInfo = {
  link: RecoveryLink;
  /** When the link was emailed (epoch ms), or null if the link predates this. */
  issuedAt: number | null;
};

const RECOVERY_URL_PARAMS = [
  "issued",
  "code",
  "token_hash",
  "token",
  "type",
  "error",
  "error_code",
  "error_description",
];

/**
 * Work out which flavour of recovery link (if any) these URL parts represent.
 * Exported for tests; app code should use `readRecoveryLink()`.
 *
 * `pathname` is what the app was opened at. It matters because credentials in
 * a URL don't always say what they are for: the PKCE flow comes back as a bare
 * `?code=`, identical whether it started life as a password reset or as an
 * email confirmation. The path is the tie-breaker — our reset links land on
 * RESET_PASSWORD_PATH and nothing else does.
 *
 * THIS IS WHERE "the button in the email opened the password reset screen"
 * CAME FROM. Every shape was claimed as a recovery link regardless of what it
 * said it was, so a `type=email_change` confirmation was read as a reset,
 * App.tsx redirected to the reset screen, and the email change it was supposed
 * to complete sat unconfirmed with the app still waiting for its code.
 */
export function parseRecoveryUrl(
  search: string,
  hash: string,
  pathname = "",
): RecoveryLinkInfo {
  const query = new URLSearchParams(search.replace(/^\?/, ""));
  // Supabase uses the hash for the implicit flow and the query string for PKCE,
  // and reports failures ("this link has expired") in whichever it is using.
  const fragment = new URLSearchParams(hash.replace(/^#/, ""));
  const param = (name: string) => query.get(name) ?? fragment.get(name);

  const issuedRaw = param("issued");
  const issuedNum = issuedRaw === null ? NaN : Number(issuedRaw);
  const issuedAt = Number.isFinite(issuedNum) && issuedNum > 0 ? issuedNum : null;

  const type = param("type");
  // Something that names another flow is emphatically not ours, whatever else
  // it carries.
  if (type && !type.startsWith("recovery")) {
    return { link: { kind: "none" }, issuedAt };
  }

  // Positive evidence that these credentials belong to a password reset: the
  // link says so, it carries the `issued` stamp buildResetRedirectUrl() adds to
  // every reset link we send, or it landed on the reset screen.
  const onResetPath = pathname === RESET_PASSWORD_PATH;
  const isRecovery = !!type || issuedRaw !== null || onResetPath;
  if (!isRecovery) return { link: { kind: "none" }, issuedAt };

  // Supabase reports a rejected link as error params ("otp_expired") rather than
  // tokens. `error_code` is specific enough to act on; a bare `error` param only
  // counts when the URL also looks like a reset link, so an unrelated `?error=`
  // elsewhere in the app is never mistaken for one.
  const isAuthError =
    !!param("error_code") || (!!param("error") && (issuedRaw !== null || !!type));
  if (isAuthError) {
    return { link: { kind: "expired" }, issuedAt };
  }

  const tokenHash = param("token_hash");
  if (tokenHash) return { link: { kind: "tokenHash", tokenHash }, issuedAt };

  const code = param("code");
  if (code) return { link: { kind: "code", code }, issuedAt };

  if (fragment.has("access_token") || type) {
    return { link: { kind: "implicit" }, issuedAt };
  }

  return { link: { kind: "none" }, issuedAt };
}

let cachedLink: RecoveryLinkInfo | null = null;

/**
 * A reset link that reached the app as a native deep link rather than in the
 * address bar.
 *
 * Inside the iOS/Android shell the URL the web view loads is
 * `capacitor://localhost/` — the emailed link's credentials arrive separately,
 * through `@capacitor/app`'s `appUrlOpen` (see src/lib/deepLinks.ts). This holds
 * that URL's parts so `readRecoveryLink()` can see them; it takes precedence
 * over the start-up snapshot, which on native is always empty.
 */
let deepLinkUrl: { search: string; hash: string; pathname: string } | null = null;

/**
 * Feed a native deep link to the reset flow. Returns true when the URL really
 * carried recovery credentials (so the caller can route to the reset screen).
 */
export function ingestRecoveryDeepLink(rawUrl: string): boolean {
  try {
    const u = new URL(rawUrl);
    const parsed = parseRecoveryUrl(u.search, u.hash, u.pathname);
    if (parsed.link.kind === "none") return false;
    deepLinkUrl = { search: u.search, hash: u.hash, pathname: u.pathname };
    cachedLink = null;
    return true;
  } catch {
    return false;
  }
}

/**
 * The recovery link this page load started with. Memoised, so it keeps
 * answering truthfully after the Supabase client (or `clearRecoveryParams()`)
 * has tidied the address bar, and stays consistent across re-mounts.
 */
export function readRecoveryLink(): RecoveryLinkInfo {
  if (!cachedLink) {
    const source = deepLinkUrl ?? initialUrl;
    cachedLink = source
      ? parseRecoveryUrl(source.search, source.hash, source.pathname)
      : { link: { kind: "none" }, issuedAt: null };
  }
  return cachedLink;
}

/** True when this page load came from an emailed reset link. */
export function hasRecoveryLink(): boolean {
  return readRecoveryLink().link.kind !== "none";
}

/**
 * Forget the link once it has been used, so returning to the reset screen later
 * in the same page load starts from scratch instead of re-opening the form.
 */
export function forgetRecoveryLink(): void {
  cachedLink = { link: { kind: "none" }, issuedAt: null };
  deepLinkUrl = null;
}

/** Take the reset parameters out of the address bar without reloading. */
export function clearRecoveryParams(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  const hadHash = /access_token|refresh_token|type=recovery|error/.test(url.hash);
  RECOVERY_URL_PARAMS.forEach((name) => url.searchParams.delete(name));
  if (hadHash) url.hash = "";
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

/** Has the 15-minute window closed on a link issued at `issuedAt`? */
export function isResetLinkExpired(issuedAt: number | null, now = Date.now()): boolean {
  if (issuedAt === null) return false;
  return now - issuedAt > RESET_LINK_TTL_MS;
}

/**
 * Milliseconds left before a link stops working, clamped to the full window so
 * a device clock that runs behind the server can't show a nonsense countdown.
 * Returns null when the link carries no issue time (nothing to count down).
 */
export function resetLinkRemainingMs(issuedAt: number | null, now = Date.now()): number | null {
  if (issuedAt === null) return null;
  const remaining = issuedAt + RESET_LINK_TTL_MS - now;
  return Math.max(0, Math.min(RESET_LINK_TTL_MS, remaining));
}

/** "14:03" — a countdown for the reset screen. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * The `redirectTo` the emailed link should come back to, stamped with now.
 *
 * `authOrigin()` rather than `window.location.origin`: asking for a reset from
 * inside the app shell would otherwise send Supabase a "capacitor://localhost"
 * redirect, which is not on the allow list and which no inbox can open.
 */
export function buildResetRedirectUrl(now = Date.now()): string {
  return `${authUrl(RESET_PASSWORD_PATH)}?issued=${now}`;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Turn a Supabase auth error into something worth showing a person. */
export function friendlyResetError(message?: string | null): string {
  const text = message ?? "";
  if (/rate|frequency|too many|seconds|429/i.test(text)) {
    return `For security we only send one reset email a minute. Please wait a moment and try again.`;
  }
  if (/invalid.*email|email.*invalid/i.test(text)) {
    return "Please enter a valid email address.";
  }
  if (/network|fetch|offline|timeout/i.test(text)) {
    return "We couldn't reach the server. Check your connection and try again.";
  }
  return text || "Could not send the reset link. Please try again.";
}

/**
 * Email a password reset link.
 *
 * Deliberately says nothing about whether the address has an account — the
 * caller shows the same "if an account exists…" confirmation either way, so the
 * screen can't be used to find out who is registered.
 */
export async function sendPasswordResetEmail(email: string): Promise<{ error: string | null }> {
  const trimmed = email.trim();
  if (!trimmed) return { error: "Please enter your email address." };
  if (!EMAIL_PATTERN.test(trimmed)) return { error: "Please enter a valid email address." };

  const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
    redirectTo: buildResetRedirectUrl(),
  });
  if (error) return { error: friendlyResetError(error.message) };
  return { error: null };
}

/**
 * Redeem the credentials from the link, so the user can set a new password.
 *
 * The implicit flow needs nothing from us: the Supabase client picks the tokens
 * out of the URL hash on start-up. The other two shapes have to be exchanged
 * explicitly. Resolves to an error string when the link can't be redeemed.
 */
export async function redeemRecoveryLink(link: RecoveryLink): Promise<string | null> {
  try {
    if (link.kind === "code") {
      const { error } = await supabase.auth.exchangeCodeForSession(link.code);
      return error ? error.message : null;
    }
    if (link.kind === "tokenHash") {
      const { error } = await supabase.auth.verifyOtp({
        type: "recovery",
        token_hash: link.tokenHash,
      });
      return error ? error.message : null;
    }
    return null;
  } catch (err) {
    return (err as Error)?.message ?? "Could not verify this reset link.";
  }
}

/**
 * Drop the recovery session granted by a link we are refusing (an expired one).
 * Without this, a link Supabase still considers valid would leave the visitor
 * signed in past our own 15-minute window.
 */
export async function endRecoverySession(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {
    /* nothing useful to do if the sign-out itself fails */
  }
}
