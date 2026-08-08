// A weekly special does not always land on one day — "every Wednesday and
// Thursday" is just as common as "every Tuesday". The column holds a list, but
// older rows still hold a single name and CSVs arrive as delimited text, so
// every surface funnels its value through here before showing anything.

export const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type DayName = (typeof DAY_NAMES)[number];

// Cards are narrow; three letters is what fits beside a price.
const SHORT: Record<DayName, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

// "weds", "Thursdays", "SAT" — admins and spreadsheets all write days their own
// way, and any of them should land on the same day.
const matchDay = (token: string): DayName | null => {
  const t = token.trim().toLowerCase().replace(/[^a-z]/g, "");
  if (t.length < 3) return null;
  const prefix = (v: string) => DAY_NAMES.find((d) => d.toLowerCase().startsWith(v)) ?? null;
  // A trailing "s" is a plural, not a spelling: "Mondays", "Weds", "Thurs".
  return prefix(t) ?? (t.length > 3 && t.endsWith("s") ? prefix(t.slice(0, -1)) : null);
};

// Anything a row, a form or a CSV cell might carry -> unique days in week order.
// Unrecognised words are dropped rather than shown as-is, so a typo can never
// reach a card as "Wendesday".
export const parseDays = (value: unknown): DayName[] => {
  const tokens = Array.isArray(value)
    ? value.map((v) => String(v ?? ""))
    : String(value ?? "").split(/[|,;/]+/);
  const found = new Set<DayName>();
  for (const token of tokens) {
    const day = matchDay(token);
    if (day) found.add(day);
  }
  return DAY_NAMES.filter((d) => found.has(d));
};

const isRun = (days: DayName[]): boolean =>
  days.every((d, i) => i === 0 || DAY_NAMES.indexOf(d) === DAY_NAMES.indexOf(days[i - 1]) + 1);

export type DayStyle = "long" | "short";

// "Wednesday & Thursday", "Wed & Thu", "Mon–Fri", "Every day". Null when the
// special has no weekly schedule at all.
export const formatDays = (days: DayName[], style: DayStyle = "long"): string | null => {
  if (days.length === 0) return null;
  if (days.length === 7) return "Every day";
  const names = days.map((d) => (style === "short" ? SHORT[d] : d));
  // Three or more in a row reads better as a range than as a list.
  if (days.length >= 3 && isRun(days)) {
    return style === "short"
      ? `${names[0]}–${names[names.length - 1]}`
      : `${names[0]} to ${names[names.length - 1]}`;
  }
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
};

// What a card shows. One day keeps its full name — "Tuesday Special" is the
// wording the app has always used — but the moment there are two, the label
// goes short so it still fits the pill and the value bar.
export const compactDays = (days: DayName[]): string | null =>
  formatDays(days, days.length > 1 ? "short" : "long");

// The recurring phrasing used alongside an end date: "Tuesdays until 12 Aug",
// "Wed & Thu until 12 Aug". Only a single full day name pluralises cleanly.
export const recurringDays = (days: DayName[]): string | null => {
  const label = compactDays(days);
  if (!label) return null;
  return days.length === 1 ? `${label}s` : label;
};

// CSV round-trip. Pipes match the other multi-value columns (phones, terms).
export const daysToCsv = (value: unknown): string => parseDays(value).join("|");
