export interface SpecialSocialFields {
  social_media_link?: string | null;
  social_media_label?: string | null;
}

export type SocialPlatform = "facebook" | "instagram" | "other";

// Only publish labelled web links, never a raw URL or an executable scheme.
export function specialSocialLink(special: SpecialSocialFields): { href: string; label: string; platform: SocialPlatform } | null {
  const link = special.social_media_link?.trim();
  const label = special.social_media_label?.trim();
  if (!link || !label) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(link) ? link : `https://${link}`);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname.includes('.') || url.username || url.password) return null;
    return { href: url.href, label, platform: socialPlatform(url.href, label) };
  } catch {
    return null;
  }
}

/**
 * Which network a social link belongs to, so the row can carry the matching
 * mark. The saved address decides first; a bare "facebook.com/..." and a label
 * reading "Facebook Post" both count, so a link saved without a scheme still
 * gets its icon.
 */
export function socialPlatform(href: string | null | undefined, label?: string | null): SocialPlatform {
  const target = `${href || ""} ${label || ""}`;
  if (/(^|[./\s-])(facebook|fb)(\.com|\.me|\.co\.za)?([/\s-]|$)/i.test(target)) return "facebook";
  if (/(^|[\s./-])insta(g?ram|gr)?([\s./-]|$)/i.test(target)) return "instagram";
  return "other";
}
