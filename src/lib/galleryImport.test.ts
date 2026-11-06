// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("supabase/functions/import-gallery-images/index.ts", "utf8")
  .replace(/^import .*;\n/gm, "");

async function run(body: object, key = "test-key") {
  const writes: { table: string; value: any }[] = [];
  const uploads: string[] = [];
  let handler: (req: Request) => Promise<Response> = async () => new Response();
  const client = {
    from(table: string) {
      return {
        select() { return this; }, eq() { return this; },
        async maybeSingle() {
          return { data: table === "internal_secrets" ? { value: "test-key" } : { id: "row", gallery_images: ["old-image"] } };
        },
        insert(value: any) { writes.push({ table, value }); return this; },
        update(value: any) { writes.push({ table, value }); return this; },
      };
    },
    storage: { from(bucket: string) {
      expect(bucket).toBe("listing-images");
      return {
        async upload(path: string) { uploads.push(path); return {}; },
        getPublicUrl(path: string) { return { data: { publicUrl: `https://storage.test/${path}` } }; },
      };
    } },
  };
  const { transform } = await import("esbuild");
  const code = (await transform(source, { loader: "ts" })).code;
  new Function("Deno", "createClient", "corsHeaders", "fetch", code)(
    { env: { get: () => "test-env" }, serve: (fn: typeof handler) => { handler = fn; } },
    () => client, {}, async () => new Response(new Uint8Array([1]), { headers: { "content-type": "image/png" } }),
  );
  const response = await handler(new Request("https://function.test", {
    method: "POST", headers: { "x-import-key": key, "content-type": "application/json" }, body: JSON.stringify(body),
  }));
  return { response, result: await response.json(), writes, uploads };
}

const id = "00000000-0000-4000-8000-000000000001";
const image_urls = ["https://astdkcqcnbdnecalgqps.supabase.co/image.png"];

describe("gallery import target rules", () => {
  it("keeps omitted target as listing and appends existing images", async () => {
    const out = await run({ listing_id: id, image_urls });
    expect(out.result.target).toBe("listing");
    expect(out.uploads[0]).toMatch(/^gallery\/\d+-[a-z0-9]+\.png$/);
    expect(out.writes[0]).toEqual({ table: "listings", value: { gallery_images: ["old-image", ...out.result.new_urls] } });
    expect(out.writes[1].value).toMatchObject({ listing_id: id, event_id: null, target: "listing" });
  });
  it("appends event images in the events folder and logs event id", async () => {
    const out = await run({ target: "event", event_id: id, image_urls });
    expect(out.uploads[0]).toMatch(/^events\/\d+-[a-z0-9]+\.png$/);
    expect(out.writes[0]).toEqual({ table: "events", value: { gallery_images: ["old-image", ...out.result.new_urls] } });
    expect(out.writes[1].value).toMatchObject({ listing_id: null, event_id: id, target: "event" });
  });
  it("replaces only the event gallery when requested", async () => {
    const out = await run({ target: "event", event_id: id, image_urls, mode: "replace" });
    expect(out.writes[0]).toEqual({ table: "events", value: { gallery_images: out.result.new_urls } });
  });
  it("accepts listing_id as the event id alias", async () => {
    const out = await run({ target: "event", listing_id: id, image_urls: [] });
    expect(out.result.event_id).toBe(id);
  });
  it("refuses imports without the shared key", async () => {
    const out = await run({ target: "event", event_id: id, image_urls }, "wrong-key");
    expect(out.response.status).toBe(401);
    expect(out.writes).toEqual([]);
  });
  it("skips images outside the allowed host without changing the gallery", async () => {
    const out = await run({ target: "event", event_id: id, image_urls: ["https://other.test/image.png"] });
    expect(out.result.errors).toEqual([{ url: "https://other.test/image.png", reason: "skipped: host not allowed" }]);
    expect(out.uploads).toEqual([]);
    expect(out.writes.map((write) => write.table)).toEqual(["gallery_import_log"]);
  });
});