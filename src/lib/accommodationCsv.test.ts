import { describe, expect, it } from "vitest";
import {
  accommodationPriceForExport,
  formatAccommodationPrice,
  normalizeAccommodationPriceRange,
} from "./accommodationCsv";

describe("accommodation CSV values", () => {
  it("formats plain nightly prices as rand with comma thousands separators", () => {
    expect(formatAccommodationPrice("2000")).toBe("R2,000");
    expect(formatAccommodationPrice("4400")).toBe("R4,400");
  });

  it("exports formatted nightly prices as plain numbers", () => {
    expect(accommodationPriceForExport("R2,000")).toBe("2000");
  });

  it("normalises every supported price range regardless of capitalisation", () => {
    expect(normalizeAccommodationPriceRange("Budget")).toBe("Budget");
    expect(normalizeAccommodationPriceRange("LUXURY")).toBe("Luxury");
    expect(normalizeAccommodationPriceRange("Mid-Range")).toBe("Mid-range");
    expect(normalizeAccommodationPriceRange("mid-range")).toBe("Mid-range");
  });
});