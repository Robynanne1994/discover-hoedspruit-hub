import { describe, expect, it } from "vitest";
import { channelCsvYears, channelYearStarted, channelYearsRunning } from "./channelYears";

const now = new Date("2026-11-06T08:53:00Z");

describe("local channel start years", () => {
  it("imports Year Started as a year, not a duration", () => {
    expect(channelCsvYears({ year_started: "2018" }, now)).toEqual({ since_year: 2018, years_running: null });
    expect(channelCsvYears({ yearstarted: "2018" }, now)).toEqual({ since_year: 2018, years_running: null });
  });
  it("calculates eight years running in 2026 for a 2018 start", () => {
    expect(channelYearsRunning({ since_year: 2018 }, now)).toBe(8);
  });
  it("updates at the Johannesburg new-year boundary", () => {
    expect(channelYearsRunning({ since_year: 2018 }, new Date("2026-12-31T21:59:00Z"))).toBe(8);
    expect(channelYearsRunning({ since_year: 2018 }, new Date("2026-12-31T22:00:00Z"))).toBe(9);
  });
  it("preserves legacy durations and converts them to start years on export", () => {
    expect(channelYearsRunning({ years_running: 5 }, now)).toBe(5);
    expect(channelYearStarted({ years_running: 5 }, now)).toBe(2021);
    expect(channelYearStarted({ since_year: 2018, years_running: 5 }, now)).toBe(2018);
    expect(channelCsvYears({ years_running: "5" }, now)).toEqual({ since_year: null, years_running: 5 });
  });
  it("keeps zero and blank durations distinct", () => {
    expect(channelYearsRunning({ since_year: 2026 }, now)).toBe(0);
    expect(channelYearsRunning({}, now)).toBeNull();
    expect(channelCsvYears({ year_started: "" }, now)).toEqual({ since_year: null, years_running: null });
  });
  it("rejects invalid or future start years before import", () => {
    for (const year of ["five", "2018.5", "2027", "5"]) {
      expect(() => channelCsvYears({ year_started: year }, now)).toThrow();
    }
  });
});