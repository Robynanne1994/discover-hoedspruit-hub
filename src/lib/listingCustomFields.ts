// A listing can carry up to three admin-authored rows: custom_title_N paired
// with custom_text_N. Those rows belong on the About tab under "Good to know",
// never among the Details cards, so the collection rule lives here where the
// page and its tests read the same list.

export type CustomFieldRow = { key: string; title: string; text: string };

export const CUSTOM_FIELD_SLOTS = [1, 2, 3] as const;

// A row only shows when both halves are filled: a title with nothing to say, or
// text with nothing to head it, would read as a broken card.
export const collectCustomRows = (row: Record<string, unknown>): CustomFieldRow[] =>
  CUSTOM_FIELD_SLOTS.map((i) => ({
    key: `custom-${i}`,
    title: String(row[`custom_title_${i}`] ?? "").trim(),
    text: String(row[`custom_text_${i}`] ?? "").trim(),
  })).filter((r) => r.title !== "" && r.text !== "");
