/**
 * Featured always wins.
 *
 * Listings, events, specials and local channels can each be flagged
 * `is_featured`. Wherever a list is shown — the homepage rows, search, a
 * category page — featured items take the top slots, ahead of any hand-picked
 * order set in the admin. Curated picks then fill whatever slots are left, and
 * automatic fallbacks fill whatever remains after that. If featured items
 * already fill the row, the curated picks simply drop off the end.
 */

type WithId = { id: string };

const isFeatured = (row: unknown) => Boolean((row as { is_featured?: unknown } | null)?.is_featured);

/**
 * Stable featured-first partition: featured rows move to the front, and the
 * relative order inside each group (the caller's chosen sort) is preserved.
 */
export const pinFeatured = <T,>(rows: readonly T[]): T[] => [
  ...rows.filter(isFeatured),
  ...rows.filter((r) => !isFeatured(r)),
];

/**
 * Merge lists given in priority order (e.g. featured, then curated, then
 * automatic fill), dropping duplicates by id and keeping the first appearance.
 * Featured rows are pinned to the front regardless of which list they came
 * from, then the result is trimmed to `limit`.
 */
export const mergeFeaturedFirst = <T extends WithId>(
  lists: ReadonlyArray<readonly (T | null | undefined)[] | null | undefined>,
  limit?: number,
): T[] => {
  const seen = new Set<string>();
  const merged: T[] = [];
  for (const list of lists) {
    for (const row of list ?? []) {
      if (!row || seen.has(row.id)) continue;
      seen.add(row.id);
      merged.push(row);
    }
  }
  const ordered = pinFeatured(merged);
  return typeof limit === "number" ? ordered.slice(0, limit) : ordered;
};
