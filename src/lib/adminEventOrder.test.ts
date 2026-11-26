import { describe, expect, it } from "vitest";
import { isDraftEvent, sortAdminUpcomingEvents, type AdminEventOrderRow } from "./adminEventOrder";

type Row = AdminEventOrderRow & { title: string };

const row = (title: string, extra: Partial<Row> = {}): Row => ({
  title,
  is_active: true,
  created_at: "2026-11-01T08:00:00Z",
  ...extra,
});

describe("isDraftEvent", () => {
  it("treats only an explicit FALSE as a draft", () => {
    expect(isDraftEvent(row("off", { is_active: false }))).toBe(true);
    expect(isDraftEvent(row("on", { is_active: true }))).toBe(false);
    expect(isDraftEvent(row("missing"))).toBe(false);
  });
});

describe("sortAdminUpcomingEvents", () => {
  it("puts drafts above live events even when a live event is sooner", () => {
    const ordered = sortAdminUpcomingEvents([
      row("Live soon", { start_date: "2026-12-01" }),
      row("Draft later", { is_active: false, start_date: "2027-06-01" }),
      row("Live later", { start_date: "2027-01-01" }),
    ]);
    expect(ordered.map((ev) => ev.title)).toEqual([
      "Draft later",
      "Live soon",
      "Live later",
    ]);
  });

  it("orders live events soonest first and latest last", () => {
    const ordered = sortAdminUpcomingEvents([
      row("Latest", { start_date: "2027-03-01" }),
      row("Soonest", { start_date: "2026-12-01" }),
      row("Middle", { start_date: "2027-01-01" }),
    ]);
    expect(ordered.map((ev) => ev.title)).toEqual(["Soonest", "Middle", "Latest"]);
  });

  it("shows newest drafts first among the drafts", () => {
    const ordered = sortAdminUpcomingEvents([
      row("Older draft", { is_active: false, created_at: "2026-10-01T08:00:00Z" }),
      row("Newer draft", { is_active: false, created_at: "2026-11-20T08:00:00Z" }),
    ]);
    expect(ordered.map((ev) => ev.title)).toEqual(["Newer draft", "Older draft"]);
  });

  it("keeps live events with no usable date below the dated ones", () => {
    const ordered = sortAdminUpcomingEvents([
      row("Free text only", { date: "Every Saturday" }),
      row("Dated soon", { start_date: "2026-12-01" }),
      row("Dated late", { start_date: "2027-05-01" }),
    ]);
    expect(ordered.map((ev) => ev.title)).toEqual(["Dated soon", "Dated late", "Free text only"]);
  });

  it("does not mutate the array it is given", () => {
    const input = [
      row("Live later", { start_date: "2027-01-01" }),
      row("Draft", { is_active: false }),
    ];
    const before = input.map((ev) => ev.title);
    sortAdminUpcomingEvents(input);
    expect(input.map((ev) => ev.title)).toEqual(before);
  });
});
