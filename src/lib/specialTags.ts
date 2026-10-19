// All three category tags on a special drive the filter pills on /specials.
// Tags are typed free text in the editor and in the CSV, so they are compared
// on a normalised key: trimmed, inner runs of spaces collapsed, lowercased.
// That keeps "Home & Lifestyle" and "home & lifestyle" one pill instead of two.
export function tagKey(tag: string | null | undefined): string {
  return String(tag ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

// Main categories offered as one-tap picks in the specials editors.
export const SPECIAL_TAG_PRESETS = [
  "Accommodation",
  "Food & Drink",
  "Wellness",
  "Activities",
  "Shopping",
  "Services",
  "Beauty",
  "Home & Lifestyle",
];

// One label per normalised key, first spelling wins so a pill label stays
// stable, then alphabetical for the pill row.
export function uniqueTags(tags: (string | null | undefined)[]): string[] {
  const seen = new Map<string, string>();
  for (const raw of tags) {
    const label = String(raw ?? "")
      .trim()
      .replace(/\s+/g, " ");
    const key = tagKey(label);
    if (!key) continue;
    if (!seen.has(key)) seen.set(key, label);
  }
  return Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
}

type SpecialCategories = {
  tag?: string | null;
  sub_tag_1?: string | null;
  sub_tag_2?: string | null;
};

export function collectSpecialTags(special: SpecialCategories): string[] {
  return uniqueTags([special.tag, special.sub_tag_1, special.sub_tag_2]);
}

export function specialMatchesTag(special: SpecialCategories, category: string): boolean {
  return collectSpecialTags(special).some((tag) => tagKey(tag) === tagKey(category));
}

export function countSpecialTags(specials: SpecialCategories[], categories: string[]): Map<string, number> {
  const canonical = new Map(categories.map((category) => [tagKey(category), category]));
  const counts = new Map<string, number>();
  for (const special of specials) {
    for (const tag of collectSpecialTags(special)) {
      const label = canonical.get(tagKey(tag));
      if (label) counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }
  return counts;
}
