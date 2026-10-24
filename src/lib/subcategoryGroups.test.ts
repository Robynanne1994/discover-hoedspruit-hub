import { describe, expect, it } from "vitest";
import {
  buildSubOptions,
  findSubcategoryGroup,
  groupAppliesToCategory,
  groupKeyFor,
  subIdsForKey,
} from "./subcategoryGroups";

const SUBS = [
  { id: "nurseries-id", title: "Nurseries" },
  { id: "florists-id", title: "Florists" },
  { id: "hardware-id", title: "Hardware" },
  { id: "dcor-id", title: "Décor" },
];

const SHOPPING = [
  { id: "pet-id", title: "Pet Supplies" },
  { id: "farm-id", title: "Farm Supplies" },
  { id: "farm-animal-id", title: "Farm / Animal Supplies" },
  { id: "gifts-id", title: "Gifts & Curios" },
];

const CLEAN_SHOPPING = [
  { id: "clean-id", title: "Cleaning Supplies" },
  { id: "hosp-id", title: "Hospitality Supplies" },
  { id: "gifts-id", title: "Gifts & Curios" },
];

describe("buildSubOptions", () => {
  it("merges nurseries and florists into one option with both ids", () => {
    const opts = buildSubOptions(SUBS);
    const merged = opts.find((o) => o.label === "Nurseries & Florists");
    expect(merged).toBeDefined();
    expect(merged!.subIds.sort()).toEqual(["florists-id", "nurseries-id"]);
    // The two members no longer appear as their own options.
    expect(opts.find((o) => o.key === "nurseries-id")).toBeUndefined();
    expect(opts.find((o) => o.key === "florists-id")).toBeUndefined();
    // Standalone subcategories are untouched and keep their order.
    expect(opts.find((o) => o.key === "hardware-id")).toBeDefined();
    expect(opts.find((o) => o.key === "dcor-id")).toBeDefined();
  });

  it("matches titles case-insensitively and ignores surrounding spaces", () => {
    const opts = buildSubOptions([
      { id: "a", title: " nurseries " },
      { id: "b", title: "FLORISTS" },
    ]);
    expect(opts).toHaveLength(1);
    expect(opts[0].label).toBe("Nurseries & Florists");
  });

  it("only creates the merged option when at least one member exists", () => {
    const opts = buildSubOptions([{ id: "x", title: "Hardware" }]);
    expect(opts).toHaveLength(1);
    expect(opts[0].label).toBe("Hardware");
  });

  it("merges pet and farm supplies into one option inside Shopping", () => {
    const opts = buildSubOptions(SHOPPING, "Shopping");
    const merged = opts.find((o) => o.label === "Pet & Farm Supplies");
    expect(merged).toBeDefined();
    expect(merged!.subIds.sort()).toEqual(["farm-animal-id", "farm-id", "pet-id"]);
    // The members no longer appear as their own options.
    expect(opts.find((o) => o.key === "pet-id")).toBeUndefined();
    expect(opts.find((o) => o.key === "farm-id")).toBeUndefined();
    // Everything else keeps its own option.
    expect(opts.find((o) => o.key === "gifts-id")).toBeDefined();
  });

  it("leaves pet supplies alone outside the group's main category", () => {
    const opts = buildSubOptions(SHOPPING, "Pets & Vets");
    expect(opts.find((o) => o.label === "Pet & Farm Supplies")).toBeUndefined();
    expect(opts.find((o) => o.key === "pet-id")?.label).toBe("Pet Supplies");
    expect(opts.find((o) => o.key === "farm-id")?.label).toBe("Farm Supplies");
  });

  it("still merges when only one member is present", () => {
    const opts = buildSubOptions([{ id: "p", title: "Pet Supplies" }], "Shopping");
    expect(opts).toHaveLength(1);
    expect(opts[0].label).toBe("Pet & Farm Supplies");
    expect(opts[0].subIds).toEqual(["p"]);
  });

  it("merges cleaning and hospitality supplies into one option inside Shopping", () => {
    const opts = buildSubOptions(CLEAN_SHOPPING, "Shopping");
    const merged = opts.find((o) => o.label === "Cleaning & Hospitality Supplies");
    expect(merged).toBeDefined();
    expect(merged!.subIds.sort()).toEqual(["clean-id", "hosp-id"]);
    // The members no longer appear as their own options.
    expect(opts.find((o) => o.key === "clean-id")).toBeUndefined();
    expect(opts.find((o) => o.key === "hosp-id")).toBeUndefined();
    // Everything else keeps its own option.
    expect(opts.find((o) => o.key === "gifts-id")).toBeDefined();
  });

  it("leaves cleaning and hospitality supplies alone outside Shopping", () => {
    const opts = buildSubOptions(CLEAN_SHOPPING, "Trades & Services");
    expect(opts.find((o) => o.label === "Cleaning & Hospitality Supplies")).toBeUndefined();
    expect(opts.find((o) => o.key === "clean-id")?.label).toBe("Cleaning Supplies");
    expect(opts.find((o) => o.key === "hosp-id")?.label).toBe("Hospitality Supplies");
  });
});

describe("groupAppliesToCategory", () => {
  it("applies everywhere when no categoryTitles are set", () => {
    const g = findSubcategoryGroup(groupKeyFor(["nurseries", "florists"]))!;
    expect(groupAppliesToCategory(g, "Anything")).toBe(true);
    expect(groupAppliesToCategory(g, null)).toBe(true);
  });

  it("applies only inside its listed categories, ignoring case", () => {
    const g = findSubcategoryGroup(groupKeyFor(["pet supplies", "farm supplies", "farm / animal supplies"]))!;
    expect(groupAppliesToCategory(g, "shopping")).toBe(true);
    expect(groupAppliesToCategory(g, "Pets & Vets")).toBe(false);
    expect(groupAppliesToCategory(g, undefined)).toBe(false);
  });
});

describe("groupKeyFor / findSubcategoryGroup", () => {
  it("round-trips a group key regardless of member order", () => {
    const key = groupKeyFor(["Florists", "Nurseries"]);
    const g = findSubcategoryGroup(key);
    expect(g?.label).toBe("Nurseries & Florists");
    expect(findSubcategoryGroup(groupKeyFor(["nurseries", "florists"]))?.label).toBe(
      "Nurseries & Florists",
    );
  });

  it("returns null for keys that are not merged groups", () => {
    expect(findSubcategoryGroup("nurseries-id")).toBeNull();
    expect(findSubcategoryGroup("merged:bogus")).toBeNull();
  });
});

describe("subIdsForKey", () => {
  it("expands a merged key to both subcategory ids", () => {
    const ids = subIdsForKey(groupKeyFor(["nurseries", "florists"]), SUBS);
    expect(ids!.sort()).toEqual(["florists-id", "nurseries-id"]);
  });

  it("resolves an old single-sub id inside a merged group to the whole group", () => {
    // Deep links saved before the merge still resolve.
    expect(subIdsForKey("nurseries-id", SUBS)).toEqual(["nurseries-id", "florists-id"]);
  });

  it("expands the pet and farm key to every member id", () => {
    const ids = subIdsForKey(groupKeyFor(["pet supplies", "farm supplies", "farm / animal supplies"]), SHOPPING);
    expect(ids!.sort()).toEqual(["farm-animal-id", "farm-id", "pet-id"]);
  });

  it("expands the cleaning and hospitality key to both member ids", () => {
    const ids = subIdsForKey(groupKeyFor(["cleaning supplies", "hospitality supplies"]), CLEAN_SHOPPING);
    expect(ids!.sort()).toEqual(["clean-id", "hosp-id"]);
  });

  it("resolves an old cleaning supplies id to the whole group", () => {
    expect(subIdsForKey("clean-id", CLEAN_SHOPPING)!.sort()).toEqual(["clean-id", "hosp-id"]);
  });

  it("returns null for an unknown key", () => {
    expect(subIdsForKey("nope", SUBS)).toBeNull();
  });
});
