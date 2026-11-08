import { describe, expect, it } from "vitest";
import { isEventHappeningNow } from "./eventLive";

describe("live event status", () => {
  it("uses Johannesburg times and only lights during the event", () => {
    const e = { start_date: "2026-11-08", start_time: "17:00", end_time: "18:00" };
    expect(isEventHappeningNow(e, new Date("2026-11-08T14:59:00Z"))).toBe(false);
    expect(isEventHappeningNow(e, new Date("2026-11-08T15:20:00Z"))).toBe(true);
    expect(isEventHappeningNow(e, new Date("2026-11-08T16:00:00Z"))).toBe(false);
  });
  it("handles continuous multi-day runs and date-only events", () => {
    expect(isEventHappeningNow({ start_date: "2026-11-07", end_date: "2026-11-09", start_time: "08:00", end_time: "18:00" }, new Date("2026-11-08T15:00:00Z"))).toBe(true);
    expect(isEventHappeningNow({ start_date: "2026-11-08" }, new Date("2026-11-08T15:00:00Z"))).toBe(true);
    expect(isEventHappeningNow({}, new Date("2026-11-08T15:00:00Z"))).toBe(false);
  });
  it("checks individual performances and recurring dates rather than gaps", () => {
    const e = { performances: [{ date: "2026-11-08", time: "10:00", end_time: "11:00" }, { date: "2026-11-08", time: "17:00", end_time: "18:00" }] };
    expect(isEventHappeningNow(e, new Date("2026-11-08T15:20:00Z"))).toBe(true);
    expect(isEventHappeningNow(e, new Date("2026-11-08T12:00:00Z"))).toBe(false);
    expect(isEventHappeningNow({ start_date: "2026-11-01", recurrence: "weekly:0", start_time: "17:00", end_time: "18:00" }, new Date("2026-11-08T15:20:00Z"))).toBe(true);
  });
  it("keeps overnight events live after midnight and Late through the event day", () => {
    expect(isEventHappeningNow({ start_date: "2026-11-07", start_time: "22:00", end_time: "02:00" }, new Date("2026-11-07T23:00:00Z"))).toBe(true);
    expect(isEventHappeningNow({ start_date: "2026-11-08", start_time: "17:00", end_time: "Late" }, new Date("2026-11-08T20:00:00Z"))).toBe(true);
  });
});