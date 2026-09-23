import { describe, it, expect } from "vitest";
import {
  GOOGLE_SYNCED_FIELDS,
  isGoogleOwned,
  isGoogleSyncedField,
} from "./googleFieldOwnership";

describe("isGoogleSyncedField", () => {
  it("covers exactly the columns refresh-google-ratings writes", () => {
    expect([...GOOGLE_SYNCED_FIELDS]).toEqual([
      "google_rating",
      "google_reviews_count",
      "google_reviews_url",
    ]);
  });

  it("does not claim neighbouring google_* columns the CSV still owns", () => {
    expect(isGoogleSyncedField("google_maps_link")).toBe(false);
    expect(isGoogleSyncedField("google_place_id")).toBe(false);
    expect(isGoogleSyncedField("title")).toBe(false);
  });
});

describe("isGoogleOwned", () => {
  it("is true for any listing holding a Place ID, fetched or not", () => {
    expect(isGoogleOwned({ google_place_id: "ChIJdummy" })).toBe(true);
    // Matched but never fetched still belongs to the sync: the next run writes it.
    expect(isGoogleOwned({ google_place_id: "ChIJdummy", google_synced_at: null } as any)).toBe(true);
  });

  it("is false for a listing with no Place ID, even with an old fetch stamp", () => {
    expect(isGoogleOwned({ google_place_id: null })).toBe(false);
    expect(isGoogleOwned({ google_place_id: null, google_synced_at: "2026-08-01T02:00:00.000Z" } as any)).toBe(false);
    expect(isGoogleOwned({})).toBe(false);
    expect(isGoogleOwned({ google_place_id: "   " })).toBe(false);
  });

  it("is false for a new listing with no existing row", () => {
    expect(isGoogleOwned(null)).toBe(false);
    expect(isGoogleOwned(undefined)).toBe(false);
  });
});
