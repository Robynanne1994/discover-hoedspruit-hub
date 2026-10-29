import { describe, it, expect } from "vitest";
import { countSpecialKinds, specialMatchesKind } from "./specialKind";

describe("special type filter", () => {
  const list = [{ special_type: "Dinner Deal" }, { special_type: " dinner  deal " }, { special_type: "Spa Package" }, { special_type: null }];
  it("offers only populated values with counts", () => {
    const c = countSpecialKinds(list);
    expect(c.any).toBe(4);
    expect(c.options).toEqual([{ label: "Dinner Deal", count: 2 }, { label: "Spa Package", count: 1 }]);
  });
  it("matches ignoring case and spacing; Any matches all", () => {
    expect(list.filter((s) => specialMatchesKind(s, "DINNER DEAL")).length).toBe(2);
    expect(list.filter((s) => specialMatchesKind(s, "")).length).toBe(4);
  });
});
