// The main category tag on a special drives the filter pills on /specials.
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
