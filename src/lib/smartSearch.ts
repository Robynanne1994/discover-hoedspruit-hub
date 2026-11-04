/**
 * Smart search: a term matches a category when any word of the term and any
 * word of the category share a stem ("school" ↔ "Schools & Education").
 * Listings whose title contains the term rank first; category matches follow.
 */
const stem = (w: string) =>
  w.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/(ies)$/, "y").replace(/(es|s)$/, "");

const words = (s: string) => s.split(/[\s&,/\-]+/).map(stem).filter((w) => w.length >= 3);

export function categoryMatchesTerm(term: string, categoryTitle: string): boolean {
  const t = term.trim().toLowerCase();
  if (t.length < 2) return false;
  if (categoryTitle.toLowerCase().includes(t)) return true;
  const cw = words(categoryTitle);
  return words(t).some((tw) => cw.some((c) => c.startsWith(tw) || tw.startsWith(c)));
}

/** Title matches first (in their given order), then category matches, no duplicates. */
export function rankSmartResults<T extends { id: string }>(titleMatches: T[], categoryMatches: T[]): T[] {
  const seen = new Set(titleMatches.map((l) => l.id));
  return [...titleMatches, ...categoryMatches.filter((l) => !seen.has(l.id) && seen.add(l.id))];
}
