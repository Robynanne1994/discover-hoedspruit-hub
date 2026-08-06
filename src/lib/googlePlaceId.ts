// The Google Place ID column: the CSV's handle on a listing's Google profile.
//
// supabase/functions/refresh-google-ratings can only pull a rating and review
// count for a listing it holds a Place ID for. Its own text-search backfill is
// deliberately strict (0.75 name confidence, no shared IDs), so a fair number of
// listings never get matched automatically — a generic name, a Google profile
// spelled differently to the listing, a place sharing its name with a neighbour.
// The only way to reach those is to put the ID in by hand, which is what the CSV
// column is for: every ID filled in is one more listing the nightly sync covers.
//
// The ID is plumbing, not content. It is never rendered anywhere in the app; it
// exists so the sync can find the place.

/**
 * CSV column name. It sits on the universal ("All Categories") sheet only, as
 * its last column — like every other universal field, keeping it off the
 * category sheets means there is only ever one cell to fill in per listing.
 */
export const GOOGLE_PLACE_ID_FIELD = "google_place_id";

/**
 * Match confidence recorded for a hand-entered ID. The automatic backfill scores
 * a guess; a person who pasted the ID off the business's own Google profile did
 * not guess, so it lands at the top of the scale.
 */
export const MANUAL_PLACE_ID_CONFIDENCE = 1;

/**
 * Sync status that makes the refresh pick a listing up. `needs_match` is the one
 * status refresh-google-ratings refuses to write to, so a hand-entered ID has to
 * clear it or the ID would sit there doing nothing.
 */
export const MATCHED_SYNC_STATUS = "matched";

// Place IDs are URL-safe base64-ish tokens: "ChIJ...", "GhIJ...", the older
// "CmRYAAAA..." form, and the long "E..." encoded ones. Length varies a lot, so
// the shape is what's checked, not the size.
const PLACE_ID_PATTERN = /^[A-Za-z0-9_-]{10,512}$/;

/**
 * Read a Place ID out of a CSV cell.
 *
 * Accepts the bare ID, or the kind of thing that actually gets pasted: a Places
 * URL with `?place_id=`, or a Places API URL ending in `/places/<id>`. Returns
 * null for anything that isn't recognisably an ID, so a wrong paste is reported
 * rather than written — a bad ID would send the sync off to fetch someone else's
 * business.
 */
export function normalizeGooglePlaceId(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let value = raw.trim().replace(/^["']+|["']+$/g, "").trim();
  if (!value) return null;

  const fromQuery = value.match(/[?&](?:place_?id|placeid|cid_?id)=([^&#\s]+)/i);
  if (fromQuery) {
    try {
      value = decodeURIComponent(fromQuery[1]);
    } catch {
      value = fromQuery[1];
    }
  } else {
    // Places API v1 URLs only (/places/<id>). A maps.google.com /place/ path
    // holds the business *name*, not an ID, so it is deliberately not read here.
    const fromPath = value.match(/\/places\/([A-Za-z0-9_-]{10,})/);
    if (fromPath) value = fromPath[1];
  }

  value = value.trim();
  return PLACE_ID_PATTERN.test(value) ? value : null;
}

export type PlaceIdSyncState = {
  google_place_id?: string | null;
  google_synced_at?: string | null;
} | null | undefined;

/**
 * True when the CSV is pointing a listing at a different place to the one the
 * sync has been fetching. Its stored rating then belongs to the old place, so it
 * is stale rather than live and the CSV is free to overwrite it.
 */
export function isPlaceIdRepointed(incoming: string | null, existing: PlaceIdSyncState): boolean {
  if (!incoming) return false;
  const current = existing?.google_place_id ?? null;
  return current !== null && current !== incoming;
}

/**
 * The columns a CSV row's Place ID cell writes.
 *
 * `incoming` is the parsed cell: a normalised ID, `null` to clear (a "-" cell),
 * or `undefined` when the cell was blank on an update and means "leave it".
 *
 * Naming a place the row doesn't already hold also has to fix up the sync
 * bookkeeping around it, or the ID lands in a row the refresh still skips:
 *   - status goes to `matched`, because `needs_match` is never refreshed;
 *   - confidence goes to 1, because a person checked it;
 *   - swapping one ID for another also resets the fetch stamp and the cached
 *     place name, so the next run treats it as never fetched and the rating
 *     belonging to the old place gets replaced quickly.
 *
 * A cell that only repeats the ID already stored writes nothing but the ID
 * itself. Exports carry the stored ID back out, so most rows in a re-imported
 * CSV are echoing the database rather than making a decision — and flipping
 * status on an echo would quietly un-flag every listing parked at `needs_match`
 * because its automatic match was wrong.
 *
 * Clearing the ID clears all of it, including the fetch stamp — with no ID the
 * sync will never write those columns again, so the CSV has to own them.
 */
export function placeIdImportUpdate(
  incoming: string | null | undefined,
  existing: PlaceIdSyncState,
): Record<string, unknown> {
  if (incoming === undefined) return {};

  if (incoming === null) {
    return {
      google_place_id: null,
      google_place_name: null,
      google_sync_status: null,
      google_match_confidence: null,
      google_synced_at: null,
    };
  }

  if (incoming === (existing?.google_place_id ?? null)) {
    return { google_place_id: incoming };
  }

  const update: Record<string, unknown> = {
    google_place_id: incoming,
    google_sync_status: MATCHED_SYNC_STATUS,
    google_match_confidence: MANUAL_PLACE_ID_CONFIDENCE,
  };

  if (isPlaceIdRepointed(incoming, existing)) {
    update.google_place_name = null;
    update.google_synced_at = null;
  }

  return update;
}
