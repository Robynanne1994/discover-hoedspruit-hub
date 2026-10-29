// "Special Type" is a free-text field per special (e.g. "Dinner Deal").
// Options come from whatever values are populated; matching ignores case and spacing.
export type SpecialKindLike = { special_type?: string | null };

export const ANY_SPECIAL_KIND = "";

export const specialKindKey = (v?: string | null): string =>
  (v ?? "").trim().replace(/\s+/g, " ").toLowerCase();

export const specialKindOf = (s: SpecialKindLike): string | null => {
  const v = (s.special_type ?? "").trim().replace(/\s+/g, " ");
  return v || null;
};

export const specialMatchesKind = (s: SpecialKindLike, kind: string): boolean =>
  !kind || specialKindKey(s.special_type) === specialKindKey(kind);

/** Options (first-seen spelling, alphabetical) with counts; Any counts every special. */
export const countSpecialKinds = (specials: SpecialKindLike[]) => {
  const map = new Map<string, { label: string; count: number }>();
  for (const s of specials) {
    const label = specialKindOf(s);
    if (!label) continue;
    const k = specialKindKey(label);
    const cur = map.get(k);
    if (cur) cur.count++;
    else map.set(k, { label, count: 1 });
  }
  const options = [...map.values()].sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
  return { any: specials.length, options };
};
