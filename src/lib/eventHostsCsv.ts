/**
 * Events sheet host columns: hosted_by_name, hosted_by_subtitle and
 * hosted_by_link each hold every host, pipe-separated in the same order.
 * A link slot is either a web address or an exact listing title; "-" or
 * an empty slot means no link.
 */
export interface CsvHost {
  name: string;
  subtitle: string | null;
  link: string | null;
  listingId: string | null;
}

const split = (cell: string | null | undefined) =>
  (cell ?? "").split("|").map((s) => s.trim());

const blank = (s: string | undefined) => !s || s === "-";

/** A slot is a web link when it starts with a scheme or www, or is a bare domain with no spaces. */
export const isHostUrl = (value: string) => {
  const v = value.trim();
  if (/^(https?:\/\/|www\.)/i.test(v)) return true;
  return !/\s/.test(v) && /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(v);
};

export const parseHostCells = (
  names: string | null | undefined,
  subtitles: string | null | undefined,
  links: string | null | undefined,
  resolveListing: (title: string) => string | null,
): CsvHost[] => {
  const n = split(names);
  const s = split(subtitles);
  const l = split(links);
  const hosts: CsvHost[] = [];
  n.forEach((name, i) => {
    if (blank(name)) return;
    const link = l[i];
    let url: string | null = null;
    let listingId: string | null = null;
    if (!blank(link)) {
      if (isHostUrl(link)) url = link;
      else listingId = resolveListing(link);
    }
    hosts.push({ name, subtitle: blank(s[i]) ? null : s[i], link: url, listingId });
  });
  return hosts;
};

export const serializeHostCells = (
  hosts: { name?: string | null; subtitle?: string | null; link?: string | null; listingTitle?: string | null }[],
) => {
  const list = hosts.filter((h) => h.name?.trim());
  if (!list.length) return { hosted_by_name: "", hosted_by_subtitle: "", hosted_by_link: "" };
  return {
    hosted_by_name: list.map((h) => h.name!.trim()).join("|"),
    hosted_by_subtitle: list.map((h) => h.subtitle?.trim() || "-").join("|"),
    hosted_by_link: list.map((h) => h.link?.trim() || h.listingTitle?.trim() || "-").join("|"),
  };
};

/** Map parsed hosts onto the three stored host slots plus extra_hosts. */
export const hostsToColumns = (hosts: CsvHost[]) => {
  const out: Record<string, unknown> = {};
  [0, 1, 2].forEach((i) => {
    const sfx = i === 0 ? "" : `_${i + 1}`;
    const h = hosts[i];
    out[`hosted_by_name${sfx}`] = h?.name ?? null;
    out[`hosted_by_subtitle${sfx}`] = h?.subtitle ?? null;
    out[`hosted_by_link${sfx}`] = h?.link ?? null;
    out[`hosted_by_listing_id${sfx}`] = h?.listingId ?? null;
  });
  out.extra_hosts = hosts.slice(3).map((h) => ({ name: h.name, subtitle: h.subtitle, link: h.link, listing_id: h.listingId }));
  return out;
};
