import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Proxies Google Maps Static API so GOOGLE_MAPS_STATIC_KEY never ships in the app.
// Loaded directly as an <img src>, so it cannot carry auth headers. To keep
// cost bounded, inputs are clamped to the Hoedspruit area, a small set of
// zooms and phone-sized images, and responses are cached hard.
const BOUNDS = { minLat: -25.1, maxLat: -23.7, minLon: 30.3, maxLon: 31.7 };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  const key = Deno.env.get("GOOGLE_MAPS_STATIC_KEY");
  if (!key) return new Response("Map key not configured", { status: 500, headers: corsHeaders });

  const p = new URL(req.url).searchParams;
  const lat = Number(p.get("lat"));
  const lon = Number(p.get("lon"));
  const zoom = Number(p.get("zoom"));
  const width = Math.round(Number(p.get("width")));
  const height = Math.round(Number(p.get("height")));

  const valid =
    Number.isFinite(lat) && Number.isFinite(lon) &&
    lat >= BOUNDS.minLat && lat <= BOUNDS.maxLat &&
    lon >= BOUNDS.minLon && lon <= BOUNDS.maxLon &&
    Number.isInteger(zoom) && zoom >= 10 && zoom <= 18 &&
    width >= 50 && width <= 640 && height >= 50 && height <= 640;
  if (!valid) return new Response("Invalid parameters", { status: 400, headers: corsHeaders });

  // Round to ~1m so near-identical requests share a cache entry.
  const centre = `${lat.toFixed(5)},${lon.toFixed(5)}`;
  const url =
    "https://maps.googleapis.com/maps/api/staticmap" +
    `?center=${centre}&zoom=${zoom}&size=${width}x${height}&scale=2&maptype=roadmap&format=png` +
    `&key=${encodeURIComponent(key)}`;

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    console.error(`Static Maps failed [${res.status}]: ${body}`);
    return new Response(body, { status: res.status, headers: corsHeaders });
  }

  return new Response(res.body, {
    headers: {
      ...corsHeaders,
      "Content-Type": res.headers.get("Content-Type") ?? "image/png",
      "Cache-Control": "public, max-age=2592000, immutable",
    },
  });
});
