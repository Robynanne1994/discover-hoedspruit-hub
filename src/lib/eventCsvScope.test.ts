import { describe, expect, it } from "vitest";
import { eventCsvAction, eventCsvScope } from "./eventCsvScope";

const now = new Date("2026-11-06T08:01:00Z");
const past = { start_date: "2026-11-05", end_date: "2026-11-05" };
const upcoming = { start_date: "2026-11-07", end_date: "2026-11-07" };

describe("event CSV scope protection", () => {
  it("New Only inserts new events but never updates existing ones", () => {
    expect(eventCsvAction("new", upcoming, undefined, now)).toBe("insert");
    expect(eventCsvAction("new", past, past, now)).toBe("skip");
    expect(eventCsvAction("new", upcoming, upcoming, now)).toBe("skip");
  });
  it("Past updates past events only, not upcoming events or new rows", () => {
    expect(eventCsvAction("past", past, past, now)).toBe("update");
    expect(eventCsvAction("past", past, upcoming, now)).toBe("skip");
    expect(eventCsvAction("past", upcoming, past, now)).toBe("skip");
    expect(eventCsvAction("past", past, undefined, now)).toBe("skip");
  });
  it("Upcoming updates and adds upcoming events without changing past events", () => {
    expect(eventCsvAction("upcoming", upcoming, upcoming, now)).toBe("update");
    expect(eventCsvAction("upcoming", upcoming, undefined, now)).toBe("insert");
    expect(eventCsvAction("upcoming", upcoming, past, now)).toBe("skip");
    expect(eventCsvAction("upcoming", past, upcoming, now)).toBe("skip");
    expect(eventCsvAction("upcoming", past, undefined, now)).toBe("skip");
  });
  it("keeps today's and ongoing events in Upcoming using Johannesburg dates", () => {
    expect(eventCsvScope({ start_date: "2026-11-06" }, now)).toBe("upcoming");
    expect(eventCsvScope({ start_date: "2026-11-01", end_date: "2026-11-08" }, now)).toBe("upcoming");
    expect(eventCsvScope(past, new Date("2026-11-05T22:01:00Z"))).toBe("past");
  });
  it("keeps recurring events and mixed performances together until their final occurrence passes", () => {
    expect(eventCsvScope({ start_date: "2026-01-01", recurrence: "weekly:6" }, now)).toBe("upcoming");
    expect(eventCsvScope({ start_date: "2026-01-01", end_date: "2026-10-31", recurrence: "weekly:6" }, now)).toBe("past");
    expect(eventCsvScope({ performances: [{ date: "2026-11-01" }, { date: "2026-11-07" }] }, now)).toBe("upcoming");
  });
  it("does not update undated events through either dated sheet", () => {
    expect(eventCsvAction("past", {}, {}, now)).toBe("skip");
    expect(eventCsvAction("upcoming", {}, {}, now)).toBe("skip");
  });
});