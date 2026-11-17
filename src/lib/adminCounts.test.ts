import { describe, expect, it } from "vitest";
import { activeSpecialCount, upcomingEventCount } from "./adminCounts";

// Mid-morning in Johannesburg on 17 November 2026.
const NOW = new Date("2026-11-17T09:47:00+02:00");

describe("upcomingEventCount", () => {
  it("excludes events whose date has gone and keeps those still to come", () => {
    expect(
      upcomingEventCount(
        [
          { start_date: "2026-11-16", end_date: "2026-11-16", start_time: "07:30" },
          { start_date: "2026-11-17", end_date: "2026-11-17", start_time: "18:00" },
          { start_date: "2026-12-19", end_date: "2026-12-19" },
        ],
        NOW,
      ),
    ).toBe(2);
  });

  it("keeps a multi-day run that is still running", () => {
    expect(
      upcomingEventCount([{ start_date: "2026-11-12", end_date: "2026-11-17" }], NOW),
    ).toBe(1);
  });

  it("drops an event whose last day and time have passed", () => {
    expect(
      upcomingEventCount(
        [{ start_date: "2026-11-16", end_date: "2026-11-17", start_time: "07:00", end_time: "06:00" }],
        NOW,
      ),
    ).toBe(0);
  });
});

describe("activeSpecialCount", () => {
  it("counts switched-on, unexpired deals only", () => {
    expect(
      activeSpecialCount(
        [
          { is_active: true, valid_until: "2026-11-17" },
          { is_active: true, valid_until: "2026-11-16" },
          { is_active: false, valid_until: null },
          { is_active: true, valid_until: null },
        ],
        "2026-11-17",
      ),
    ).toBe(2);
  });
});
