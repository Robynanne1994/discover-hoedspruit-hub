export const LATE_END_TIME = "Late";

/** True when an event's end time is the "Late" marker (any case, extra spaces ignored). */
export function isLateEndTime(v: string | null | undefined): boolean {
  return !!v && v.trim().toLowerCase() === "late";
}
