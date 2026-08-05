import { isBlankPlaceholder } from "@/lib/sanitizeListing";

export function collectContacts(
  primary: string | null | undefined,
  extras: string[] | null | undefined,
): string[] {
  const all: string[] = [];
  if (primary && primary.trim()) all.push(primary.trim());
  if (Array.isArray(extras)) {
    for (const e of extras) {
      if (e && e.trim()) all.push(e.trim());
    }
  }
  // dedupe (case-insensitive for emails, exact for numbers)
  const seen = new Set<string>();
  return all.filter((v) => {
    const k = v.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function sanitizeContactArray(arr: string[] | null | undefined): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((v) => (v || "").trim()).filter(Boolean);
}

export type WebsiteKind = "facebook" | "instagram" | "website";

/**
 * What a website field actually points at. A Facebook or Instagram page saved
 * in the website column is a social page, not a website, so it gets its own
 * icon and label instead of a globe reading "facebook.com/...".
 */
export function websiteKind(url: string | null | undefined): WebsiteKind {
  const v = (url || "").trim();
  if (/(^|[./])(facebook\.com|fb\.com|fb\.me)/i.test(v)) return "facebook";
  if (/(^|[./])(instagram\.com|instagr\.am)/i.test(v)) return "instagram";
  return "website";
}

/**
 * True only when a website value can actually be linked to. A listing with no
 * website often carries a placeholder ("-", "N/A") or a note ("coming soon")
 * instead of a blank cell, and neither should render a website row or button.
 */
export function isUsableWebsite(url: string | null | undefined): boolean {
  const v = (url || "").trim();
  if (!v || isBlankPlaceholder(v)) return false;
  if (/\s/.test(v)) return false;
  if (/^https?:\/\//i.test(v)) return /^https?:\/\/[^/]+\.[a-z]{2,}/i.test(v);
  // Bare domain, e.g. "example.co.za" or "example.com/menu".
  return /^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}(\/|\?|$)/i.test(v);
}

/**
 * The facebook / instagram columns carry the same placeholders and notes as the
 * website column, so they get the same "can this actually be linked to?" test.
 */
export const isUsableSocialLink = isUsableWebsite;

/** Href for a website value, so a bare domain doesn't become a relative link. */
export function websiteHref(url: string): string {
  const v = url.trim();
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}
