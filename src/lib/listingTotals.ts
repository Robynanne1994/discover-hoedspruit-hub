/** Count each business once, even if its ID appears under several categories. */
export const countUniqueBusinesses = (
  listingIds: ReadonlyArray<string | null | undefined>,
): number => new Set(listingIds.filter((id): id is string => Boolean(id))).size;
