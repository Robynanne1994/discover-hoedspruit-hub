/**
 * Order for the Featured Events carousel. Admin-set featured_position first
 * (lowest first); unplaced featured events follow in date order (soonest first,
 * undated last). The list below the carousels is never pinned by featured.
 */
type Orderable = { featured_position?: number | null; _parsed?: Date | null };

const time = (e: Orderable) => (e._parsed ? e._parsed.getTime() : Infinity);

export const compareFeaturedEvents = (a: Orderable, b: Orderable): number => {
  const ap = a.featured_position ?? null;
  const bp = b.featured_position ?? null;
  if (ap != null && bp != null && ap !== bp) return ap - bp;
  if (ap != null && bp == null) return -1;
  if (ap == null && bp != null) return 1;
  const at = time(a), bt = time(b);
  return at === bt ? 0 : at < bt ? -1 : 1;
};
