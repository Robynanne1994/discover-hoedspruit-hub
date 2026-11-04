import { describe, expect, it } from "vitest";

import { collectCustomRows } from "./listingCustomFields";

describe("collectCustomRows", () => {
  it("keeps populated rows in slot order with trimmed text", () => {
    const rows = collectCustomRows({
      custom_title_1: "  Co-Working Space Rates  ",
      custom_text_1: "Hourly: R50; Full Day: R300",
      custom_title_3: "Booking",
      custom_text_3: "Booking is required",
    });
    expect(rows).toEqual([
      { key: "custom-1", title: "Co-Working Space Rates", text: "Hourly: R50; Full Day: R300" },
      { key: "custom-3", title: "Booking", text: "Booking is required" },
    ]);
  });

  it("drops a slot whose title or text is missing", () => {
    const rows = collectCustomRows({
      custom_title_1: "Book Online",
      custom_text_1: "   ",
      custom_title_2: "",
      custom_text_2: "Check availability",
    });
    expect(rows).toEqual([]);
  });

  it("returns nothing when no custom field is populated", () => {
    expect(collectCustomRows({})).toEqual([]);
    expect(collectCustomRows({ custom_title_1: null, custom_text_1: null })).toEqual([]);
  });
});
