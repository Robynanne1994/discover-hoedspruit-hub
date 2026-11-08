import { DAY_KEYS, formatClock12, getHoursSchedules, isAlwaysOpen, type HoursMap } from "./openHours";

type HoursSource = Parameters<typeof getHoursSchedules>[0];
const range = (value?: string) => {
  if (!value || /closed/i.test(value)) return null;
  const match = value.match(/(\d{1,2}(?:[:.]\d{2})?)\s*[-–]\s*(\d{1,2}(?:[:.]\d{2})?)/);
  if (!match) return null;
  const minutes = (time: string) => {
    const [h, m = "0"] = time.replace(".", ":").split(":");
    return Number(h) * 60 + Number(m);
  };
  return { start: match[1], end: match[2], opens: minutes(match[1]), closes: minutes(match[2]) };
};

function nextOpening(hours: HoursMap, now: Date, includeToday: boolean): string | undefined {
  const today = (now.getDay() + 6) % 7;
  const current = now.getHours() * 60 + now.getMinutes();
  for (let offset = includeToday ? 0 : 1; offset <= 7; offset++) {
    const key = DAY_KEYS[(today + offset) % 7];
    const value = hours[key];
    const opening = isAlwaysOpen(value) ? "00:00" : range(value)?.start;
    if (!opening) continue;
    if (offset === 0 && (range(value)?.opens ?? 0) <= current) continue;
    const day = offset === 0 ? "" : ` ${key.slice(0, 3).replace(/^./, (c) => c.toUpperCase())}`;
    return `Opens ${formatClock12(opening)}${day}`;
  }
}

/** Cards always speak for the first populated schedule, not whichever is open. */
export function listingCardHours(listing: HoursSource, now = new Date()): {
  state: "unknown" | "open" | "closed";
  label: string;
  detail?: string;
} {
  const schedule = getHoursSchedules(listing)[0];
  if (!schedule) return { state: "unknown", label: "Hours Unknown" };
  const hours = schedule.hours;
  const today = (now.getDay() + 6) % 7;
  const value = hours[DAY_KEYS[today]];
  if (isAlwaysOpen(value)) return { state: "open", label: "Open now", detail: "Always Open" };
  const current = now.getHours() * 60 + now.getMinutes();
  // An overnight opening belongs to yesterday, not to tonight's schedule.
  const previous = range(hours[DAY_KEYS[(today + 6) % 7]]);
  if (previous && previous.closes <= previous.opens && current <= previous.closes) {
    return { state: "open", label: "Open now", detail: `Closes ${formatClock12(previous.end)}` };
  }
  const todayRange = range(value);
  if (todayRange) {
    const closing = todayRange.closes <= todayRange.opens ? todayRange.closes + 1440 : todayRange.closes;
    if (current >= todayRange.opens && current <= closing) {
      return { state: "open", label: "Open now", detail: `Closes ${formatClock12(todayRange.end)}` };
    }
  }
  return { state: "closed", label: "Closed now", detail: nextOpening(hours, now, true) };
}