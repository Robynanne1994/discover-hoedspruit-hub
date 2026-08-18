import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  DEFAULT_HOURS_LABEL,
  getHoursSchedules,
  headlineSchedule,
  isAnyOpenNow,
  isOpenNow,
  parseAdditionalHours,
} from "./openHours";

// Sleepers: the kitchen shuts at 21:00, the bar carries on to midnight. Stating
// one set of hours for both is what this whole feature exists to stop.
const SLEEPERS = {
  opening_hours: {
    monday: "08:00 - 21:00", tuesday: "08:00 - 21:00", wednesday: "08:00 - 21:00",
    thursday: "08:00 - 21:00", friday: "08:00 - 21:00", saturday: "08:00 - 21:00",
    sunday: "08:00 - 21:00",
  },
  opening_hours_label: "Kitchen",
  additional_hours: [
    {
      label: "Bar",
      hours: {
        monday: "10:00 - 00:00", tuesday: "10:00 - 00:00", wednesday: "10:00 - 00:00",
        thursday: "10:00 - 00:00", friday: "10:00 - 00:00", saturday: "10:00 - 00:00",
        sunday: "10:00 - 00:00",
      },
    },
  ],
};

// A Wednesday, so every day-keyed fixture above is in play.
const at = (hhmm: string) => new Date(`2026-08-19T${hhmm}:00`);

describe("getHoursSchedules", () => {
  it("gives a single unnamed listing one schedule under the default label", () => {
    const schedules = getHoursSchedules({ opening_hours: { monday: "08:00 - 17:00" } });
    expect(schedules).toHaveLength(1);
    expect(schedules[0].label).toBe(DEFAULT_HOURS_LABEL);
  });

  it("returns the primary schedule first, then the extras, each with its label", () => {
    expect(getHoursSchedules(SLEEPERS).map((s) => s.label)).toEqual(["Kitchen", "Bar"]);
  });

  it("returns nothing when the listing has no hours at all", () => {
    expect(getHoursSchedules({ opening_hours: null })).toEqual([]);
    expect(getHoursSchedules(null)).toEqual([]);
  });

  it("keeps the extras when the primary hours were never filled in", () => {
    const schedules = getHoursSchedules({ opening_hours: {}, additional_hours: SLEEPERS.additional_hours });
    expect(schedules.map((s) => s.label)).toEqual(["Bar"]);
  });
});

describe("parseAdditionalHours", () => {
  it("reads the column whether it arrives as JSON or as a CSV string", () => {
    const asString = parseAdditionalHours(JSON.stringify(SLEEPERS.additional_hours));
    expect(asString).toEqual(parseAdditionalHours(SLEEPERS.additional_hours));
    expect(asString[0].label).toBe("Bar");
  });

  it("skips malformed entries instead of breaking the listing", () => {
    expect(parseAdditionalHours("not json")).toEqual([]);
    expect(parseAdditionalHours({ label: "Bar" })).toEqual([]);
    expect(parseAdditionalHours([null, "x", { label: "Bar", hours: { monday: "10:00 - 00:00" } }]))
      .toEqual([{ label: "Bar", hours: { monday: "10:00 - 00:00" } }]);
  });

  it("drops a labelled set with no day filled in — that's an unfinished edit", () => {
    expect(parseAdditionalHours([{ label: "Bar", hours: { monday: "  " } }])).toEqual([]);
  });

  it("names an unnamed set rather than rendering it blank", () => {
    expect(parseAdditionalHours([{ hours: { monday: "10:00 - 00:00" } }])[0].label).toBe("Hours 2");
  });

  it("ignores keys that aren't days", () => {
    expect(parseAdditionalHours([{ label: "Bar", hours: { monday: "10:00 - 00:00", someday: "19:00" } }])[0].hours)
      .toEqual({ monday: "10:00 - 00:00" });
  });
});

describe("open status across schedules", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("counts the listing as open while only the bar is still serving", () => {
    vi.setSystemTime(at("22:30"));
    expect(isOpenNow(SLEEPERS.opening_hours)).toBe(false);
    expect(isAnyOpenNow(SLEEPERS)).toBe(true);
    expect(headlineSchedule(getHoursSchedules(SLEEPERS))?.label).toBe("Bar");
  });

  it("leads with the kitchen while both are open", () => {
    vi.setSystemTime(at("12:00"));
    expect(headlineSchedule(getHoursSchedules(SLEEPERS))?.label).toBe("Kitchen");
  });

  it("falls back to the first schedule once everything has closed", () => {
    vi.setSystemTime(at("03:00"));
    expect(isAnyOpenNow(SLEEPERS)).toBe(false);
    expect(headlineSchedule(getHoursSchedules(SLEEPERS))?.label).toBe("Kitchen");
  });

  it("treats a closing time past midnight as later the same evening", () => {
    vi.setSystemTime(at("23:30"));
    expect(isOpenNow({ wednesday: "18:00 - 02:00" })).toBe(true);
    vi.setSystemTime(at("01:00"));
    expect(isOpenNow({ wednesday: "18:00 - 02:00" })).toBe(true);
    vi.setSystemTime(at("03:00"));
    expect(isOpenNow({ wednesday: "18:00 - 02:00" })).toBe(false);
  });
});
