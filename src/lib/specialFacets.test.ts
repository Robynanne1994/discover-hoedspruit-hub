import { describe, expect, it } from "vitest";
import { countSpecialFacets, specialMatchesFacets, type SpecialFacetState } from "./specialFacets";

const rows = [
  { title: "Family Lunch", tag: "Food & Drink", booking_link: "https://example.com/book", discount_type: "percent_off", special_type: "Lunch" },
  { title: "Dinner", tag: "Food & Drink", discount_type: "fixed_price", special_type: "Dinner" },
  { title: "Stay", tag: "Accommodation", booking_link: "https://example.com/book", discount_type: "fixed_price", special_type: "Stay" },
];
const defaults: SpecialFacetState = { search: "", categories: [], validity: "all", booking: "any", savings: "any", kind: "" };

describe("specials faceted filters", () => {
  it("counts categories against booking and savings, ignoring their own selection", () => {
    const counts = countSpecialFacets(rows, { ...defaults, categories: ["Accommodation"], booking: "required", savings: "percent_off" });
    expect(counts.category.get("Food & Drink")).toBe(1);
    expect(counts.category.get("Accommodation")).toBe(0);
    expect(counts.categoryTotal).toBe(1);
  });
  it("counts booking against all other filters, but not itself", () => {
    const counts = countSpecialFacets(rows, { ...defaults, categories: ["Food & Drink"], booking: "not-required", savings: "percent_off" });
    expect(counts.booking).toEqual({ any: 1, required: 1, "not-required": 0 });
  });
  it("counts savings against booking and category", () => {
    const counts = countSpecialFacets(rows, { ...defaults, categories: ["Food & Drink"], booking: "required" });
    expect(counts.savings.percent_off).toBe(1);
    expect(counts.savings.fixed_price).toBe(0);
  });
  it("keeps selected zero-result kinds available to clear", () => {
    const counts = countSpecialFacets(rows, { ...defaults, categories: ["Accommodation"], kind: "Lunch" });
    expect(counts.kinds.options).toContainEqual({ label: "Lunch", count: 0 });
  });
  it("combines category and validity rather than replacing either", () => {
    const dated = [...rows, { title: "Future Stay", tag: "Accommodation", valid_from: "2099-01-01" }];
    const state = { ...defaults, categories: ["Accommodation"], validity: "upcoming" as const };
    expect(dated.filter((s) => specialMatchesFacets(s, state)).map((s) => s.title)).toEqual(["Future Stay"]);
    expect(countSpecialFacets(dated, state).validity).toEqual({ all: 2, upcoming: 1, "ending-soon": 0, ongoing: 1 });
  });
});