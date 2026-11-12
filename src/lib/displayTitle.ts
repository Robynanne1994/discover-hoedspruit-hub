// Titles always show exactly as typed (in the editor or the CSV sheet).
// The database keeps title_override in step with title automatically, so
// every older render site that checks for an override also shows it verbatim.
export const getDisplayTitle = (item: any): string => {
  if (!item) return "";
  return item.title || (item.title_override || "").trim() || "";
};

export const hasTitleOverride = (_item?: any): boolean => true;

// Spread on the element rendering a title so CSS text-transform and DOM
// title-casers skip it.
export const noTitleCaseProps = (_item?: any) => ({ "data-no-title-case": "true" as const });
