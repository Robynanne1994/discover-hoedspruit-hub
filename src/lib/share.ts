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
import { isNativeApp } from "@/lib/nativeBridge";

/**
 * Public origin every shared link must point at. Used whenever the runtime
 * origin is not something a recipient could open (native webview, localhost).
 */
export const SHARE_ORIGIN = "https://hello-hoedspruit-hub.lovable.app";

/** Origins that only exist on the sharer's own device. */
const DEVICE_ONLY_ORIGIN =
  /^(?:capacitor|ionic|file):|^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i;

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
  const origin = loc?.origin || "";
  const base = !origin || DEVICE_ONLY_ORIGIN.test(origin) ? SHARE_ORIGIN : origin;

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

type NativeSharePlugin = typeof import("@capacitor/share").Share;

// The native plugin is loaded once, lazily, and only on a device. Keeping the
// promise means the second tap never waits on the import again.
let sharePlugin: Promise<NativeSharePlugin | null> | null = null;

function loadNativeShare(): Promise<NativeSharePlugin | null> {
  if (!sharePlugin) {
    sharePlugin = import("@capacitor/share")
      .then((mod) => mod.Share ?? null)
      .catch(() => null);
  }
  return sharePlugin;
}

/**
 * Warms the native plugin at start-up so the first Share tap opens the OS sheet
 * immediately instead of stalling on a chunk fetch. No-op in the browser.
 */
export function preloadShare(): void {
  if (isNativeApp()) void loadNativeShare();
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
    const Share = await loadNativeShare();
    if (!Share) return "unsupported";
    try {
      // `text` carries the blurb and `url` the link; iOS shows both, Android
      // concatenates them into the outgoing message.
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

/** Copies text, with a legacy path for webviews and insecure contexts. */
export async function copyToClipboard(value: string): Promise<boolean> {
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
