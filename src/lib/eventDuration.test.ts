import { describe, it, expect } from "vitest";
import { eventDurationDays, eventMatchesDuration, eventRequiresBooking } from "./eventDuration";

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
});
