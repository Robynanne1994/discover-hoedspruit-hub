// Sharing, the way a native app does it.
//
// One tap on any Share control should open the sheet the user already knows —
// the OS one, with "Copy" plus every messaging app installed on their phone.
// There are three runtimes to satisfy and they need different plumbing:
//
//   1. The iOS/Android app shell. The Android webview does NOT implement
//      navigator.share, so the web path silently degraded to a clipboard copy.
//      Here we go through @capacitor/share, which calls UIActivityViewController
//      (iOS) / Intent.ACTION_SEND (Android) — the real system sheet.
//   2. A mobile browser. navigator.share is the system sheet.
//   3. A desktop browser. Chrome and Firefox have no share sheet at all, so we
//      render our own (see ShareSheet.tsx) with copy-link and the usual targets.
//
// Every link is normalised to the public web origin first: inside the native
// webview window.location.origin is "capacitor://localhost", so sharing the raw
// href sent people a link that only resolves on the sharer's own device.
import { Share } from "@capacitor/share";
import { Clipboard } from "@capacitor/clipboard";
import { isNativeApp } from "@/lib/nativeBridge";
import { PUBLIC_ORIGIN, shareOrigin } from "@/lib/publicOrigin";

/**
 * Public origin every shared link must point at. Used whenever the runtime
 * origin is not something a recipient could open (native webview, localhost).
 *
 * Re-exported from src/lib/publicOrigin.ts, which the auth redirect builders
 * read too — one definition of "where this app actually lives".
 */
export const SHARE_ORIGIN = PUBLIC_ORIGIN;

export interface ShareContent {
  /** Headline for the share — the listing / event / profile name. */
  title: string;
  /** Optional blurb messaging apps show under the link. */
  text?: string;
  /** Absolute URL, or an app path like "/listing/123". Defaults to this page. */
  url?: string;
}

export type ShareOutcome =
  /** The system sheet opened and the user picked a target. */
  | "shared"
  /** The system sheet opened and the user backed out. Nothing more to do. */
  | "dismissed"
  /** No system sheet on this runtime — fall back to the in-app sheet. */
  | "unsupported"
  /** The system sheet errored — fall back to the in-app sheet. */
  | "failed";

/**
 * Turns whatever a caller passed into an absolute, shareable link.
 *
 * - absolute URLs are trusted as-is
 * - paths are resolved against the current origin, or SHARE_ORIGIN when the
 *   current origin is device-only (the native app, a dev server)
 * - no url at all means "share this page"
 */
export function toShareUrl(url?: string): string {
  if (url && /^https?:\/\//i.test(url)) return url;

  const loc = typeof window !== "undefined" ? window.location : null;
  const base = shareOrigin();

  if (url) return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
  return `${base}${loc?.pathname || "/"}${loc?.search || ""}`;
}

const MAX_BLURB = 160;

/**
 * Trims a listing / event description down to something a messaging app can
 * show. Descriptions come out of rich-text fields, so markup is stripped rather
 * than pasted into WhatsApp verbatim.
 */
export function shareBlurb(text?: string): string | undefined {
  if (!text) return undefined;
  const plain = text
    .replace(/<[^>]*>/g, " ")
    .replace(/[*_`#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!plain) return undefined;
  return plain.length > MAX_BLURB ? `${plain.slice(0, MAX_BLURB - 1).trimEnd()}…` : plain;
}

function normalise(content: ShareContent) {
  return {
    title: content.title.trim() || "Hello Hoedspruit",
    blurb: shareBlurb(content.text),
    url: toShareUrl(content.url),
  };
}

/** The plain-text body used for apps that take a message rather than a link. */
export function shareMessage(content: ShareContent): string {
  const { title, blurb, url } = normalise(content);
  return [title, blurb && blurb !== title ? blurb : null, url].filter(Boolean).join("\n\n");
}

// The Capacitor plugins are imported statically, NOT with a lazy import().
//
// They used to be lazy, to keep them out of the web bundle. On device that
// dynamic import never settled — it neither resolved nor rejected, so every
// caller awaiting it hung forever. That is exactly what "the share button
// does nothing" and "copy address does nothing" were: not a failing plugin
// call, a plugin call that was never reached, with no error to show for it
// and no way to fall back (the fallback only runs on a settled "failed").
// Confirmed on the simulator by logging either side of the await: the line
// before printed, the line after never did.
//
// Both plugins are small and ship web implementations, so importing them up
// front costs little and removes the whole failure mode.

/** Kept for the call site in ShareProvider; nothing to preload any more. */
export function preloadShare(): void {
  /* no-op: the plugins are statically imported */
}

/**
 * A user backing out of the sheet is not an error. The web API rejects with
 * AbortError; iOS and Android report a cancellation message through the plugin.
 */
function isDismissal(err: unknown): boolean {
  const e = err as { name?: string; message?: string } | null;
  if (e?.name === "AbortError") return true;
  const msg = (e?.message || "").toLowerCase();
  return msg.includes("cancel") || msg.includes("dismiss") || msg.includes("abort");
}

/**
 * Opens the operating system's share sheet.
 *
 * Must be called straight out of a click/tap handler: the Web Share API only
 * runs while the tap's user activation is still live, so nothing is awaited
 * before navigator.share on the browser path.
 */
export async function openSystemShareSheet(content: ShareContent): Promise<ShareOutcome> {
  const { title, blurb, url } = normalise(content);
  const text = blurb || title;

  if (isNativeApp()) {
    try {
      // `text` carries the blurb and `url` the link; iOS shows both, Android
      // concatenates them into the outgoing message.
      //
      // Deliberately NOT raced against a timeout. This promise stays pending
      // for as long as the system sheet is open — that is the user reading
      // the list and picking WhatsApp, which routinely takes longer than any
      // timeout worth setting. A race here resolved "failed" mid-decision and
      // popped the in-app fallback sheet up behind the real one.
      await Share.share({ title, text, url, dialogTitle: title });
      return "shared";
    } catch (err) {
      return isDismissal(err) ? "dismissed" : "failed";
    }
  }

  const nav = typeof navigator !== "undefined" ? navigator : null;
  if (typeof nav?.share !== "function") return "unsupported";

  const data: ShareData = { title, text, url };
  // Some browsers expose share() but refuse specific payloads.
  if (typeof nav.canShare === "function" && !nav.canShare(data)) return "unsupported";

  try {
    await nav.share(data);
    return "shared";
  } catch (err) {
    return isDismissal(err) ? "dismissed" : "failed";
  }
}

/**
 * Shares plain text through the OS sheet when available, otherwise copies it.
 * Used for address/phone-style snippets where a URL is not wanted.
 */
export async function sharePlainText(text: string): Promise<"shared" | "copied" | "failed"> {
  if (isNativeApp()) {
    try {
      await Share.share({ text, dialogTitle: text });
      return "shared";
    } catch (err) {
      if (isDismissal(err)) return "shared";
    }
  }

  const nav = typeof navigator !== "undefined" ? navigator : null;
  if (typeof nav?.share === "function") {
    try {
      const data: ShareData = { text };
      if (typeof nav.canShare === "function" && !nav.canShare(data)) {
        return (await copyToClipboard(text)) ? "copied" : "failed";
      }
      await nav.share(data);
      return "shared";
    } catch (err) {
      if (isDismissal(err)) return "shared";
    }
  }

  return (await copyToClipboard(text)) ? "copied" : "failed";
}

/**
 * Copies text. Native first — the web Clipboard API is unreliable inside
 * Capacitor's WKWebView/Android WebView (same class of problem as the .ics
 * blob download and the Share-sheet issues elsewhere in this app: browser
 * APIs that assume a real browser tab silently do nothing in an embedded
 * webview instead of throwing something catchable). @capacitor/clipboard
 * talks to the OS pasteboard directly, so it works regardless.
 */
export async function copyToClipboard(value: string): Promise<boolean> {
  if (isNativeApp()) {
    try {
      await Clipboard.write({ string: value });
      return true;
    } catch {
      // Fall through to the web path — harmless if it also fails.
    }
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Permission denied or no secure context — try the selection copy below.
  }

  try {
    const el = document.createElement("textarea");
    el.value = value;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.top = "0";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    el.setSelectionRange(0, value.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

export interface ShareTarget {
  key: string;
  label: string;
  href: string;
  /**
   * Web destinations open in a new tab / the system browser. mailto: and sms:
   * must stay in the current context or the handoff to Mail / Messages is lost.
   */
  external: boolean;
}

/** True on phones and tablets — the only places an sms: link makes sense. */
export function isTouchDevice(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

/**
 * Targets for the in-app sheet, i.e. the desktop-browser fallback. Kept to the
 * apps Hoedspruit actually shares in, rather than a wall of networks.
 */
export function shareTargets(content: ShareContent, opts?: { sms?: boolean }): ShareTarget[] {
  const { title, url } = normalise(content);
  const message = shareMessage(content);
  const e = encodeURIComponent;

  const targets: ShareTarget[] = [
    { key: "whatsapp", label: "WhatsApp", href: `https://wa.me/?text=${e(message)}`, external: true },
    {
      key: "facebook",
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${e(url)}`,
      external: true,
    },
    { key: "x", label: "X", href: `https://x.com/intent/post?text=${e(title)}&url=${e(url)}`, external: true },
    { key: "email", label: "Email", href: `mailto:?subject=${e(title)}&body=${e(message)}`, external: false },
  ];

  const sms = opts?.sms ?? isTouchDevice();
  if (sms) {
    targets.push({ key: "sms", label: "Message", href: `sms:?&body=${e(message)}`, external: false });
  }
  return targets;
}

/** Hands a target link to the browser the way that target needs. */
export function openShareTarget(target: ShareTarget): void {
  if (target.external) {
    // noopener/noreferrer keeps the opened tab away from this one; inside the
    // native webview Capacitor routes _blank out to the system browser.
    window.open(target.href, "_blank", "noopener,noreferrer");
  } else {
    window.location.href = target.href;
  }
}
