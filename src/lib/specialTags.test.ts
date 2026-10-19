import { describe, expect, it } from "vitest";
import { SPECIAL_TAG_PRESETS, PILL_CATEGORIES, pillCategories, tagKey, uniqueTags, collectSpecialTags, specialMatchesTag, countSpecialTags } from "./specialTags";

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
    expect(tagKey("  Home  &   Lifestyle ")).toBe("home lifestyle");
    expect(tagKey("Home & Lifestyle")).toBe(tagKey("home & lifestyle"));
    expect(tagKey(null)).toBe("");
  });

  it("ignores punctuation so punctuation variants match", () => {
    expect(tagKey("Buy 1; Get 1")).toBe("buy 1 get 1");
    expect(tagKey("Buy 1, Get 1")).toBe(tagKey("Buy 1; Get 1"));
    expect(tagKey("Buy 1: get 1!")).toBe(tagKey("Buy 1; Get 1"));
  });

  it("exposes exactly Robyn's fixed pill list", () => {
    expect(PILL_CATEGORIES).toEqual([
      "Accommodation",
      "Food & Drink",
      "Services",
      "Activities",
      "Wellness",
      "Beauty",
      "Home & Lifestyle",
      "Shopping",
      "Couples",
      "Buy 1; Get 1",
    ]);
  });

  it("only offers pills for whitelisted categories actually in use", () => {
    const specials = [
      { tag: "Shopping", sub_tag_1: "Spare Parts", sub_tag_2: "Buy 1 Get 1" },
      { tag: "food & drink" },
    ];
    expect(pillCategories(specials)).toEqual(["Buy 1; Get 1", "Food & Drink", "Shopping"]);
  });

  it("never offers a pill for a tag outside the fixed list", () => {
    const specials = [{ tag: "Wedding Venue" }, { tag: "Motorbike Rental" }];
    expect(pillCategories(specials)).toEqual([]);
  });

  it("matches Couples and Buy 1; Get 1 however they are typed", () => {
    expect(specialMatchesTag({ sub_tag_2: "couples" }, "Couples")).toBe(true);
    expect(specialMatchesTag({ tag: "Buy 1 Get 1" }, "Buy 1; Get 1")).toBe(true);
  });
});
