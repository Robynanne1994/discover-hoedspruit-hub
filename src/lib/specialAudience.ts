export const SPECIAL_AUDIENCE_OPTIONS = ["Kids", "Families", "Seniors", "Couples"] as const;

/** CSV uses pipes; arrays are shared by storage, editors and detail rows. */
export function specialAudience(value: unknown): string[] {
  const parts = typeof value === "string" ? value.split(/[|,]/) : Array.isArray(value) ? value : [];
  const result: string[] = [];
  for (const part of parts) {
    if (typeof part !== "string") continue;
    const trimmed = part.trim();
    if (!trimmed) continue;
    const label = SPECIAL_AUDIENCE_OPTIONS.find((option) => option.toLowerCase() === trimmed.toLowerCase()) ?? trimmed;
    if (!result.some((existing) => existing.toLowerCase() === label.toLowerCase())) result.push(label);
  }
  return result;
}

/** Missing columns preserve existing data; an explicitly blank cell clears it. */
export function specialAudienceCsvPatch(row: Record<string, string>): { whos_it_for?: string[] | null } {
  if (!Object.prototype.hasOwnProperty.call(row, "whos_it_for")) return {};
  const audience = specialAudience(row.whos_it_for);
  return { whos_it_for: audience.length ? audience : null };
}

export const specialAudienceToCsv = (value: unknown): string => specialAudience(value).join("|");