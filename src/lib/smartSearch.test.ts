import { describe, it, expect } from "vitest";
import { categoryMatchesTerm, rankSmartResults } from "./smartSearch";

describe("smartSearch", () => {
  it("matches 'school' to a plural category", () => {
    expect(categoryMatchesTerm("school", "Schools & Education")).toBe(true);
  });
  it("does not match unrelated categories", () => {
    expect(categoryMatchesTerm("school", "Restaurants & Cafes")).toBe(false);
  });
  it("puts title matches before category matches", () => {
    const r = rankSmartResults([{ id: "a" }], [{ id: "b" }, { id: "a" }]);
    expect(r.map((x) => x.id)).toEqual(["a", "b"]);
  });
});

import { titleSearchRegex } from "./smartSearch";
describe("titleSearchRegex", () => {
  it.each(["farmwatch", "farm watch", "plaas wag", "plaaswag", "Farm Watch"])("%s finds Farm Watch", (t) => {
    expect(new RegExp(titleSearchRegex(t), "i").test("Hoedspruit Farm Watch (Plaaswag)")).toBe(true);
  });
});
