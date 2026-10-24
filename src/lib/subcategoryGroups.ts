// Merged subcategory groups for category filter drawers.
//
// Some subcategories read as one thing to a visitor ("Nurseries" and
// "Florists" are both plant shops), so they appear as a single option with a
// combined count. The underlying subcategories and their listings are
// untouched — this is purely a presentation-time grouping.
//
// A group that lists `categoryTitles` only applies inside those main
// categories; leave the field out and the group applies everywhere its
// subcategory titles appear.

export interface SubcategoryGroup {
  /** Display label for the single merged option. */
  label: string;
  /** Subcategory titles that merge, matched case-insensitively. */
  titles: string[];
  /** Main category titles this group applies to. Undefined = every category. */
  categoryTitles?: string[];
}

export const MERGED_SUBCATEGORY_GROUPS: SubcategoryGroup[] = [
  { label: "Nurseries & Florists", titles: ["nurseries", "florists"] },
  {
    label: "Pet & Farm Supplies",
    titles: ["pet supplies", "farm supplies", "farm / animal supplies"],
    categoryTitles: ["shopping"],
  },
  {
    label: "Cleaning & Hospitality Supplies",
    titles: ["cleaning supplies", "hospitality supplies"],
    categoryTitles: ["shopping"],
  },
];

export const MERGED_KEY_PREFIX = "merged:";

/** Trim, lower-case and collapse inner runs of spaces so titles compare fairly. */
export const normalizeSubTitle = (t: string): string => t.trim().toLowerCase().replace(/\s+/g, " ");

/** Stable URL-safe key for a group, derived from its sorted normalised titles. */
export const groupKeyFor = (titles: string[]): string =>
  MERGED_KEY_PREFIX + encodeURIComponent([...titles].map(normalizeSubTitle).sort().join("|"));

/** Resolve a URL key back to its group, or null when the key is not a merged one. */
export function findSubcategoryGroup(key: string): SubcategoryGroup | null {
  if (!key.startsWith(MERGED_KEY_PREFIX)) return null;
  let titles: string[];
  try {
    titles = decodeURIComponent(key.slice(MERGED_KEY_PREFIX.length)).split("|");
  } catch {
    return null;
  }
  return (
    MERGED_SUBCATEGORY_GROUPS.find(
      (g) =>
        titles.length === g.titles.length &&
        titles.every((t) => g.titles.map(normalizeSubTitle).includes(t)),
    ) || null
  );
}

/** The group a subcategory title belongs to, or null when it stands alone. */
export function groupForTitle(title: string): SubcategoryGroup | null {
  const n = normalizeSubTitle(title);
  return MERGED_SUBCATEGORY_GROUPS.find((g) => g.titles.map(normalizeSubTitle).includes(n)) || null;
}

/** Does this group apply inside the given main category? */
export function groupAppliesToCategory(
  g: SubcategoryGroup,
  categoryTitle?: string | null,
): boolean {
  if (!g.categoryTitles) return true;
  if (categoryTitle == null) return false;
  return g.categoryTitles.map(normalizeSubTitle).includes(normalizeSubTitle(categoryTitle));
}

export interface SubOption {
  /** Value stored in the `sub` URL param. */
  key: string;
  label: string;
  /** Subcategory ids this option stands for. */
  subIds: string[];
}

/**
 * Collapse a category's subcategories into drawer options: merged groups first
 * (in group order), then every remaining subcategory in its given order.
 * Pass the main category title so category-scoped groups only apply there.
 */
export function buildSubOptions(
  subs: { id: string; title: string }[],
  categoryTitle?: string | null,
): SubOption[] {
  const out: SubOption[] = [];
  const used = new Set<string>();
  for (const g of MERGED_SUBCATEGORY_GROUPS) {
    if (!groupAppliesToCategory(g, categoryTitle)) continue;
    const members = subs.filter((s) => !used.has(s.id) && titleIds(subs, g).includes(s.id));
    if (members.length > 0) {
      members.forEach((m) => used.add(m.id));
      out.push({ key: groupKeyFor(g.titles), label: g.label, subIds: members.map((m) => m.id) });
    }
  }
  for (const s of subs) {
    if (!used.has(s.id)) out.push({ key: s.id, label: s.title, subIds: [s.id] });
  }
  return out;
}

/** Every subcategory id in `subs` whose title is a member of the group. */
function titleIds(subs: { id: string; title: string }[], g: SubcategoryGroup): string[] {
  const wanted = g.titles.map(normalizeSubTitle);
  return subs.filter((s) => wanted.includes(normalizeSubTitle(s.title))).map((s) => s.id);
}

/** The subcategory ids an option key stands for, or null for an unknown key. */
export function subIdsForKey(
  key: string,
  subs: { id: string; title: string }[],
): string[] | null {
  const group = findSubcategoryGroup(key);
  if (group) {
    const ids = titleIds(subs, group);
    return ids.length > 0 ? ids : null;
  }
  const direct = subs.find((s) => s.id === key);
  if (!direct) return null;
  // A plain id whose subcategory has since joined a group resolves to the group.
  const joined = groupForTitle(direct.title);
  if (joined) {
    const ids = titleIds(subs, joined);
    return ids.length > 0 ? ids : null;
  }
  return [direct.id];
}
