import { describe, it, expect } from "vitest";
import {
  getSAPublicHolidays,
  isSAPublicHoliday,
  getWeekPublicHolidays,
  holidayHoursNote,
} from "./southAfricaHolidays";

describe("getSAPublicHolidays", () => {
  it("includes the fixed holidays", () => {
    const names = getSAPublicHolidays(2026).map((h) => h.name);
    expect(names).toContain("Christmas Day");
    expect(names).toContain("Heritage Day");
  });

  it("adds the observed Monday when a holiday falls on a Sunday", () => {
    // 2026-03-21 (Human Rights Day) is a Saturday; 2027-03-21 is a Sunday.
    const observed = getSAPublicHolidays(2027).find((h) => h.name === "Human Rights Day (observed)");
    expect(observed).toBeTruthy();
    expect(observed!.date.getMonth()).toBe(2);
    expect(observed!.date.getDate()).toBe(22);
  });
});

describe("getWeekPublicHolidays", () => {
  it("flags a holiday later in the week from an earlier day", () => {
    // Mon 2026-12-21 → Christmas Day lands on the Friday of the same week.
    const week = getWeekPublicHolidays(new Date(2026, 11, 21));
    expect(week.friday?.name).toBe("Christmas Day");
    expect(week.friday?.daysAway).toBe(4);
    expect(week.saturday?.name).toBe("Day of Goodwill");
  });

  it("flags the holiday on the day itself", () => {
    const week = getWeekPublicHolidays(new Date(2026, 11, 25));
    expect(week.friday?.name).toBe("Christmas Day");
    expect(week.friday?.daysAway).toBe(0);
  });

  it("keeps a holiday earlier in the same week on its own row", () => {
    // Fri 2026-05-01 is Workers' Day; from the Sunday it is still this week's Friday.
    const week = getWeekPublicHolidays(new Date(2026, 4, 3));
    expect(week.friday?.name).toBe("Workers' Day");
    expect(week.friday?.daysAway).toBe(-2);
  });

  it("does not reach into next week", () => {
    // Sun 2026-06-14 — Youth Day is Tuesday 16 June, which belongs to the next
    // Monday–Sunday list, not to the Tuesday row showing now.
    expect(Object.keys(getWeekPublicHolidays(new Date(2026, 5, 14)))).toHaveLength(0);
  });

  it("starts the week on Monday", () => {
    // Sun 2026-12-27 sits at the end of the Christmas week, so Friday and
    // Saturday still carry their holidays and New Year's Day is not yet shown.
    const week = getWeekPublicHolidays(new Date(2026, 11, 27));
    expect(week.friday?.name).toBe("Christmas Day");
    expect(week.saturday?.name).toBe("Day of Goodwill");
    expect(week.saturday?.daysAway).toBe(-1);
  });

  it("looks across a year boundary", () => {
    // Mon 2026-12-28 → the week runs into Friday 1 January 2027.
    const week = getWeekPublicHolidays(new Date(2026, 11, 28));
    expect(week.friday?.name).toBe("New Year's Day");
    expect(week.friday?.date.getFullYear()).toBe(2027);
  });

  it("returns nothing for a week with no holidays", () => {
    expect(Object.keys(getWeekPublicHolidays(new Date(2026, 1, 2)))).toHaveLength(0);
  });
});

describe("holidayHoursNote", () => {
  it("names the holiday and its date", () => {
    expect(holidayHoursNote({ name: "Christmas Day", date: new Date(2026, 11, 25) }))
      .toBe("Christmas Day (25 Dec) — hours might differ");
  });

  it("reads in the past tense for a holiday earlier in the week", () => {
    expect(holidayHoursNote({ name: "Christmas Day", date: new Date(2026, 11, 25), daysAway: -2 }))
      .toBe("Christmas Day (25 Dec) — hours may have differed");
  });
});

describe("isSAPublicHoliday", () => {
  it("matches a fixed holiday and ignores an ordinary day", () => {
    expect(isSAPublicHoliday(new Date(2026, 11, 25))).toEqual({ isHoliday: true, name: "Christmas Day" });
    expect(isSAPublicHoliday(new Date(2026, 11, 27)).isHoliday).toBe(false);
  });
});
