export interface SpecialVisibilityFields {
  is_active: boolean;
  valid_from?: string | null;
  valid_until?: string | null;
}

export function specialToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

// Whether a deal starts in the future depends on dates alone, so date-only
// rows (the value bar's SpecialLike) can be checked without carrying the flag.
type SpecialDates = Pick<SpecialVisibilityFields, "valid_from" | "valid_until">;

export function isUpcomingSpecial(special: SpecialDates, today = specialToday()): boolean {
  return !!special.valid_from && special.valid_from > today &&
    (!special.valid_until || special.valid_until >= special.valid_from);
}

export function isVisibleSpecial(special: SpecialVisibilityFields, today = specialToday()): boolean {
  return isUpcomingSpecial(special, today) ||
    (special.is_active && (!special.valid_until || special.valid_until >= today));
}