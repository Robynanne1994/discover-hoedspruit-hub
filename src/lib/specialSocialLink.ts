export interface SpecialSocialFields {
  social_media_link?: string | null;
  social_media_label?: string | null;
}

// Only publish labelled web links, never a raw URL or an executable scheme.
export function specialSocialLink(special: SpecialSocialFields): { href: string; label: string } | null {
  const link = special.social_media_link?.trim();
  const label = special.social_media_label?.trim();
  if (!link || !label) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(link) ? link : `https://${link}`);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname.includes('.') || url.username || url.password) return null;
    return { href: url.href, label };
  } catch {
    return null;
  }
}