// Who owns a listing's Google rating columns: the nightly Places sync, or the CSV?
//
// supabase/functions/refresh-google-ratings only reaches listings it has managed
// to match to a Google Place ID. Everything else (no match, confidence below the
// 0.75 bar, a duplicate Place ID, a listing still awaiting a stricter re-match)
// never gets a rating from Google, so those rows have to be filled by hand via
// the CSV import.
//
// The two sources must not fight. Once the sync has successfully written a row,
// its numbers are live and a CSV — which is a snapshot of whatever the numbers
// were the day it was exported — would silently roll them back.

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
 * True when the live sync has written this listing's rating columns, so a CSV
 * import must leave them alone.
 *
 * `google_synced_at` is the signal: refresh-google-ratings stamps it only after
 * Google actually returns the place, and never on a match attempt, a failure, or
 * a backfill. A row with a timestamp therefore has numbers straight from Google;
 * a row without one has never had any, whatever its match status says.
 */
export function isGoogleOwned(
  existing: { google_synced_at?: string | null } | null | undefined,
): boolean {
  const syncedAt = existing?.google_synced_at;
  return typeof syncedAt === "string" && syncedAt.trim() !== "";
}
