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
  it("is true once the sync has stamped a fetch", () => {
    expect(isGoogleOwned({ google_synced_at: "2026-08-01T02:00:00.000Z" })).toBe(true);
  });

  it("is false for a listing the sync has never fetched", () => {
    expect(isGoogleOwned({ google_synced_at: null })).toBe(false);
    expect(isGoogleOwned({})).toBe(false);
  });

  it("is false for a new listing with no existing row", () => {
    expect(isGoogleOwned(null)).toBe(false);
    expect(isGoogleOwned(undefined)).toBe(false);
  });

  it("treats a blank timestamp as never synced", () => {
    expect(isGoogleOwned({ google_synced_at: "" })).toBe(false);
    expect(isGoogleOwned({ google_synced_at: "   " })).toBe(false);
  });

  // A listing can be matched to a Place ID (backfill) yet never refreshed, so the
  // match status alone must not lock the CSV out of the rating columns.
  it("ignores match status and keys only off the fetch timestamp", () => {
    const matchedButNeverFetched = {
      google_sync_status: "matched",
      google_place_id: "ChIJdummy",
      google_synced_at: null,
    };
    expect(isGoogleOwned(matchedButNeverFetched)).toBe(false);
  });
});
