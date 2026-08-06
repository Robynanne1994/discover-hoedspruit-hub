import { describe, it, expect } from "vitest";
import {
  CATEGORY_CARD_LABEL_FIELD,
  getCSVHeadersForCategory,
  getUniversalCSVHeaders,
  getUniversalContentFields,
} from "./categoryFields";

// A sample of the universal content columns: name, contacts, location, hours.
// These are what a category upload must never be able to change.
const UNIVERSAL_SAMPLE = [
  "title_override", "long_description", "location", "phone", "email", "website",
  "whatsapp", "opening_hours", "is_featured", "google_rating", "km_from_town",
  "custom_title_1", "good_to_know",
];

const CATEGORIES = [
  "Restaurants & Cafés",
  "Accommodation",
  "Shopping",
  "NGOs & Volunteering",
  "Home & Garden",
  "Weddings & Events",
];

describe("universal vs category CSV columns", () => {
  it("keeps every universal content field off the category sheets", () => {
    for (const category of [...CATEGORIES, null]) {
      const headers = getCSVHeadersForCategory(category);
      for (const field of UNIVERSAL_SAMPLE) {
        expect(headers, `${field} leaked into the ${category} CSV`).not.toContain(field);
      }
    }
  });

  it("still gives every category sheet the title to match rows on", () => {
    for (const category of [...CATEGORIES, null]) {
      expect(getCSVHeadersForCategory(category)[0]).toBe("title");
    }
  });

  it("puts the universal content fields on the universal sheet", () => {
    const headers = getUniversalCSVHeaders();
    for (const field of UNIVERSAL_SAMPLE) expect(headers).toContain(field);
  });

  it("carries the category's own fields on its sheet only", () => {
    // cuisine is a Restaurant field; amenities is an Accommodation one.
    expect(getCSVHeadersForCategory("Restaurants & Cafés")).toContain("cuisine");
    expect(getCSVHeadersForCategory("Accommodation")).not.toContain("cuisine");
    expect(getCSVHeadersForCategory("Accommodation")).toContain("amenities");
    expect(getUniversalCSVHeaders()).not.toContain("cuisine");
  });
});

describe("card_primary_subcategory as a CSV column", () => {
  it("is on every category sheet, because the right label depends on the category", () => {
    for (const category of [...CATEGORIES, null]) {
      expect(getCSVHeadersForCategory(category)).toContain(CATEGORY_CARD_LABEL_FIELD);
    }
  });

  it("is on no universal sheet — that sheet has no category to answer for", () => {
    expect(getUniversalCSVHeaders()).not.toContain(CATEGORY_CARD_LABEL_FIELD);
    expect(getUniversalContentFields()).not.toContain(CATEGORY_CARD_LABEL_FIELD);
  });

  it("appears exactly once per category sheet", () => {
    for (const category of CATEGORIES) {
      const headers = getCSVHeadersForCategory(category);
      expect(headers.filter((h) => h === CATEGORY_CARD_LABEL_FIELD)).toHaveLength(1);
    }
  });
});

describe("getUniversalContentFields", () => {
  it("leaves out title, which is a row's match key rather than a value", () => {
    expect(getUniversalContentFields()).not.toContain("title");
  });

  it("leaves out google_place_id, which any sheet may fill in for the sync", () => {
    expect(getUniversalContentFields()).not.toContain("google_place_id");
    expect(getCSVHeadersForCategory("Shopping")).toContain("google_place_id");
  });
});
