// Specials keep several links in their existing columns, pipe-separated and
// aligned by position: "link 1|link 2" with "label 1|label 2". A "-" or blank
// label slot means no label. CSV cells copy the columns verbatim.
import { parseSocials, serializeSocials, type SocialPair } from "./eventSocials";
import { socialPlatform, type SocialPlatform } from "./specialSocialLink";
import { resolveBookingLinkType } from "./bookingLink";

export type LinkPair = SocialPair;
export const parseLinkPairs = parseSocials;
export const serializeLinkPairs = serializeSocials;

export interface BookingEntry { type: string; link: string; label: string }

export function parseBookings(type?: string | null, link?: string | null, label?: string | null): BookingEntry[] {
  const links = (link || "").split("|");
  const types = (type || "").split("|");
  const labels = (label || "").split("|");
  return links.map((l, i) => {
    const t = (types[i] || "").trim();
    const lb = (labels[i] || "").trim();
    return { link: l.trim(), type: t === "-" ? "" : t, label: lb === "-" ? "" : lb };
  });
}

export function serializeBookings(entries: BookingEntry[]): { type: string; link: string; label: string } {
  const kept = entries.filter((e) => e.link.trim());
  const join = (vals: string[]) => (vals.some(Boolean) ? vals.map((v) => v || "-").join("|") : "");
  return {
    link: kept.map((e) => e.link.trim()).join("|"),
    type: join(kept.map((e) => (e.type.trim() ? resolveBookingLinkType(e.link, e.type) : ""))),
    label: join(kept.map((e) => e.label.trim())),
  };
}

function safeWebHref(link: string): string | null {
  try {
    const url = new URL(/^https?:\/\//i.test(link) ? link : `https://${link}`);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname.includes(".") || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

/** Labelled web links only: the raw address is never displayed. */
export function labelledWebLinks(link?: string | null, label?: string | null): { href: string; label: string; platform: SocialPlatform }[] {
  return parseLinkPairs(link, label).flatMap((p) => {
    const href = p.link && p.label ? safeWebHref(p.link) : null;
    return href ? [{ href, label: p.label, platform: socialPlatform(href, p.label) }] : [];
  });
}

/** A special is "done" only when an ongoing deal was explicitly marked so. */
export function parseDoneCell(cell?: string | null): boolean {
  return /^(true|1|yes|done)$/i.test((cell || "").trim());
}
