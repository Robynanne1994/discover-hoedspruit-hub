import { describe, expect, it } from "vitest";
import { SPECIAL_TAG_PRESETS, tagKey, uniqueTags } from "./specialTags";

describe("specialTags", () => {
  it("offers Home & Lifestyle as a main category", () => {
    expect(SPECIAL_TAG_PRESETS).toContain("Home & Lifestyle");
  });

  it("collapses a tag typed with different capitals into one pill", () => {
    expect(uniqueTags(["Home & Lifestyle", "home & lifestyle", "  Home & Lifestyle  "])).toEqual(["Home & Lifestyle"]);
  });

  it("keeps genuinely different categories apart and sorts them", () => {
    expect(uniqueTags(["Shopping", "Home & Lifestyle", "", null, "Wellness"])).toEqual([
      "Home & Lifestyle",
      "Shopping",
      "Wellness",
    ]);
  });

  it("matches a tag on its normalised key", () => {
    expect(tagKey("  Home  &   Lifestyle ")).toBe("home & lifestyle");
    expect(tagKey("Home & Lifestyle")).toBe(tagKey("home & lifestyle"));
    expect(tagKey(null)).toBe("");
  });
});
