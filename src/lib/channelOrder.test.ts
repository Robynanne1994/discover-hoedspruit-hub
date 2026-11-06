import { describe, expect, it } from "vitest";
import { channelOrderUpdates, compareChannels } from "./channelOrder";

describe("local channel order", () => {
  it("always puts featured channels before the saved order", () => {
    const rows = [
      { id: "second", is_featured: false, sort_order: 2 },
      { id: "featured", is_featured: true, sort_order: 99 },
      { id: "first", is_featured: false, sort_order: 1 },
    ];
    expect(rows.sort(compareChannels).map((row) => row.id)).toEqual(["featured", "first", "second"]);
  });
  it("saves the dragged non-featured order without altering featured channels", () => {
    expect(channelOrderUpdates([
      { id: "second", is_featured: false, sort_order: 2 },
      { id: "featured", is_featured: true, sort_order: 99 },
      { id: "first", is_featured: false, sort_order: 1 },
    ])).toEqual([{ id: "second", sort_order: 1 }, { id: "first", sort_order: 2 }]);
  });
});