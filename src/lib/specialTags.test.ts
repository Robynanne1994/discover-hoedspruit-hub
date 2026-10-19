import { describe, expect, it } from "vitest";
import { SPECIAL_TAG_PRESETS, tagKey, uniqueTags, collectSpecialTags, specialMatchesTag, countSpecialTags } from "./specialTags";

describe("specialTags", () => {
  const special = { tag: "Shopping", sub_tag_1: "Home & Lifestyle", sub_tag_2: "Services" };

  it("offers categories from all three CSV and editor tag fields", () => {
    expect(collectSpecialTags(special)).toEqual(["Home & Lifestyle", "Services", "Shopping"]);
  });

  it.each(["Shopping", "Home & Lifestyle", "Services"])("includes the special when filtering by %s", (category) => {
    expect(specialMatchesTag(special, category)).toBe(true);
    expect(specialMatchesTag({ tag: "Accommodation" }, category)).toBe(false);
  });

  it("counts each special once per category across all three fields", () => {
    const counts = countSpecialTags([
      special,
      { tag: " home & lifestyle ", sub_tag_1: "Home  & Lifestyle", sub_tag_2: "HOME & LIFESTYLE" },
    ], ["Home & Lifestyle", "Shopping", "Services"]);
    expect(Object.fromEntries(counts)).toEqual({ "Home & Lifestyle": 2, Shopping: 1, Services: 1 });
  });

  it("ignores empty tag fields", () => {
    expect(collectSpecialTags({ tag: "Shopping", sub_tag_1: " ", sub_tag_2: null })).toEqual(["Shopping"]);
  });

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
