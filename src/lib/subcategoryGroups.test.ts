import { describe, expect, it } from "vitest";
import {
  buildSubOptions,
  findSubcategoryGroup,
  groupKeyFor,
  subIdsForKey,
} from "./subcategoryGroups";

const SUBS = [
  { id: "nurseries-id", title: "Nurseries" },
  { id: "florists-id", title: "Florists" },
  { id: "hardware-id", title: "Hardware" },
  { id: "dcor-id", title: "Décor" },
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

  it("returns null for an unknown key", () => {
    expect(subIdsForKey("nope", SUBS)).toBeNull();
  });
});
