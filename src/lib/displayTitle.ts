// Returns the text to display for a listing/event/special title.
// If title_override is set (non-empty after trim), it wins and should be
// rendered verbatim (rendering sites should also wrap it in an element with
// data-no-title-case so the global TitleCaseH1/H2 transformers and the
// CSS text-transform rules skip it).
export const getDisplayTitle = (item: any): string => {
  if (!item) return "";
  const o = (item.title_override || "").trim();
  return o || item.title || "";
};

export const hasTitleOverride = (item: any): boolean =>
  !!(item && (item.title_override || "").trim());

// Returns props to spread on the element rendering the title (or its parent)
// so that CSS text-transform and DOM title-casers skip it when an override
// is set.
export const noTitleCaseProps = (item: any) =>
  hasTitleOverride(item) ? { "data-no-title-case": "true" as const } : {};

// ---- CSV representation ----
// In CSV files the override is a simple true/false toggle (the same switch as
// in the backend editor): true means "show the title exactly as typed", which
// is stored by copying the title into title_override.
export const titleOverrideToCsv = (item: any): string =>
  hasTitleOverride(item) ? "true" : "false";

// Reads a CSV cell. Returns null when the cell says nothing (blank).
export const parseTitleOverrideCell = (raw: unknown): boolean | null => {
  const v = String(raw ?? "").trim().toLowerCase();
  if (!v) return null;
  if (["true", "1", "yes", "y", "on"].includes(v)) return true;
  return false;
};

// The value to write to the title_override column for a given toggle state.
export const titleOverrideValue = (on: boolean, title: string): string | null =>
  on ? (title || "").trim() || null : null;

