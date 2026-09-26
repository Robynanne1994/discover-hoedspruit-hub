import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

// Imports listing gallery images from the Hello Hoedspruit Hub submissions
// project into the listing-images bucket. Protected by x-import-key, which
// must match internal_secrets.gallery_import_key.
const ALLOWED_HOST = "astdkcqcnbdnecalgqps.supabase.co";
const BUCKET = "listing-images";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png", "image/webp": "webp",
  "image/gif": "gif", "image/heic": "heic", "image/heif": "heif", "image/avif": "avif",
};
const TYPE_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
  gif: "image/gif", heic: "image/heic", heif: "image/heif", avif: "image/avif",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  const provided = req.headers.get("x-import-key") ?? "";
  const { data: secret } = await admin.from("internal_secrets").select("value").eq("key", "gallery_import_key").maybeSingle();
  if (!provided || !secret?.value || provided !== secret.value) return json({ error: "Unauthorized" }, 401);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const listingId = body?.listing_id;
  const imageUrls = body?.image_urls;
  const mode = body?.mode ?? "append";
  if (typeof listingId !== "string" || !UUID_RE.test(listingId)) return json({ error: "listing_id must be a uuid" }, 400);
  if (!Array.isArray(imageUrls) || imageUrls.some((u) => typeof u !== "string")) return json({ error: "image_urls must be an array of strings" }, 400);
  if (mode !== "append" && mode !== "replace") return json({ error: "mode must be append or replace" }, 400);

  const { data: listing, error: lErr } = await admin.from("listings").select("id, gallery_images").eq("id", listingId).maybeSingle();
  if (lErr) return json({ error: lErr.message }, 500);
  if (!listing) return json({ error: "Listing not found" }, 404);

  const errors: { url: string; reason: string }[] = [];
  const newUrls: string[] = [];

  for (const raw of imageUrls as string[]) {
    const src = raw.trim();
    let parsed: URL;
    try { parsed = new URL(src); } catch { errors.push({ url: src, reason: "skipped: invalid url" }); continue; }
    if (parsed.protocol !== "https:" || parsed.hostname !== ALLOWED_HOST) {
      errors.push({ url: src, reason: "skipped: host not allowed" });
      continue;
    }
    try {
      const res = await fetch(src);
      if (!res.ok) { errors.push({ url: src, reason: `download failed: ${res.status}` }); await res.body?.cancel(); continue; }
      const headerType = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
      const pathExt = (parsed.pathname.split(".").pop() ?? "").toLowerCase();
      let ext = EXT_BY_TYPE[headerType] ?? (TYPE_BY_EXT[pathExt] ? (pathExt === "jpeg" ? "jpg" : pathExt) : "");
      if (!ext) { errors.push({ url: src, reason: `not an image (${headerType || "unknown type"})` }); await res.body?.cancel(); continue; }
      const contentType = EXT_BY_TYPE[headerType] ? headerType : TYPE_BY_EXT[ext];
      if (contentType === "image/jpg") ext = "jpg";
      const bytes = new Uint8Array(await res.arrayBuffer());
      const path = `gallery/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await admin.storage.from(BUCKET).upload(path, bytes, { contentType: contentType === "image/jpg" ? "image/jpeg" : contentType });
      if (upErr) { errors.push({ url: src, reason: `upload failed: ${upErr.message}` }); continue; }
      newUrls.push(admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
    } catch (e) {
      errors.push({ url: src, reason: `error: ${e instanceof Error ? e.message : String(e)}` });
    }
  }

  if (newUrls.length > 0 || mode === "replace") {
    const existing: string[] = Array.isArray(listing.gallery_images) ? listing.gallery_images : [];
    const next = mode === "replace" ? newUrls : [...existing, ...newUrls.filter((u) => !existing.includes(u))];
    const { error: updErr } = await admin.from("listings").update({ gallery_images: next }).eq("id", listingId);
    if (updErr) errors.push({ url: "", reason: `listing update failed: ${updErr.message}` });
  }

  const result = {
    listing_id: listingId, mode,
    requested_count: imageUrls.length,
    imported_count: newUrls.length,
    new_urls: newUrls,
    errors,
  };
  const { data: log } = await admin.from("gallery_import_log").insert(result).select("id, created_at").maybeSingle();
  return json({ ...result, log_id: log?.id ?? null, created_at: log?.created_at ?? null });
});
