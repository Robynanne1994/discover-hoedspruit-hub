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

  it("does not flag a holiday that has already passed", () => {
    // Sun 2026-06-21 — Youth Day (16 Jun) is behind us, so Tuesday stays clean.
    const week = getWeekPublicHolidays(new Date(2026, 5, 21));
    expect(Object.keys(week)).toHaveLength(0);
  });

  it("moves a row on to the next holiday once the current one passes", () => {
    // Sat 2026-12-26 — Christmas is behind us, so Friday now carries New Year's Day.
    const week = getWeekPublicHolidays(new Date(2026, 11, 26));
    expect(week.friday?.name).toBe("New Year's Day");
    expect(week.saturday?.name).toBe("Day of Goodwill");
    expect(week.saturday?.daysAway).toBe(0);
  });

  it("looks across a year boundary", () => {
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
});

describe("isSAPublicHoliday", () => {
  it("matches a fixed holiday and ignores an ordinary day", () => {
    expect(isSAPublicHoliday(new Date(2026, 11, 25))).toEqual({ isHoliday: true, name: "Christmas Day" });
    expect(isSAPublicHoliday(new Date(2026, 11, 27)).isHoliday).toBe(false);
  });
});
