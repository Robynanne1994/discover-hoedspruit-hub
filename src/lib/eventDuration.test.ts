import { describe, it, expect } from "vitest";
import {
  countEventBooking,
  countEventDurations,
  eventDurationDays,
  eventMatchesDuration,
  eventRequiresBooking,
} from "./eventDuration";

describe("eventDuration", () => {
  it("same start and end date is 1 day", () => {
    expect(eventDurationDays({ start_date: "2026-10-28", end_date: "2026-10-28" })).toBe(1);
    expect(eventDurationDays({ start_date: "2026-10-28" })).toBe(1);
  });
  it("counts inclusively", () => {
    expect(eventDurationDays({ start_date: "2026-10-28", end_date: "2026-10-30" })).toBe(3);
  });
  it("buckets 4–7 and more than 7", () => {
    expect(eventMatchesDuration({ start_date: "2026-10-01", end_date: "2026-10-07" }, "4-7")).toBe(true);
    expect(eventMatchesDuration({ start_date: "2026-10-01", end_date: "2026-10-08" }, "8+")).toBe(true);
    expect(eventMatchesDuration({ start_date: "2026-10-01", end_date: "2026-10-08" }, "4-7")).toBe(false);
  });
  it("booking required when a booking link exists", () => {
    expect(eventRequiresBooking({ booking_link: "https://x.co" })).toBe(true);
    expect(eventRequiresBooking({ booking_link: " " })).toBe(false);
  });
  it("an event with no booking link counts as booking not required", () => {
    expect(eventRequiresBooking({})).toBe(false);
    expect(eventRequiresBooking({ booking_link: null })).toBe(false);
    expect(eventRequiresBooking({ booking_link: "" })).toBe(false);
  });
  it("counts duration buckets from event dates", () => {
    const counts = countEventDurations([
      { start_date: "2026-10-28", end_date: "2026-10-28" },
      { start_date: "2026-10-28", end_date: "2026-10-29" },
      { start_date: "2026-10-28", end_date: "2026-11-03" },
      { date: "Every Tuesday" },
    ]);
    expect(counts.all).toBe(4);
    expect(counts["1"]).toBe(1);
    expect(counts["2"]).toBe(1);
    expect(counts["4-7"]).toBe(1);
    expect(counts["8+"]).toBe(0);
    expect(counts["3"]).toBe(0);
  });
  it("counts booking split from booking links", () => {
    const counts = countEventBooking([
      { booking_link: "https://x.co" },
      { booking_link: " " },
      { booking_link: null },
      {},
    ]);
    expect(counts.any).toBe(4);
    expect(counts.required).toBe(1);
    expect(counts["not-required"]).toBe(3);
  });
});
