import { describe, it, expect } from "vitest";
import {
  CATEGORY_CARD_LABEL_FIELD,
  CATEGORY_MEMBERSHIP_FIELD,
  CATEGORY_SUBCATEGORY_FIELD,
  getCSVHeadersForCategory,
  getUniversalCSVHeaders,
  getUniversalContentFields,
  getUniversalDbFields,
} from "./categoryFields";
import { isImageCsvColumn } from "./csvImageColumns";

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
  "Trades & Services",
  "Wellness & Beauty",
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

  it("shares no column but title between a category sheet and the universal one", () => {
    // `title` is the row's match key, so both sheets need it. Every other column
    // belongs to exactly one sheet — nothing is filled in twice.
    const universal = new Set(getUniversalCSVHeaders());
    for (const category of [...CATEGORIES, null]) {
      const shared = getCSVHeadersForCategory(category).filter((h) => universal.has(h));
      expect(shared, `${category} CSV repeats universal columns`).toEqual(["title"]);
    }
  });

  it("keeps image columns off every sheet — images are set in the backend only", () => {
    for (const category of [...CATEGORIES, null]) {
      expect(getCSVHeadersForCategory(category).filter(isImageCsvColumn)).toEqual([]);
    }
    expect(getUniversalCSVHeaders().filter(isImageCsvColumn)).toEqual([]);
  });

  it("carries the category's own fields on its sheet only", () => {
    // cuisine is a Restaurant field; sleeps is an Accommodation one.
    expect(getCSVHeadersForCategory("Restaurants & Cafés")).toContain("cuisine");
    expect(getCSVHeadersForCategory("Accommodation")).not.toContain("cuisine");
    expect(getCSVHeadersForCategory("Accommodation")).toContain("sleeps");
    expect(getUniversalCSVHeaders()).not.toContain("cuisine");
  });

  it("leaves amenities off the Accommodation sheet — each amenity has its own column", () => {
    expect(getCSVHeadersForCategory("Accommodation")).not.toContain("amenities");
    expect(getUniversalCSVHeaders()).not.toContain("amenities");
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

describe("categories vs subcategories as CSV columns", () => {
  it("asks for the listing's category set on the universal sheet alone", () => {
    // Which categories a listing belongs to is one answer for the whole listing,
    // so it is given once. A category sheet already knows its own category.
    expect(getUniversalCSVHeaders()).toContain(CATEGORY_MEMBERSHIP_FIELD);
    for (const category of [...CATEGORIES, null]) {
      expect(
        getCSVHeadersForCategory(category),
        `${category} CSV repeats the categories column`,
      ).not.toContain(CATEGORY_MEMBERSHIP_FIELD);
    }
  });

  it("asks for subcategories on the category sheets alone", () => {
    // Subcategories are per category — "Nurseries" under Home & Garden and
    // "Builders" under Building & Renovation — so the universal sheet, which has
    // no category to scope them to, never asks.
    for (const category of [...CATEGORIES, null]) {
      expect(getCSVHeadersForCategory(category)).toContain(CATEGORY_SUBCATEGORY_FIELD);
    }
    expect(getUniversalCSVHeaders()).not.toContain(CATEGORY_SUBCATEGORY_FIELD);
  });

  it("keeps both junction columns out of the DB field list", () => {
    // They are junction tables, not columns on `listings`: writing either into a
    // listings payload would fail the upsert.
    const dbFields = getUniversalDbFields();
    expect(dbFields).not.toContain(CATEGORY_MEMBERSHIP_FIELD);
    expect(dbFields).not.toContain(CATEGORY_SUBCATEGORY_FIELD);
  });

  it("makes a category upload read past a leftover categories column", () => {
    // An older category export still carries one. It is reported and ignored
    // rather than written, so the universal sheet stays the only thing that can
    // move a listing between categories.
    expect(getUniversalContentFields()).toContain(CATEGORY_MEMBERSHIP_FIELD);
    expect(getUniversalContentFields()).not.toContain(CATEGORY_SUBCATEGORY_FIELD);
  });
});

describe("getUniversalContentFields", () => {
  it("leaves out title, which is a row's match key rather than a value", () => {
    expect(getUniversalContentFields()).not.toContain("title");
  });

  it("covers google_place_id, which the universal sheet alone fills in", () => {
    expect(getUniversalContentFields()).toContain("google_place_id");
    expect(getCSVHeadersForCategory("Shopping")).not.toContain("google_place_id");
  });
});
