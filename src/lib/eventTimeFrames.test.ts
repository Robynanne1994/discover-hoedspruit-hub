import { describe, expect, it } from "vitest";
import { calendarWeekend, formatDateRange, getTimeFrameRange, timeFrameHeading } from "./eventTimeFrames";

// Fixed "today" so the dates never drift with the real clock.
const WED_4_NOV = new Date(2026, 10, 4); // Wed 4 Nov 2026

const heading = (filter: string, today: Date = WED_4_NOV) => timeFrameHeading(filter, today);

describe("events time-frame headings", () => {
  it("says Today's date with the year, without the word Today", () => {
    expect(heading("today")).toBe("4 November 2026");
  });

  it("spells This Week from Monday to Sunday", () => {
    expect(heading("this-week")).toBe("2-8 November 2026");
  });

  it("spells This Weekend from Friday to Sunday", () => {
    expect(heading("this-weekend")).toBe("6-8 November 2026");
  });

  it("keeps the weekend's own days when pressed mid-weekend", () => {
    expect(heading("this-weekend", new Date(2026, 10, 7))).toBe("6-8 November 2026"); // Sat
    expect(heading("this-weekend", new Date(2026, 10, 8))).toBe("6-8 November 2026"); // Sun
  });

  it("names the month and year for This Month", () => {
    expect(heading("this-month")).toBe("November 2026");
  });

  it("names the year alone for This Year and Next Year", () => {
    expect(heading("this-year")).toBe("2026");
    expect(heading("next-year")).toBe("2027");
  });

  it("spells the past window in short months, oldest day to yesterday", () => {
    expect(heading("past")).toBe("4 Oct - 3 Nov 2026");
  });

  it("keeps every other pill's month written out in full", () => {
    expect(heading("today")).toBe("4 November 2026");
    expect(heading("this-week")).toBe("2-8 November 2026");
    expect(heading("this-month")).toBe("November 2026");
  });

  it("leaves a pill with no dates of its own as plain Events", () => {
    expect(heading("all")).toBe("Events");
    expect(heading("nonsense")).toBe("Events");
    expect(getTimeFrameRange("all", WED_4_NOV)).toBeNull();
  });

  it("repeats the month when a week crosses the end of it", () => {
    expect(heading("this-week", new Date(2026, 10, 30))).toBe("30 November - 6 December 2026");
  });

  it("repeats the year when a week crosses the end of it", () => {
    expect(heading("this-week", new Date(2026, 11, 31))).toBe("28 December 2026 - 3 January 2027");
  });

  it("repeats the year for a past window that crosses it", () => {
    expect(heading("past", new Date(2026, 0, 15))).toBe("15 Dec 2025 - 14 Jan 2026");
  });
});

describe("calendarWeekend", () => {
  it("runs Friday to Sunday whichever day it is", () => {
    const { start, end } = calendarWeekend(WED_4_NOV);
    expect(start.getDay()).toBe(5); // Friday 6 Nov
    expect(end.getDay()).toBe(0); // Sunday 8 Nov
    expect(formatDateRange({ start, end })).toBe("6-8 November 2026");
  });

  it("holds the whole of Sunday, so late events still count", () => {
    const { end } = calendarWeekend(WED_4_NOV);
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
  });
});
