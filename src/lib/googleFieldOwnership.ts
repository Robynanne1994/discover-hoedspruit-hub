// Who owns a listing's Google rating columns: the nightly Places sync, or the CSV?
//
// supabase/functions/refresh-google-ratings reaches every listing that holds a
// Google Place ID. Those listings' rating columns belong to the sync: a CSV (a
// snapshot of whatever the numbers were the day it was exported) or a form in
// the editor must never write them, or it rolls live data back.
//
// Listings with no Place ID are never fetched, so for them the CSV and the
// editor are the only source and may set the numbers by hand.
//
// Ownership is decided by *having a Place ID*, not by google_synced_at: an ID
// that has been entered but not fetched yet is about to be written by the sync,
// and letting the CSV write in the meantime is how stale numbers get back in.

/** Columns written by a successful Places fetch in refresh-google-ratings. */
export const GOOGLE_SYNCED_FIELDS = [
  "google_rating",
  "google_reviews_count",
  "google_reviews_url",
] as const;

export type GoogleSyncedField = (typeof GOOGLE_SYNCED_FIELDS)[number];

const googleSyncedFieldSet = new Set<string>(GOOGLE_SYNCED_FIELDS);

export function isGoogleSyncedField(field: string): field is GoogleSyncedField {
  return googleSyncedFieldSet.has(field);
}

/**
 * True when the listing holds a Google Place ID, so its rating columns are the
 * sync's and a CSV import or editor save must leave them alone.
 */
export function isGoogleOwned(
  existing: { google_place_id?: string | null } | null | undefined,
): boolean {
  const placeId = existing?.google_place_id;
  return typeof placeId === "string" && placeId.trim() !== "";
}
