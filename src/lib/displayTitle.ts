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
