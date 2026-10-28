/** Event CSV cells combine contacts and positional labels; storage keeps editor-compatible primary/extras. */
export function parseEventContactCells(contacts?: string | null, labels?: string | null) {
  const labelParts = (labels || "").split("|");
  const pairs = (contacts || "").split("|").map((value, i) => ({
    value: value.trim(), label: (labelParts[i] || "").trim(),
  })).filter(({ value }) => Boolean(value));
  return {
    primary: pairs[0]?.value || null,
    label: pairs[0]?.label || null,
    extras: pairs.slice(1).map(({ value }) => value),
    extraLabels: pairs.slice(1).map(({ label }) => label),
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