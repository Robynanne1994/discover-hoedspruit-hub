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

type Listing = {
  id: string;
  title: string;
  location?: string | null;
  google_place_id: string | null;
};

// Minimum title-vs-Google-name similarity we accept. Deliberately strict: a
// missed match is harmless, a wrong match is not.
const MIN_CONFIDENCE = 0.75;

function normaliseName(input: string): string {
  return input
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\b(the|pty|ltd|hoedspruit|sa|south africa|limpopo)\b/g, " ")
    .replace(/[^a-z0-9 ]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function levenshteinRatio(a: string, b: string): number {
  if (!a.length || !b.length) return 0;
  const prev = new Array(b.length + 1).fill(0).map((_, i) => i);
  const cur = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    for (let j = 0; j <= b.length; j++) prev[j] = cur[j];
  }
  return 1 - prev[b.length] / Math.max(a.length, b.length);
}

// Confidence in [0,1]. Full containment or full token overlap counts as strong.
function nameConfidence(title: string, googleName: string): number {
  const a = normaliseName(title);
  const b = normaliseName(googleName);
  if (!a || !b) return 0;
  if (a === b) return 1;
  const tokensA = new Set(a.split(" "));
  const tokensB = new Set(b.split(" "));
  let shared = 0;
  for (const t of tokensA) if (tokensB.has(t)) shared++;
  const jaccard = shared / (tokensA.size + tokensB.size - shared);
  const contained = a.includes(b) || b.includes(a) ? 0.95 : 0;
  return Math.max(levenshteinRatio(a, b), jaccard, contained);
}

// Constant-time string compare so a wrong job token leaks no timing signal.
function tokensMatch(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Either the scheduled job (shared job token) or a signed-in admin may run this.
// Anything else -- including a bare anon/publishable key, which anyone reading
// the shipped frontend has -- is rejected.
async function authorise(req: Request): Promise<boolean> {
  const jobToken = Deno.env.get("RATINGS_JOB_TOKEN") ?? "";
  const presented = req.headers.get("x-job-token") ?? "";
  if (jobToken && presented && tokensMatch(presented, jobToken)) return true;

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return false;
  if (token === ANON_KEY) return false;
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
    .select("id, title, location, google_place_id")
    .is("google_place_id", null)
    .limit(limit);
  if (error) throw new Error(error.message);

  const listings = (data ?? []) as Listing[];
  let succeeded = 0;
  const failed: string[] = [];
  const matched: { title: string; googleName: string; confidence: number }[] = [];

  for (const listing of listings) {
    try {
      const locationHint = (listing.location ?? "").trim();
      const textQuery = [listing.title, locationHint, "Hoedspruit Limpopo South Africa"]
        .filter(Boolean)
        .join(" ");

      const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_KEY,
          "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress",
        },
        body: JSON.stringify({
          textQuery,
          pageSize: 5,
          locationBias: {
            circle: {
              center: { latitude: -24.3548, longitude: 30.954 },
              radius: 15000.0,
            },
          },
        }),
      });

      if (!res.ok) throw new Error(`Google returned ${res.status}`);
      const body = await res.json();
      const candidates = (body?.places ?? []) as {
        id?: string;
        displayName?: { text?: string };
      }[];

      // Score every candidate, keep the strongest name match.
      let best: { id: string; name: string; confidence: number } | null = null;
      for (const candidate of candidates) {
        if (!candidate?.id) continue;
        const name = candidate.displayName?.text ?? "";
        const confidence = nameConfidence(listing.title, name);
        if (!best || confidence > best.confidence) {
          best = { id: candidate.id, name, confidence };
        }
      }

      let reject = !best || best.confidence < MIN_CONFIDENCE;

      // Never let two listings share one Place ID.
      if (!reject && best) {
        const { data: clash } = await admin
          .from("listings")
          .select("id")
          .eq("google_place_id", best.id)
          .neq("id", listing.id)
          .limit(1);
        if ((clash ?? []).length > 0) reject = true;
      }

      if (!reject && best) {
        await admin
          .from("listings")
          .update({
            google_place_id: best.id,
            google_place_name: best.name || null,
            google_match_confidence: Number(best.confidence.toFixed(2)),
            google_sync_status: "matched",
          })
          .eq("id", listing.id);
        matched.push({
          title: listing.title,
          googleName: best.name,
          confidence: Number(best.confidence.toFixed(2)),
        });
        succeeded++;
      } else {
        await admin
          .from("listings")
          .update({
            google_sync_status: "not_found",
            google_match_confidence: best ? Number(best.confidence.toFixed(2)) : null,
          })
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

  return {
    mode: "backfill",
    processed: listings.length,
    succeeded,
    failedCount: failed.length,
    failed,
    matched,
  };
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
    // Rows awaiting a stricter re-match must never be written to.
    .neq("google_sync_status", "needs_match")
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
