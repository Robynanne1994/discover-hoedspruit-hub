import { describe, it, expect } from "vitest";
import { sanitizeContactPairs, contactLabels } from "./contacts";

describe("event contact labels", () => {
  it("keeps each label with its contact when blanks are dropped", () => {
    expect(sanitizeContactPairs(["", "082 1", " 083 2 "], ["x", "After Hours", ""]))
      .toEqual({ values: ["082 1", "083 2"], labels: ["After Hours", ""] });
  });
  it("puts the primary label first", () => {
    expect(contactLabels(" Reception ", ["After Hours"])).toEqual(["Reception", "After Hours"]);
  });
});
