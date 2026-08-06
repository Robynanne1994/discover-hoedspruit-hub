import { describe, it, expect } from "vitest";
import {
  GOOGLE_PLACE_ID_FIELD,
  MANUAL_PLACE_ID_CONFIDENCE,
  isPlaceIdRepointed,
  normalizeGooglePlaceId,
  placeIdImportUpdate,
} from "./googlePlaceId";
import { getCSVHeadersForCategory, getUniversalCSVHeaders, getUniversalDbFields } from "./categoryFields";

const PLACE_ID = "ChIJN1t_tDeuEmsRUsoyG83frY4";

describe("normalizeGooglePlaceId", () => {
  it("accepts a bare Place ID", () => {
    expect(normalizeGooglePlaceId(PLACE_ID)).toBe(PLACE_ID);
  });

  it("trims whitespace and stray quotes from a pasted cell", () => {
    expect(normalizeGooglePlaceId(`  "${PLACE_ID}"  `)).toBe(PLACE_ID);
  });

  it("reads the ID out of a Maps URL that carries place_id", () => {
    expect(normalizeGooglePlaceId(`https://www.google.com/maps/place/?q=place_id:x&place_id=${PLACE_ID}`))
      .toBe(PLACE_ID);
  });

  it("reads the ID out of a Places API URL", () => {
    expect(normalizeGooglePlaceId(`https://places.googleapis.com/v1/places/${PLACE_ID}`)).toBe(PLACE_ID);
  });

  it("refuses a Maps link that only names the business", () => {
    // /maps/place/<name> is the business name, not an ID — reading it would send
    // the sync off to fetch a place chosen by a URL slug.
    expect(normalizeGooglePlaceId("https://www.google.com/maps/place/Hat+and+Creek/@-24.35,30.95,17z"))
      .toBeNull();
  });

  it("refuses anything that isn't shaped like an ID", () => {
    expect(normalizeGooglePlaceId("not an id")).toBeNull();
    expect(normalizeGooglePlaceId("ChIJ")).toBeNull();
    expect(normalizeGooglePlaceId("")).toBeNull();
    expect(normalizeGooglePlaceId(null)).toBeNull();
    expect(normalizeGooglePlaceId(42)).toBeNull();
  });
});

describe("isPlaceIdRepointed", () => {
  it("is true when the CSV swaps in a different place", () => {
    expect(isPlaceIdRepointed(PLACE_ID, { google_place_id: "ChIJsomethingelseentirely" })).toBe(true);
  });

  it("is false for the same place, or a listing that had none", () => {
    expect(isPlaceIdRepointed(PLACE_ID, { google_place_id: PLACE_ID })).toBe(false);
    expect(isPlaceIdRepointed(PLACE_ID, { google_place_id: null })).toBe(false);
    expect(isPlaceIdRepointed(PLACE_ID, null)).toBe(false);
    expect(isPlaceIdRepointed(null, { google_place_id: PLACE_ID })).toBe(false);
  });
});

describe("placeIdImportUpdate", () => {
  it("writes nothing when the cell was blank on an update", () => {
    expect(placeIdImportUpdate(undefined, { google_place_id: PLACE_ID })).toEqual({});
  });

  it("puts a hand-entered ID somewhere the refresh will actually pick it up", () => {
    // 'needs_match' is the one status the refresh skips, so a listing parked
    // there would keep its new ID and still never be fetched.
    expect(placeIdImportUpdate(PLACE_ID, { google_place_id: null })).toEqual({
      google_place_id: PLACE_ID,
      google_sync_status: "matched",
      google_match_confidence: MANUAL_PLACE_ID_CONFIDENCE,
    });
  });

  it("writes the ID and nothing else when the cell repeats what's stored", () => {
    // An export carries the stored ID back out, so a re-imported CSV echoes it
    // for nearly every row. Treating that echo as a decision would un-flag every
    // listing someone parked at needs_match because its auto-match was wrong.
    expect(placeIdImportUpdate(PLACE_ID, {
      google_place_id: PLACE_ID,
      google_synced_at: "2026-08-01T02:00:00.000Z",
    })).toEqual({ google_place_id: PLACE_ID });
  });

  it("resets the fetch stamp when the CSV points at a different place", () => {
    // The stored rating belongs to the old place, so it has to stop counting as
    // live: cleared stamp means the next run re-fetches it as never fetched.
    expect(placeIdImportUpdate(PLACE_ID, {
      google_place_id: "ChIJsomethingelseentirely",
      google_synced_at: "2026-08-01T02:00:00.000Z",
    })).toEqual({
      google_place_id: PLACE_ID,
      google_sync_status: "matched",
      google_match_confidence: MANUAL_PLACE_ID_CONFIDENCE,
      google_place_name: null,
      google_synced_at: null,
    });
  });

  it("clears every synced column when the ID is removed", () => {
    // With no ID the sync will never write these again, so the CSV takes them back.
    expect(placeIdImportUpdate(null, { google_place_id: PLACE_ID, google_synced_at: "2026-08-01T02:00:00.000Z" }))
      .toEqual({
        google_place_id: null,
        google_place_name: null,
        google_sync_status: null,
        google_match_confidence: null,
        google_synced_at: null,
      });
  });
});

describe("google_place_id as a CSV column", () => {
  it("is the very last column of the universal CSV", () => {
    const headers = getUniversalCSVHeaders();
    expect(headers[headers.length - 1]).toBe(GOOGLE_PLACE_ID_FIELD);
    expect(headers.filter((h) => h === GOOGLE_PLACE_ID_FIELD)).toHaveLength(1);
  });

  it("is off the category sheets, so there is one cell to fill in per listing", () => {
    for (const category of ["Restaurants & Cafés", "Accommodation", "Shopping", "NGOs & Volunteering", null]) {
      expect(getCSVHeadersForCategory(category)).not.toContain(GOOGLE_PLACE_ID_FIELD);
    }
  });

  it("is written by the universal import", () => {
    expect(getUniversalDbFields()).toContain(GOOGLE_PLACE_ID_FIELD);
  });
});
