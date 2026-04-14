// South African public holidays - dynamically calculated per year
// Reference: Public Holidays Act 36 of 1994

interface Holiday {
  month: number; // 1-indexed
  day: number;
  name: string;
}

function getEasterSunday(year: number): Date {
  // Anonymous Gregorian algorithm
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getFixedHolidays(year: number): Holiday[] {
  return [
    { month: 1, day: 1, name: "New Year's Day" },
    { month: 3, day: 21, name: "Human Rights Day" },
    { month: 4, day: 27, name: "Freedom Day" },
    { month: 5, day: 1, name: "Workers' Day" },
    { month: 6, day: 16, name: "Youth Day" },
    { month: 8, day: 9, name: "National Women's Day" },
    { month: 9, day: 24, name: "Heritage Day" },
    { month: 12, day: 16, name: "Day of Reconciliation" },
    { month: 12, day: 25, name: "Christmas Day" },
    { month: 12, day: 26, name: "Day of Goodwill" },
  ];
}

export function getSAPublicHolidays(year: number): { date: Date; name: string }[] {
  const holidays: { date: Date; name: string }[] = [];

  // Fixed holidays
  for (const h of getFixedHolidays(year)) {
    holidays.push({ date: new Date(year, h.month - 1, h.day), name: h.name });
  }

  // Easter-based holidays
  const easter = getEasterSunday(year);
  holidays.push({ date: addDays(easter, -2), name: "Good Friday" });
  holidays.push({ date: addDays(easter, 1), name: "Family Day" });

  // If a public holiday falls on a Sunday, the following Monday is also a holiday
  const extraDays: { date: Date; name: string }[] = [];
  for (const h of holidays) {
    if (h.date.getDay() === 0) {
      extraDays.push({ date: addDays(h.date, 1), name: `${h.name} (observed)` });
    }
  }
  holidays.push(...extraDays);

  return holidays;
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function isSAPublicHoliday(date: Date): { isHoliday: boolean; name?: string } {
  const holidays = getSAPublicHolidays(date.getFullYear());
  const key = formatDateKey(date);
  const match = holidays.find((h) => formatDateKey(h.date) === key);
  return match ? { isHoliday: true, name: match.name } : { isHoliday: false };
}

/** Get current date in South Africa timezone */
export function getSADate(): Date {
  const now = new Date();
  const saString = now.toLocaleDateString("en-ZA", { timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit" });
  // Format: YYYY/MM/DD or DD/MM/YYYY depending on locale — parse safely
  const parts = saString.split("/");
  // en-ZA returns YYYY/MM/DD
  if (parts[0].length === 4) {
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  }
  return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
}
