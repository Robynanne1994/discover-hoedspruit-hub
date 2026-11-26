import { specialToday, type SpecialVisibilityFields } from "./specialVisibility";

export type SpecialCsvScope = "active" | "passed";
export type SpecialCsvImportMode = "new" | SpecialCsvScope;

/** Match the admin tabs: Active is enabled and unexpired; Passed is expired or inactive. */
export function specialCsvScope(special: SpecialVisibilityFields, now: Date = new Date()): SpecialCsvScope {
  return special.is_active && !special.is_done && (!special.valid_until || special.valid_until >= specialToday(now)) ? "active" : "passed";
}

/** Check both stored and incoming scope so a sheet cannot change another group's specials. */
export function specialCsvAction(
  mode: SpecialCsvImportMode,
  incoming: SpecialVisibilityFields,
  existing: SpecialVisibilityFields | undefined,
  now: Date = new Date(),
): "insert" | "update" | "skip" {
  if (mode === "new") return existing ? "skip" : "insert";
  if (existing && specialCsvScope(existing, now) !== mode) return "skip";
  // Marking an existing active special done is how it moves to Past.
  const incomingScope = specialCsvScope(existing && mode === "active" ? { ...incoming, is_done: false } : incoming, now);
  if (incomingScope !== mode) return "skip";
  if (existing) return "update";
  return mode === "active" ? "insert" : "skip";
}