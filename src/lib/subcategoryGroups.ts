// Merged subcategory groups for category filter drawers.
//
// Some subcategories read as one thing to a visitor ("Nurseries" and
// "Florists" are both plant shops), so they appear as a single option with a
// combined count. The underlying subcategories and their listings are
// untouched — this is purely a presentation-time grouping.

export interface SubcategoryGroup {
  /** Display label for the single merged option. */
  label: string;
  /** Subcategory titles that merge, matched case-insensitively. */
  titles: string[];
}

export const MERGED_SUBCATEGORY_GROUPS: SubcategoryGroup[] = [
  { label: "Nurseries & Florists", titles: ["nurseries", "florists"] },
];

export const MERGED_KEY_PREFIX = "merged:";

export const normalizeSubTitle = (t: string): string => t.trim().toLowerCase();

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
 */
export function buildSubOptions(subs: { id: string; title: string }[]): SubOption[] {
  const out: SubOption[] = [];
  const used = new Set<string>();
  for (const g of MERGED_SUBCATEGORY_GROUPS) {
    const wanted = g.titles.map(normalizeSubTitle);
    const members = subs.filter(
      (s) => !used.has(s.id) && wanted.includes(normalizeSubTitle(s.title)),
    );
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

/** The subcategory ids an option key stands for, or null for an unknown key. */
export function subIdsForKey(
  key: string,
  subs: { id: string; title: string }[],
): string[] | null {
  const opt = buildSubOptions(subs).find((o) => o.key === key || o.subIds.includes(key));
  return opt ? opt.subIds : null;
}
