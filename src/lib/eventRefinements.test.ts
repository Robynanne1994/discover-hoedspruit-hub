import { describe, expect, it } from "vitest";
import { countEventRecurrence, countEventTimes, eventMatchesRecurrence, eventMatchesTime, eventTimeBucket } from "./eventRefinements";

describe("event recurrence", () => {
  it.each(["daily", "weekly", "biweekly", "monthly", "quarterly", "annually"] as const)("filters %s from stored recurrence", (frequency) => {
    const event = { recurrence: ` ${frequency.toUpperCase()} ` };
    expect(eventMatchesRecurrence(event, frequency)).toBe(true);
    expect(eventMatchesRecurrence(event, "none")).toBe(false);
    expect(eventMatchesRecurrence(event, "any")).toBe(true);
  });
  it("None matches events without recurrence, not unlisted recurring frequencies", () => {
    expect(eventMatchesRecurrence({}, "none")).toBe(true);
    expect(eventMatchesRecurrence({ recurrence: "None" }, "none")).toBe(true);
    expect(eventMatchesRecurrence({ recurrence: "Bimonthly" }, "none")).toBe(false);
    expect(eventMatchesRecurrence({ recurrence: "Bimonthly" }, "any")).toBe(true);
  });
  it("recognises structured and legacy recurrence using the existing schedule parser", () => {
    expect(eventMatchesRecurrence({ recurrence: "weekly:3" }, "weekly")).toBe(true);
    expect(eventMatchesRecurrence({ recurrence: "monthly-nth:1:6" }, "monthly")).toBe(true);
    expect(eventMatchesRecurrence({ date: "Every Tuesday" }, "weekly")).toBe(true);
    expect(eventMatchesRecurrence({ recurrence: "Biweekly", date: "Every Tuesday" }, "weekly")).toBe(false);
  });
});

describe("event Time", () => {
  it("Morning includes midnight and all starts before noon", () => {
    expect(eventTimeBucket({ start_time: "00:00" })).toBe("morning");
    expect(eventTimeBucket({ start_time: "6:30" })).toBe("morning");
    expect(eventTimeBucket({ start_time: "11:59" })).toBe("morning");
    expect(eventMatchesTime({ start_time: "12:00" }, "morning")).toBe(false);
  });
  it("Afternoon starts at noon and ends before 5pm", () => {
    expect(eventTimeBucket({ start_time: "12:00" })).toBe("afternoon");
    expect(eventTimeBucket({ start_time: "16:59" })).toBe("afternoon");
    expect(eventMatchesTime({ start_time: "17:00" }, "afternoon")).toBe(false);
  });
  it("Night includes 5pm onwards", () => {
    expect(eventTimeBucket({ start_time: "17:00" })).toBe("night");
    expect(eventTimeBucket({ start_time: "23:59:00" })).toBe("night");
    expect(eventMatchesTime({ start_time: "16:59" }, "night")).toBe(false);
  });
  it("keeps missing or invalid start times in Any only", () => {
    for (const start_time of [null, "", "Late", "24:00", "12:60"]) {
      expect(eventTimeBucket({ start_time })).toBeNull();
      expect(eventMatchesTime({ start_time }, "any")).toBe(true);
    }
  });
  it("counts each event once and includes missing times in Any", () => {
    expect(countEventTimes([{ start_time: "11:59" }, { start_time: "12:00" }, { start_time: "17:00" }, {}]))
      .toEqual({ any: 4, morning: 1, afternoon: 1, night: 1 });
  });
});

describe("event recurrence counts", () => {
  it("counts each event once and leaves unlisted frequencies in Any only", () => {
    const counts = countEventRecurrence([
      { recurrence: " Daily " },
      { recurrence: "WEEKLY" },
      { recurrence: "weekly:3" },
      { date: "Every Tuesday" },
      { recurrence: "None" },
      {},
      { recurrence: "Bimonthly" },
    ]);
    expect(counts).toEqual({
      any: 7,
      none: 2,
      daily: 1,
      weekly: 3,
      biweekly: 0,
      monthly: 0,
      quarterly: 0,
      annually: 0,
    });
  });
});