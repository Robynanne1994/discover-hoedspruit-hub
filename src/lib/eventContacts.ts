/** A "-" (or other placeholder) in a label slot means "no label" but keeps its position. */
export const contactLabelSlot = (v?: string | null): string => {
  const t = (v ?? "").trim();
  return t === "" || /^[-–—]+$/.test(t) || /^(n\/a|na|none|null)$/i.test(t) ? "" : t;
};

/** Pipe cell of labels kept positional, so "-|Tracey" labels only the second contact. */
export const splitContactLabels = (labels?: string | null): string[] =>
  (labels || "").split("|").map(contactLabelSlot);

/** Event CSV cells combine contacts and positional labels; storage keeps editor-compatible primary/extras. */
export function parseEventContactCells(contacts?: string | null, labels?: string | null) {
  const labelParts = splitContactLabels(labels);
  const pairs = (contacts || "").split("|").map((value, i) => ({
    value: contactLabelSlot(value), label: labelParts[i] || "",
  })).filter(({ value }) => Boolean(value));
  // A contact repeated in one row is one contact: keep its first slot so it is
  // never stored as two separate additions.
  const seen = new Set<string>();
  const unique = pairs.filter(({ value }) => {
    const key = value.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return {
    primary: unique[0]?.value || null,
    label: unique[0]?.label || null,
    extras: unique.slice(1).map(({ value }) => value),
    extraLabels: unique.slice(1).map(({ label }) => label),
  };
}

export function eventContactPairs(
  primary?: string | null, label?: string | null,
  extras?: string[] | null, extraLabels?: string[] | null,
) {
  const parsed = parseEventContactCells(primary, label);
  const values = [parsed.primary || "", ...parsed.extras, ...(extras || [])];
  const labels = [parsed.label || "", ...parsed.extraLabels, ...(extraLabels || [])];
  const seen = new Set<string>();
  return values.flatMap((value, i) => {
    const trimmed = value.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) return [];
    seen.add(key);
    return [{ value: trimmed, label: (labels[i] || "").trim() }];
  });
}

export function serializeEventContactCells(
  primary?: string | null, label?: string | null,
  extras?: string[] | null, extraLabels?: string[] | null,
) {
  const pairs = eventContactPairs(primary, label, extras, extraLabels);
  return {
    contacts: pairs.map(({ value }) => value).join("|"),
    labels: pairs.map(({ label }) => label).join("|"),
  };
}