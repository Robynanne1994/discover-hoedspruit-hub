export const SPECIAL_AUDIENCE_OPTIONS = ["Kids", "Families", "Seniors", "Couples", "Newlyweds", "South African Residents Only"] as const;

/** CSV uses pipes; arrays are shared by storage, editors and detail rows. */
export function specialAudience(value: unknown): string[] {
  const parts = typeof value === "string" ? value.split(/[|,]/) : Array.isArray(value) ? value : [];
  const result: string[] = [];
  for (const part of parts) {
    if (typeof part !== "string") continue;
    const trimmed = part.trim();
    if (!trimmed) continue;
    const normalised = /^newly\s*weds$/i.test(trimmed) ? "Newlyweds" : trimmed;
    const label = SPECIAL_AUDIENCE_OPTIONS.find((option) => option.toLowerCase() === normalised.toLowerCase()) ?? normalised;
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

export function specialMatchesAudience(value: unknown, filter = "any"): boolean {
  if (filter === "any") return true;
  const audiences = specialAudience(value);
  if (filter === "all") return audiences.length === 0;
  return audiences.some((label) => label.toLowerCase() === filter.toLowerCase());
}

export function countSpecialAudiences(rows: { whos_it_for?: unknown }[], selected = "any") {
  const labels = specialAudience([...SPECIAL_AUDIENCE_OPTIONS, ...rows.flatMap((s) => specialAudience(s.whos_it_for)),
    ...(selected === "any" || selected === "all" ? [] : [selected])]);
  return [
    { key: "any", label: "Any", count: rows.length },
    { key: "all", label: "All", count: rows.filter((s) => specialMatchesAudience(s.whos_it_for, "all")).length },
    ...labels.map((label) => ({ key: label, label, count: rows.filter((s) => specialMatchesAudience(s.whos_it_for, label)).length })),
  ];
}