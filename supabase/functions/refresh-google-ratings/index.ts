// Refreshes Google ratings for listings.
//
// Backend only: the Google key lives in GOOGLE_PLACES_API_KEY and never leaves
// this function. Called by the nightly cron job (or manually with an admin
// bearer token); anonymous callers are rejected.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const GOOGLE_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const DEFAULT_LIMIT = 32;
const HIGH_PRIORITY_DAYS = 6;
const NORMAL_PRIORITY_DAYS = 25;
const CALL_DELAY_MS = 100;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Listing = { id: string; title: string; google_place_id: string | null };

// Either the scheduled job (shared job token) or a signed-in admin may run this.
async function authorise(req: Request): Promise<boolean> {
  const jobToken = Deno.env.get("RATINGS_JOB_TOKEN") ?? "";
  const presented = req.headers.get("x-job-token") ?? "";
  if (jobToken && presented && presented === jobToken) return true;

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return false;
  if (token === SERVICE_ROLE_KEY) return true;

  const client = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getClaims(token);
  const userId = data?.claims?.sub;
  if (error || !userId) return false;

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: isAdmin } = await admin.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  return isAdmin === true;
}

async function runBackfill(admin: ReturnType<typeof createClient>, limit: number) {
  const { data, error } = await admin
    .from("listings")
    .select("id, title, google_place_id")
    .is("google_place_id", null)
    .limit(limit);
  if (error) throw new Error(error.message);

  const listings = (data ?? []) as Listing[];
  let succeeded = 0;
  const failed: string[] = [];

  for (const listing of listings) {
    try {
      const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_KEY,
          "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress",
        },
        body: JSON.stringify({
          textQuery: `${listing.title} Hoedspruit Limpopo South Africa`,
          pageSize: 1,
          locationBias: {
            circle: {
              center: { latitude: -24.3548, longitude: 30.954 },
              radius: 30000.0,
            },
          },
        }),
      });

      if (!res.ok) throw new Error(`Google returned ${res.status}`);
      const body = await res.json();
      const place = body?.places?.[0];

      if (place?.id) {
        await admin
          .from("listings")
          .update({
            google_place_id: place.id,
            google_place_name: place.displayName?.text ?? null,
            google_sync_status: "matched",
          })
          .eq("id", listing.id);
        succeeded++;
      } else {
        await admin
          .from("listings")
          .update({ google_sync_status: "not_found" })
          .eq("id", listing.id);
        failed.push(listing.title);
      }
    } catch (err) {
      console.error("backfill failed", listing.title, err);
      await admin
        .from("listings")
        .update({ google_sync_status: "error" })
        .eq("id", listing.id);
      failed.push(listing.title);
    }
    await sleep(CALL_DELAY_MS);
  }

  return { mode: "backfill", processed: listings.length, succeeded, failedCount: failed.length, failed };
}

async function selectDue(
  admin: ReturnType<typeof createClient>,
  priority: "high" | "normal",
  staleDays: number,
  limit: number,
) {
  if (limit <= 0) return [] as Listing[];
  const cutoff = new Date(Date.now() - staleDays * 86400000).toISOString();
  const { data, error } = await admin
    .from("listings")
    .select("id, title, google_place_id")
    .eq("refresh_priority", priority)
    .not("google_place_id", "is", null)
    .or(`google_synced_at.is.null,google_synced_at.lt.${cutoff}`)
    .order("google_synced_at", { ascending: true, nullsFirst: true })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as Listing[];
}

async function runRefresh(admin: ReturnType<typeof createClient>, limit: number) {
  const high = await selectDue(admin, "high", HIGH_PRIORITY_DAYS, limit);
  const normal = await selectDue(admin, "normal", NORMAL_PRIORITY_DAYS, limit - high.length);
  // Hard cap: the run never touches more than `limit` listings.
  const work = [...high, ...normal].slice(0, limit);

  let succeeded = 0;
  const failed: string[] = [];

  for (const listing of work) {
    try {
      const res = await fetch(
        `https://places.googleapis.com/v1/places/${encodeURIComponent(listing.google_place_id!)}`,
        {
          headers: {
            "X-Goog-Api-Key": GOOGLE_KEY,
            "X-Goog-FieldMask": "id,displayName,rating,userRatingCount,googleMapsLinks",
          },
        },
      );
      if (!res.ok) throw new Error(`Google returned ${res.status}`);
      const place = await res.json();

      const update: Record<string, unknown> = {
        google_place_name: place?.displayName?.text ?? null,
        google_synced_at: new Date().toISOString(),
        google_sync_status: "matched",
      };
      if (typeof place?.rating === "number") update.google_rating = place.rating;
      if (typeof place?.userRatingCount === "number") update.google_reviews_count = place.userRatingCount;
      const reviewsUri = place?.googleMapsLinks?.reviewsUri;
      if (reviewsUri) update.google_reviews_url = reviewsUri;

      const { error } = await admin.from("listings").update(update).eq("id", listing.id);
      if (error) throw new Error(error.message);
      succeeded++;
    } catch (err) {
      console.error("refresh failed", listing.title, err);
      await admin
        .from("listings")
        .update({ google_sync_status: "error" })
        .eq("id", listing.id);
      failed.push(listing.title);
    }
    await sleep(CALL_DELAY_MS);
  }

  return { mode: "refresh", processed: work.length, succeeded, failedCount: failed.length, failed };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!(await authorise(req))) return json({ error: "Unauthorized" }, 401);
    if (!GOOGLE_KEY) return json({ error: "GOOGLE_PLACES_API_KEY is not configured" }, 500);

    let mode = "refresh";
    let limit = DEFAULT_LIMIT;
    try {
      const body = await req.json();
      if (body?.mode === "backfill" || body?.mode === "refresh") mode = body.mode;
      const parsed = Number(body?.limit);
      if (Number.isFinite(parsed) && parsed > 0) limit = Math.min(Math.floor(parsed), 200);
    } catch {
      // no body: defaults stand
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const summary = mode === "backfill" ? await runBackfill(admin, limit) : await runRefresh(admin, limit);
    return json(summary);
  } catch (err) {
    console.error("refresh-google-ratings error", err);
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
