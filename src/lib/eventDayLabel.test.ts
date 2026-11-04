import { describe, expect, it } from "vitest";
import { oneDayDateLine, shortWeekday } from "./eventDayLabel";

const at = (y: number, m: number, d: number) => new Date(y, m, d);

describe("one-day event weekday tag", () => {
  it("names the weekday for a single-day event", () => {
    expect(oneDayDateLine("4 Nov", at(2026, 10, 4), null)).toBe("4 Nov (Wed)");
  });

  it("names the weekday when the end date is the same day", () => {
    expect(oneDayDateLine("4 Nov", at(2026, 10, 4), at(2026, 10, 4))).toBe("4 Nov (Wed)");
  });

  it("leaves a run across days untagged", () => {
    expect(oneDayDateLine("3 Nov – 6 Nov", at(2026, 10, 3), at(2026, 10, 6))).toBe("3 Nov – 6 Nov");
  });

  it("leaves a run that ends the next day untagged", () => {
    expect(oneDayDateLine("4 Nov – 5 Nov", at(2026, 10, 4), at(2026, 10, 5))).toBe("4 Nov – 5 Nov");
  });

  it("leaves a date with no start untagged", () => {
    expect(oneDayDateLine("Every Saturday", null, null)).toBe("Every Saturday");
  });

  it("uses the short weekday forms the app already shows", () => {
    const week = [1, 2, 3, 4, 5, 6, 7].map((d) => at(2026, 10, d));
    expect(week.map((d) => shortWeekday(d))).toEqual(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
  });
});
