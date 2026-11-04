import { describe, it, expect } from "vitest";
import { compareFeaturedEvents } from "./featuredEventOrder";

describe("compareFeaturedEvents", () => {
  it("uses admin positions first, lowest first", () => {
    const list = [
      { id: "a", featured_position: 2, _parsed: new Date("2026-01-01") },
      { id: "b", featured_position: 1, _parsed: new Date("2027-01-01") },
    ];
    expect([...list].sort(compareFeaturedEvents).map((e) => e.id)).toEqual(["b", "a"]);
  });
  it("puts unplaced events after placed ones, soonest first, undated last", () => {
    const list = [
      { id: "none", featured_position: null, _parsed: null },
      { id: "late", featured_position: null, _parsed: new Date("2027-01-01") },
      { id: "soon", featured_position: null, _parsed: new Date("2026-12-01") },
      { id: "placed", featured_position: 3, _parsed: new Date("2028-01-01") },
    ];
    expect([...list].sort(compareFeaturedEvents).map((e) => e.id)).toEqual(["placed", "soon", "late", "none"]);
  });
});
