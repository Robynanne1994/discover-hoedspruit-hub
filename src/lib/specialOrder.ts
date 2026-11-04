/**
 * Default ("All") order of specials. Admin-set positions come first (lowest
 * first); specials with no position follow, newest first. Featured specials are
 * pulled out above this order by the page, so any position they hold is ignored.
 */
type Orderable = { sort_position?: number | null; created_at?: string | null };

export const compareSpecialDefault = (a: Orderable, b: Orderable): number => {
  const ap = a.sort_position ?? null;
  const bp = b.sort_position ?? null;
  if (ap != null && bp != null && ap !== bp) return ap - bp;
  if (ap != null && bp == null) return -1;
  if (ap == null && bp != null) return 1;
  return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
};

export const sortSpecialsDefault = <T extends Orderable>(list: T[]): T[] =>
  [...list].sort(compareSpecialDefault);
