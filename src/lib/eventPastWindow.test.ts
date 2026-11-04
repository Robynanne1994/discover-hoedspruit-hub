import { describe, expect, it } from "vitest";
import { PAST_GROUP_LABEL, defaultEventSort, effectiveEventSort, getPastWindowStart, isRecentPast } from "./eventPastWindow";

// Fixed "today" so the window never drifts with the real clock.
const TODAY = new Date(2026, 9, 19); // 19 Oct 2026, local

const at = (y: number, m: number, d: number) => new Date(y, m, d);

describe("past events window", () => {
  it("reaches back exactly one month", () => {
    expect(getPastWindowStart(TODAY)).toEqual(at(2026, 8, 19)); // 19 Sep 2026
  });

  it("heads the list with the past month, not three", () => {
    expect(PAST_GROUP_LABEL).toBe("Events in the Past Month");
  });

  it("shows an event two weeks ago", () => {
    expect(isRecentPast(at(2026, 9, 5), TODAY)).toBe(true);
  });

  it("shows an event on the oldest day still in range", () => {
    expect(isRecentPast(at(2026, 8, 19), TODAY)).toBe(true);
  });

  it("hides an event one day older than the window", () => {
    expect(isRecentPast(at(2026, 8, 18), TODAY)).toBe(false);
  });

  it("hides an event two months ago", () => {
    expect(isRecentPast(at(2026, 8, 1), TODAY)).toBe(false);
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

describe("past events default order", () => {
  const SORTS = ["date-asc", "date-desc", "title-asc"] as const;
  type Sort = (typeof SORTS)[number];

  it("falls back to newest first while the past filter is on", () => {
    expect(defaultEventSort<Sort>("past", "date-asc", "date-desc")).toBe("date-desc");
  });

  it("falls back to soonest first for every other filter", () => {
    expect(defaultEventSort<Sort>("all", "date-asc", "date-desc")).toBe("date-asc");
    expect(defaultEventSort<Sort>("this-month", "date-asc", "date-desc")).toBe("date-asc");
  });

  it("reads newest first while past is on and nothing was chosen", () => {
    expect(effectiveEventSort<Sort>("past", null, "date-asc", "date-desc")).toBe("date-desc");
  });

  it("honours the soonest-first choice written into the address while past is on", () => {
    expect(effectiveEventSort<Sort>("past", "date-asc", "date-asc", "date-desc")).toBe("date-asc");
  });

  it("keeps any other sort chosen while past is on", () => {
    expect(effectiveEventSort<Sort>("past", "title-asc", "date-asc", "date-desc")).toBe("title-asc");
  });

  it("keeps every other filter on the sort it was given", () => {
    expect(effectiveEventSort<Sort>("all", null, "date-asc", "date-desc")).toBe("date-asc");
    expect(effectiveEventSort<Sort>("this-week", "title-asc", "date-asc", "date-desc")).toBe("title-asc");
  });
});
