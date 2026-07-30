// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
import { writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://hello-hoedspruit-hub.lovable.app";

const SUPABASE_URL = "https://dgkfsavtyclwkramearr.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRna2ZzYXZ0eWNsd2tyYW1lYXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NjI3NzMsImV4cCI6MjA4OTQzODc3M30.iefgDSsenzeLs5wfEkv0i13vK1317PH8bAPtk5K5tRw";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/categories", changefreq: "weekly", priority: "0.9" },
  { path: "/events", changefreq: "daily", priority: "0.9" },
  { path: "/specials", changefreq: "daily", priority: "0.9" },
  { path: "/local-channels", changefreq: "weekly", priority: "0.8" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
  { path: "/faqs", changefreq: "monthly", priority: "0.5" },
  { path: "/help-centre", changefreq: "monthly", priority: "0.4" },
  { path: "/for-business", changefreq: "monthly", priority: "0.6" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
];

async function fetchDynamicEntries(): Promise<SitemapEntry[]> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const entries: SitemapEntry[] = [];

  try {
    const { data: categories } = await supabase.from("categories").select("id, updated_at");
    categories?.forEach((c: any) =>
      entries.push({ path: `/category/${c.id}`, lastmod: c.updated_at?.slice(0, 10), changefreq: "weekly", priority: "0.7" }),
    );
  } catch {}

  try {
    const { data: listings } = await supabase
      .from("listings")
      .select("id, updated_at")
      .eq("is_published", true);
    listings?.forEach((l: any) =>
      entries.push({ path: `/listing/${l.id}`, lastmod: l.updated_at?.slice(0, 10), changefreq: "weekly", priority: "0.7" }),
    );
  } catch {}

  try {
    const { data: events } = await supabase
      .from("events")
      .select("id, updated_at")
      .eq("is_published", true);
    events?.forEach((e: any) =>
      entries.push({ path: `/events/${e.id}`, lastmod: e.updated_at?.slice(0, 10), changefreq: "weekly", priority: "0.7" }),
    );
  } catch {}

  try {
    const { data: specials } = await supabase
      .from("specials")
      .select("id, updated_at")
      .eq("is_published", true);
    specials?.forEach((s: any) =>
      entries.push({ path: `/specials/${s.id}`, lastmod: s.updated_at?.slice(0, 10), changefreq: "weekly", priority: "0.7" }),
    );
  } catch {}

  try {
    const { data: channels } = await supabase
      .from("local_channels")
      .select("slug, updated_at")
      .eq("is_published", true);
    channels?.forEach((c: any) =>
      c.slug &&
      entries.push({ path: `/local-channels/${c.slug}`, lastmod: c.updated_at?.slice(0, 10), changefreq: "weekly", priority: "0.6" }),
    );
  } catch {}

  return entries;
}

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

(async () => {
  const dynamic = await fetchDynamicEntries();
  const entries = [...staticEntries, ...dynamic];
  writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
  console.log(`sitemap.xml written (${entries.length} entries)`);
})();
