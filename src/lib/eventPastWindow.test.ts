import { describe, expect, it } from "vitest";
import { getPastWindowStart, isRecentPast } from "./eventPastWindow";

// Fixed "today" so the window never drifts with the real clock.
const TODAY = new Date(2026, 9, 19); // 19 Oct 2026, local

const at = (y: number, m: number, d: number) => new Date(y, m, d);

describe("past events window", () => {
  it("reaches back exactly three months", () => {
    expect(getPastWindowStart(TODAY)).toEqual(at(2026, 6, 19)); // 19 Jul 2026
  });

  it("shows an event two weeks ago", () => {
    expect(isRecentPast(at(2026, 9, 5), TODAY)).toBe(true);
  });

  it("shows an event on the oldest day still in range", () => {
    expect(isRecentPast(at(2026, 6, 19), TODAY)).toBe(true);
  });

  it("hides an event one day older than the window", () => {
    expect(isRecentPast(at(2026, 6, 18), TODAY)).toBe(false);
  });

  it("hides an event a year ago", () => {
    expect(isRecentPast(at(2025, 9, 19), TODAY)).toBe(false);
  });

  it("does not treat today as past", () => {
    expect(isRecentPast(at(2026, 9, 19), TODAY)).toBe(false);
  });

  it("does not treat a future date as past", () => {
    expect(isRecentPast(at(2026, 9, 20), TODAY)).toBe(false);
  });

  it("does not treat a missing date as past", () => {
    expect(isRecentPast(null, TODAY)).toBe(false);
    expect(isRecentPast(undefined, TODAY)).toBe(false);
  });
});
