import { describe, expect, it } from "vitest";
import { getEventLiveStatus, isEventHappeningNow, isEventPassedForAdmin } from "./eventLive";

describe("live event status", () => {
  it("marks Ballyhoo happening from 2PM until 6PM and passed at 6:33PM on 8 November", () => {
    const e = { start_date: "2026-11-08", end_date: "2026-11-08", start_time: "14:00", end_time: "18:00", recurrence: "None" };
    expect(getEventLiveStatus(e, new Date("2026-11-08T11:59:00Z"))).toBe("upcoming");
    expect(getEventLiveStatus(e, new Date("2026-11-08T12:00:00Z"))).toBe("happening");
    expect(getEventLiveStatus(e, new Date("2026-11-08T15:59:00Z"))).toBe("happening");
    expect(getEventLiveStatus(e, new Date("2026-11-08T16:00:00Z"))).toBe("past");
    expect(getEventLiveStatus(e, new Date("2026-11-08T16:33:00Z"))).toBe("past");
  });
  it("only passes a performance series after its final end time", () => {
    const e = { performances: [{ date: "2026-11-08", time: "14:00", end_time: "18:00" }, { date: "2026-11-09", time: "14:00", end_time: "18:00" }] };
    expect(getEventLiveStatus(e, new Date("2026-11-08T16:33:00Z"))).toBe("upcoming");
    expect(getEventLiveStatus(e, new Date("2026-11-09T16:33:00Z"))).toBe("past");
  });
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

describe("admin Events tabs", () => {
  const now = new Date("2026-11-16T06:36:00Z"); // 08:36 in Johannesburg, 16 Nov 2026

  it("puts an event whose date has passed in Passed even when recurrence says None", () => {
    expect(isEventPassedForAdmin({ start_date: "2026-11-07", end_date: "2026-11-07", start_time: "07:30", recurrence: "None" }, now)).toBe(true);
    expect(isEventPassedForAdmin({ start_date: "2026-11-12", end_date: "2026-11-12", recurrence: "None" }, now)).toBe(true);
  });
  it("moves an event to Passed only once its end time has gone", () => {
    expect(isEventPassedForAdmin({ start_date: "2026-11-16", end_date: "2026-11-16", start_time: "07:00", end_time: "09:00" }, now)).toBe(false);
    expect(isEventPassedForAdmin({ start_date: "2026-11-15", end_date: "2026-11-16", start_time: "07:00", end_time: "06:00" }, now)).toBe(true);
  });
  it("keeps a run that still covers today in Active", () => {
    expect(isEventPassedForAdmin({ start_date: "2026-11-12", end_date: "2026-11-17" }, now)).toBe(false);
    expect(isEventPassedForAdmin({ start_date: "2026-12-19", end_date: "2026-12-19", start_time: "10:00", end_time: "12:00" }, now)).toBe(false);
  });
  it("puts a performance series in Passed only after its final show", () => {
    const e = { performances: [{ date: "2026-11-15", time: "20:00" }, { date: "2026-11-16", time: "20:00" }] };
    expect(isEventPassedForAdmin(e, now)).toBe(false);
    expect(isEventPassedForAdmin(e, new Date("2026-11-16T23:00:00Z"))).toBe(true);
  });
  it("keeps recurring events with no dates in Active because nothing has passed", () => {
    expect(isEventPassedForAdmin({ recurrence: "Weekly", start_time: "07:00" }, now)).toBe(false);
    expect(isEventPassedForAdmin({}, now)).toBe(false);
  });
});