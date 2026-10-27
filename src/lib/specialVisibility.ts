export interface SpecialVisibilityFields {
  is_active: boolean;
  valid_from?: string | null;
  valid_until?: string | null;
}

export function specialToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function isUpcomingSpecial(special: SpecialVisibilityFields, today = specialToday()): boolean {
  return !!special.valid_from && special.valid_from > today &&
    (!special.valid_until || special.valid_until >= special.valid_from);
}

export function isVisibleSpecial(special: SpecialVisibilityFields, today = specialToday()): boolean {
  return isUpcomingSpecial(special, today) ||
    (special.is_active && (!special.valid_until || special.valid_until >= today));
}