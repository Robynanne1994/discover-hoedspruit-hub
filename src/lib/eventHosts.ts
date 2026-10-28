export interface EventHostRecord {
  name: string;
  image_url?: string | null;
  link?: string | null;
}

/** Host names match ignoring case, extra spaces and curly apostrophes. */
export const hostNameKey = (name: string | null | undefined) =>
  (name ?? "").replace(/[\u2018\u2019]/g, "'").trim().replace(/\s+/g, " ").toLowerCase();

export const buildHostDirectory = (rows: EventHostRecord[] | null | undefined) => {
  const map = new Map<string, EventHostRecord>();
  (rows ?? []).forEach((r) => {
    const k = hostNameKey(r.name);
    if (k) map.set(k, r);
  });
  return map;
};

/**
 * Fill a host's photo and link from the Event Hosts directory. A host linked to
 * a listing is left alone, and anything typed on the event itself wins.
 */
export const resolveHost = (
  host: { name: string; image?: string; link?: string; listingId?: string },
  directory: Map<string, EventHostRecord>,
) => {
  if (host.listingId) return host;
  const match = directory.get(hostNameKey(host.name));
  if (!match) return host;
  return {
    ...host,
    image: host.image || match.image_url || undefined,
    link: host.link?.trim() ? host.link : match.link || undefined,
  };
};
