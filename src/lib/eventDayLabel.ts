// Listed event cards name the weekday when an event runs on a single day, so
// "4 Nov" reads "4 Nov (Wed)". A run that spans several days keeps its plain
// range with no tag. Short forms match the rest of the app: Sun, Mon, Tue,
// Wed, Thu, Fri, Sat.

const SHORT_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function shortWeekday(d: Date): string {
  return SHORT_WEEKDAYS[d.getDay()] ?? "";
}

/**
 * Append the short weekday to a one-day event's date line.
 * `end` may be null (no end date recorded) or the same day as `start`;
 * anything later is a multi-day run and is returned untouched.
 */
export function oneDayDateLine(dateLine: string, start: Date | null, end: Date | null): string {
  if (!dateLine || !start) return dateLine;
  if (end && end.getTime() !== start.getTime()) return dateLine;
  const day = shortWeekday(start);
  return day ? `${dateLine} (${day})` : dateLine;
}
