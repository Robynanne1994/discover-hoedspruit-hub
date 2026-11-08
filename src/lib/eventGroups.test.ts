import { describe, expect, it } from "vitest";
import { buildEventGroups, eventTimeFrameHeading } from "./eventGroups";

const Y = new Date().getFullYear();

// Fixed "today" for every heading assertion, so the dates never drift with the
// real clock: Wed 4 Nov 2026, inside a Mon 2 – Sun 8 week.
const TODAY = new Date(2026, 10, 4);

const dated = (id: string, date: Date) => ({ id, title: id, _parsed: date });

const recurringEvent = {
  id: "rec-1",
  title: "Owners Day",
  recurrence: "weekly:3",
  _parsed: new Date(Y, 9, 7),
};

describe("buildEventGroups", () => {
  it("renders next-year events after the Recurring group", () => {
    const groups = buildEventGroups(
      [
        dated("oct", new Date(Y, 9, 15)),
        dated("jan-next", new Date(Y + 1, 0, 20)),
        recurringEvent,
      ],
      "all"
    );

    expect(groups.map((g) => g.key)).toEqual([`${Y}-10`, "recurring", `y-${Y + 1}`]);
    expect(groups.map((g) => g.label)).toEqual(["October", "Recurring", String(Y + 1)]);
  });

  it("keeps every next-year event together under one year heading", () => {
    const groups = buildEventGroups(
      [
        dated("a", new Date(Y + 1, 2, 4)),
        dated("b", new Date(Y + 1, 6, 18)),
        dated("c", new Date(Y + 1, 10, 2)),
      ],
      "all"
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ key: `y-${Y + 1}`, label: String(Y + 1) });
    expect(groups[0].events.map((e) => e.id)).toEqual(["a", "b", "c"]);
  });

  it("places years beyond next after Recurring, also under the year alone", () => {
    const groups = buildEventGroups(
      [dated("far", new Date(Y + 2, 11, 5)), recurringEvent],
      "all"
    );

    expect(groups.map((g) => g.key)).toEqual(["recurring", `y-${Y + 2}`]);
    expect(groups[1].label).toBe(String(Y + 2));
  });

  it("groups the current year by month and keeps undated events last", () => {
    const groups = buildEventGroups(
      [dated("nov", new Date(Y, 10, 3)), dated("oct", new Date(Y, 9, 28)), { id: "tbc", title: "TBC" }],
      "all"
    );

    expect(groups.map((g) => [g.key, g.label, g.events.length])).toEqual([
      [`${Y}-11`, "November", 1],
      [`${Y}-10`, "October", 1],
      ["tbc", "DATE TO BE CONFIRMED", 1],
    ]);
  });

  it("shows one heading without a count for the past window", () => {
    const groups = buildEventGroups(
      [dated("past-a", new Date(Y, 8, 12)), dated("past-b", new Date(Y, 7, 3))],
      "past",
      false,
      false,
      TODAY
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      key: "past",
      label: "4 Oct - 3 Nov 2026",
      showCount: false,
    });
    expect(groups[0].events.map((e) => e.id)).toEqual(["past-a", "past-b"]);
  });

  it("heads a lone time-frame pill with that week's dates, not its words", () => {
    const groups = buildEventGroups([dated("a", new Date(2026, 10, 4))], "this-week", true, true, TODAY);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ key: "timeframe-this-week", label: "2-8 Nov 2026" });
    expect(groups[0].events.map((e) => e.id)).toEqual(["a"]);
  });

  it("heads a lone Today pill with the date and year alone", () => {
    const groups = buildEventGroups([dated("a", new Date(2026, 10, 4))], "today", true, true, TODAY);
    expect(groups[0].label).toBe("4 Nov 2026");
  });

  it("heads a lone Past pill with the dates its window covers", () => {
    const groups = buildEventGroups([dated("a", new Date(2026, 9, 20))], "past", true, true, TODAY);
    expect(groups[0].label).toBe("4 Oct - 3 Nov 2026");
  });

  it("falls back to Events once anything else narrows the list beside the pill", () => {
    const groups = buildEventGroups([dated("a", new Date(2026, 10, 4))], "this-week", true, false, TODAY);
    expect(groups[0]).toMatchObject({ key: "filtered", label: "Events" });
  });

  it("never hands a lone-pill heading to a filter that has no dates of its own", () => {
    expect(eventTimeFrameHeading("all", TODAY)).toBe("Events");
  });

  it("returns no groups when nothing matches", () => {
    expect(buildEventGroups([], "all")).toEqual([]);
    expect(buildEventGroups([], "past")).toEqual([]);
    expect(buildEventGroups([], "this-week", true, true)).toEqual([]);
  });
});
