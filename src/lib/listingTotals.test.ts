import { describe, expect, it } from "vitest";
import { countUniqueBusinesses } from "./listingTotals";

describe("countUniqueBusinesses", () => {
  it("counts a business only once when it belongs to multiple categories", () => {
    const categoryListingIds = [
      "business-1", // Restaurants & Cafés
      "business-1", // Shopping
      "business-2", // Restaurants & Cafés
    ];

    expect(countUniqueBusinesses(categoryListingIds)).toBe(2);
  });
});
