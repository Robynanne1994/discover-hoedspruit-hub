// The one-tap link in the "confirm your new email" email.
//
// Changing your email is confirmed with a six-digit code (src/lib/
// emailVerification.ts) — that is the path the app drives, and the only one
// that survives a mail client which strips or disables links. But Supabase
// always puts a confirmation link in the email as well, and some templates
// (including the provider default) offer nothing else. Without this module a
// tapped link lands on the homepage with the credentials sitting unused in the
// URL, which reads as "the button did nothing".
//
// So: read the link the app was opened with, send the user to Account Info,
// and redeem it there.
import { supabase } from "@/integrations/supabase/client";
import { authUrl } from "@/lib/publicOrigin";

/** Where an email-change confirmation link should land. */
export const EMAIL_CHANGE_PATH = "/account-settings/info";

/**
 * Snapshot of the URL the app was opened with.
 *
 * Same reason as src/lib/passwordReset.ts: the Supabase client strips auth
 * credentials out of the address bar as soon as it has swapped them for a
 * session, and it does that asynchronously. Capturing the URL at
 * module-evaluation time — synchronously, before any promise callback runs —
 * means a perfectly good link never looks like "no link at all".
 */
const initialUrl =
  typeof window === "undefined"
    ? null
    : {
        search: window.location.search,
        hash: window.location.hash,
        pathname: window.location.pathname,
      };

/** What kind of email-change credentials (if any) the app was opened with. */
export type EmailChangeLink =
  /** Not opened from an email-change link. */
  | { kind: "none" }
  /** The link was expired, already used, or otherwise rejected by Supabase. */
  | { kind: "expired" }
  /** Tokens arrived in the URL hash; the Supabase client redeems them itself. */
  | { kind: "implicit" }
  /** PKCE flow: an authorization code to exchange for a session. */
  | { kind: "code"; code: string }
  /** Newer email templates: a token hash to verify as an email_change OTP. */
  | { kind: "tokenHash"; tokenHash: string };

const EMAIL_CHANGE_URL_PARAMS = [
  "code",
  "token_hash",
  "token",
  "type",
  "error",
  "error_code",
  "error_description",
];

/**
 * Work out which flavour of email-change link (if any) these URL parts
 * represent. Exported for tests; app code should use `readEmailChangeLink()`.
 *
 * Everything here is gated on `type=email_change` — the app also reads
 * recovery links out of the URL (src/lib/passwordReset.ts), and the two must
 * never claim each other's credentials.
 */
export function parseEmailChangeUrl(
  search: string,
  hash: string,
  pathname = "",
): EmailChangeLink {
  const query = new URLSearchParams(search.replace(/^\?/, ""));
  // Supabase uses the hash for the implicit flow and the query string for PKCE,
  // and reports failures ("this link has expired") in whichever it is using.
  const fragment = new URLSearchParams(hash.replace(/^#/, ""));
  const param = (name: string) => query.get(name) ?? fragment.get(name);

  const type = param("type");
  // Supabase writes `email_change` on both halves of a double-confirmation
  // change; older projects have been seen sending `email_change_current` and
  // `email_change_new`, so match the prefix rather than the exact string.
  //
  // The PKCE flow says nothing at all — it comes back as a bare `?code=`, the
  // same shape a password reset comes back as. Where it landed is then the only
  // thing that distinguishes them, and only an email-change link lands here.
  if (type ? !type.startsWith("email_change") : pathname !== EMAIL_CHANGE_PATH) {
    return { kind: "none" };
  }
  if (!type && !param("code") && !param("token_hash") && !param("error_code")) {
    // On the Account Info screen with nothing in the URL: just a normal visit.
    return { kind: "none" };
  }

  // A rejected link comes back as error params ("otp_expired") rather than
  // tokens.
  if (param("error_code") || param("error")) return { kind: "expired" };

  const tokenHash = param("token_hash");
  if (tokenHash) return { kind: "tokenHash", tokenHash };

  const code = param("code");
  if (code) return { kind: "code", code };

  // `type=email_change` with tokens in the hash: the Supabase client picks
  // those up itself, and the address has already moved by the time we look.
  return { kind: "implicit" };
}

let cachedLink: EmailChangeLink | null = null;

/**
 * An email-change link that reached the app as a native deep link rather than
 * in the address bar. Same reasoning as src/lib/passwordReset.ts: inside the
 * app shell the web view's URL is `capacitor://localhost/`, and the emailed
 * link's credentials arrive through `@capacitor/app` (see src/lib/deepLinks.ts).
 * Takes precedence over the start-up snapshot.
 */
let deepLinkUrl: { search: string; hash: string; pathname: string } | null = null;

/**
 * Feed a native deep link to the email-change flow. Returns true when the URL
 * really carried email-change credentials (so the caller can route to Account
 * Info to redeem it).
 */
export function ingestEmailChangeDeepLink(rawUrl: string): boolean {
  try {
    const u = new URL(rawUrl);
    const parsed = parseEmailChangeUrl(u.search, u.hash, u.pathname);
    if (parsed.kind === "none") return false;
    deepLinkUrl = { search: u.search, hash: u.hash, pathname: u.pathname };
    cachedLink = null;
    return true;
  } catch {
    return false;
  }
}

/**
 * The email-change link this page load started with. Memoised, so it keeps
 * answering truthfully after the Supabase client (or `clearEmailChangeParams()`)
 * has tidied the address bar, and stays consistent across re-mounts.
 */
export function readEmailChangeLink(): EmailChangeLink {
  if (!cachedLink) {
    const source = deepLinkUrl ?? initialUrl;
    cachedLink = source
      ? parseEmailChangeUrl(source.search, source.hash, source.pathname)
      : { kind: "none" };
  }
  return cachedLink;
}

/** True when this page load came from an emailed email-change link. */
export function hasEmailChangeLink(): boolean {
  return readEmailChangeLink().kind !== "none";
}

/**
 * Forget the link once it has been used, so re-opening Account Info later in
 * the same page load doesn't try to redeem it a second time (and report the
 * now-spent link as expired).
 */
export function forgetEmailChangeLink(): void {
  cachedLink = { kind: "none" };
  deepLinkUrl = null;
}

/** Take the confirmation parameters out of the address bar without reloading. */
export function clearEmailChangeParams(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  const hadHash = /access_token|refresh_token|type=email_change|error/.test(url.hash);
  EMAIL_CHANGE_URL_PARAMS.forEach((name) => url.searchParams.delete(name));
  if (hadHash) url.hash = "";
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

/**
 * The `redirectTo` the emailed link should come back to.
 *
 * Built from `authOrigin()`, not `window.location.origin`: inside the app shell
 * the latter is "capacitor://localhost", which is not on Supabase's redirect
 * allow list and could not be opened from an inbox even if it were.
 */
export function buildEmailChangeRedirectUrl(): string {
  return authUrl(EMAIL_CHANGE_PATH);
}

/** Turn a Supabase error from redeeming the link into readable copy. */
export function friendlyEmailChangeLinkError(message?: string | null): string {
  const text = message ?? "";
  if (/expired/i.test(text)) {
    return "That confirmation link has expired. Enter the code from the email instead, or ask for a new one.";
  }
  if (/invalid|not found|already/i.test(text)) {
    return "That confirmation link has already been used or is no longer valid. Enter the code from the email instead.";
  }
  return "We couldn't confirm your new email from that link. Enter the code from the email instead.";
}

/**
 * Wait for the Supabase client to finish swapping the hash tokens for a
 * session.
 *
 * The implicit flow needs nothing redeemed — the client reads the tokens out
 * of `window.location` when it is constructed — but that exchange is async, and
 * it can still be in flight when the screen asks who the user now is. Without
 * this the answer comes back as the *old* address, and the screen reports the
 * change as not having happened.
 */
async function waitForImplicitSession(attempts = 8, intervalMs = 250): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    const { data } = await supabase.auth.getSession();
    if (data.session) return;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

/**
 * Redeem the credentials from the link, completing the email change.
 *
 * Resolves to an error string when the link can't be redeemed, or null once
 * the account has moved to the new address.
 */
export async function redeemEmailChangeLink(link: EmailChangeLink): Promise<string | null> {
  try {
    if (link.kind === "expired") {
      return friendlyEmailChangeLinkError("expired");
    }
    if (link.kind === "code") {
      const { error } = await supabase.auth.exchangeCodeForSession(link.code);
      return error ? friendlyEmailChangeLinkError(error.message) : null;
    }
    if (link.kind === "tokenHash") {
      const { error } = await supabase.auth.verifyOtp({
        type: "email_change",
        token_hash: link.tokenHash,
      });
      return error ? friendlyEmailChangeLinkError(error.message) : null;
    }
    if (link.kind === "implicit") {
      await waitForImplicitSession();
    }
    return null;
  } catch (err) {
    return friendlyEmailChangeLinkError((err as Error)?.message);
  }
}
