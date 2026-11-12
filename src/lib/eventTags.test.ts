import { describe, expect, it } from "vitest";
import { availableEventTags, collectEventTags, countEventTags, eventMatchesTag, eventMatchesSearch, eventTagCsvCell, eventTagCsvColumns } from "./eventTags";

describe("event categories", () => {
  it("imports all pipe-separated tags into one column without a three-tag limit", () => {
    const columns = eventTagCsvColumns("Market|Family-friendly|Outdoor|Music");
    expect(columns).toEqual({ tag: "Market|Family-friendly|Outdoor|Music", sub_tag_1: null, sub_tag_2: null });
    expect(collectEventTags(columns)).toEqual(["Market", "Family-friendly", "Outdoor", "Music"]);
    expect(eventMatchesTag(columns, "Music")).toBe(true);
  });

  it("exports existing sub-tags in the single tag cell with no separator spaces", () => {
    expect(eventTagCsvCell({ tag: "Market", sub_tag_1: "Family-friendly", sub_tag_2: "Outdoor" })).toBe("Market|Family-friendly|Outdoor");
  });

  it("counts repeated pipe tags only once and round-trips them", () => {
    const event = eventTagCsvColumns("Market|Family-friendly|Market");
    expect(countEventTags([event], ["Market"]).get("Market")).toBe(1);
    expect(eventTagCsvCell(event)).toBe("Market|Family-friendly");
  });
  const events = [
    { title: "Market Walk", tag: "Markets", sub_tag_1: "Family", sub_tag_2: "Walking" },
    { title: "Family Day", tag: " family ", sub_tag_1: "Family", sub_tag_2: "FAMILY" },
  ];

  it("collects categories from all three tag fields", () => {
    expect(availableEventTags(events)).toEqual(["Family", "Markets", "Walking"]);
  });

  it("filters events by either sub-tag", () => {
    expect(events.filter((event) => eventMatchesTag(event, "Family"))).toHaveLength(2);
    expect(events.filter((event) => eventMatchesTag(event, "Walking"))).toEqual([events[0]]);
    expect(eventMatchesTag(events[1], "Walking")).toBe(false);
  });

  it("counts an event once per category despite repeated tags", () => {
    const counts = countEventTags(events, availableEventTags(events));
    expect(Object.fromEntries(counts)).toEqual({ Family: 2, Markets: 1, Walking: 1 });
    expect(events.length).toBe(2);
  });

  it("searches sub-tags as well as the primary tag", () => {
    expect(eventMatchesSearch(events[0], "walking")).toBe(true);
    expect(eventMatchesSearch(events[1], "walking")).toBe(false);
  });
});