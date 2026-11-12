// Event social links live pipe-separated in social_media_link / social_media_label.
// Label slots align by position; "-" or blank means no label.
export interface SocialPair { link: string; label: string }

export function parseSocials(link?: string | null, label?: string | null): SocialPair[] {
  const links = (link || "").split("|");
  const labels = (label || "").split("|");
  const out: SocialPair[] = [];
  links.forEach((l, i) => {
    const lk = l.trim();
    const lb = (labels[i] || "").trim();
    out.push({ link: lk, label: lb === "-" ? "" : lb });
  });
  return out;
}

export function serializeSocials(pairs: SocialPair[]): { link: string; label: string } {
  const kept = pairs.filter((p) => p.link.trim());
  const link = kept.map((p) => p.link.trim()).join("|");
  const anyLabel = kept.some((p) => p.label.trim());
  const label = anyLabel ? kept.map((p) => p.label.trim() || "-").join("|") : "";
  return { link, label };
}
