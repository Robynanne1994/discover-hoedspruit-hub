import { describe, expect, it } from "vitest";
import { activeEventFilterCount, hasActiveEventFilters } from "./eventFilterState.ts";

/** Every filter sitting at its default, i.e. nothing narrowing the list. */
const OFF = {
  dateFilter: "all",
  tagFilter: null,
  priceFilter: "any",
  durationFilter: "all",
  bookingFilter: "any",
  recurrenceFilter: "any",
  timeFilter: "any",
};

describe("activeEventFilterCount", () => {
  it("counts nothing while every filter is at its default", () => {
    expect(activeEventFilterCount(OFF)).toBe(0);
    expect(hasActiveEventFilters(OFF)).toBe(false);
  });

  it("counts a chosen date pill", () => {
    expect(activeEventFilterCount({ ...OFF, dateFilter: "this-week" })).toBe(1);
    expect(hasActiveEventFilters({ ...OFF, dateFilter: "this-week" })).toBe(true);
  });

  it("counts a chosen category tag", () => {
    expect(activeEventFilterCount({ ...OFF, tagFilter: "market" })).toBe(1);
  });

  it("counts each drawer dimension on its own", () => {
    expect(activeEventFilterCount({ ...OFF, priceFilter: "free", durationFilter: "weekend" })).toBe(2);
    expect(
      activeEventFilterCount({
        ...OFF,
        bookingFilter: "required",
        recurrenceFilter: "weekly",
        timeFilter: "morning",
      })
    ).toBe(3);
  });

  it("counts seven when every filter is on at once", () => {
    expect(
      activeEventFilterCount({
        dateFilter: "this-month",
        tagFilter: "music",
        priceFilter: "paid",
        durationFilter: "multi-day",
        bookingFilter: "not-required",
        recurrenceFilter: "once-off",
        timeFilter: "evening",
      })
    ).toBe(7);
  });
});
