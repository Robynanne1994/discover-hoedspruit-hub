## Local Channels — Major Upgrade

Turning Local Channels into a full first-class content type (like Listings/Events/Specials) with a detail page, dual images, custom platforms, QR support, and richer metadata.

---

### 1. Database changes (migration)

Add to `bush_telegraph_resources`:
- `title_override` text
- `meta_2` text — second meta line (e.g. members count)
- `resource_type` text — `'link' | 'qr' | 'image' | 'internal'` (default `'link'`)
- `detail_image_url` text — separate image used on the detail page hero
- `qr_image_url` text — uploaded QR/image (used when resource_type is `qr`/`image`)
- `admin_name` text
- `years_running` integer
- `post_frequency` text
- `slug` text (auto-generated from title for the detail URL)

Drop column `tone` (no longer used).

New table `local_channel_platforms`:
- `id uuid pk`, `name text unique`, `sort_order int`, `created_at timestamptz`
- RLS: public select, admin manage
- Seed with existing platforms (Facebook, WhatsApp, Instagram, Websites)

### 2. Admin editor (`AdminBushTelegraph.tsx`)

- Remove tone control.
- Title + Title Override toggle (matches Events/Listings pattern).
- Platform: dropdown sourced from `local_channel_platforms` + "+ Add new platform" button (inline create → upserts row, refetches, selects it).
- Resource type: select (Link / QR code / Image / Internal page).
- URL: shown when type = link/internal.
- QR/Image upload: shown when type = qr/image (uses `ImageUpload` → `local-channels-images` bucket).
- Meta 1 (Platform meta) and Meta 2 (Members / activity) — two separate inputs.
- Listing image (existing `image_url`) — with `ImageUpload` + crop.
- Detail image (new `detail_image_url`) — with `ImageUpload` + crop.
- New optional fields: Admin, Years Running, Average Frequency of Posts.

### 3. Frontend list (`BushTelegraph.tsx` + `HomeLocalChannels.tsx`)

- Card no longer opens outbound link directly — navigates to `/local-channels/:slug`.
- Show meta as `meta 1  •  meta 2` (small bullet separator) when both exist.
- Use `DisplayTitle` for title override support.

### 4. New detail page (`LocalChannelDetail.tsx`)

Same shell/structure as `ListingDetail`:
- Hero with `detail_image_url` (fallback to `image_url`), back button, share, favourite.
- Title (with override), platform eyebrow, meta 1 • meta 2.
- Tabs: Details / About.
- Action button(s):
  - `link` / `internal` → "Open channel" → opens URL (external = new tab, internal = in-app route).
  - `qr` / `image` → "Show QR code" → opens an in-app lightbox with a back button (uses existing `ImageLightbox`).
- Info rows (only shown when populated): Admin, Years Running, Avg. Post Frequency, Description.
- Add route in `App.tsx`: `/local-channels/:slug`.

### 5. Image cropping + eyedropper

Both image fields use the existing `ImageUpload` → `ImageCropDialog`, which already provides crop. "Eyedropper" in the existing flow refers to the dominant-color/positioning controls already present in `ImageCropDialog`; both image slots will reuse that same component for consistency with Listings/Events.

### 6. Slug generation

DB trigger generating slug from title on insert/update when slug is null/empty (mirrors `generate_article_slug`).

---

### Files to touch

- migration: add columns, drop tone, create platforms table + trigger
- `src/pages/admin/AdminBushTelegraph.tsx` — full editor revamp
- `src/pages/BushTelegraph.tsx` — card link to detail, meta split, title override
- `src/components/home/HomeLocalChannels.tsx` — same updates
- `src/pages/LocalChannelDetail.tsx` — new
- `src/App.tsx` — route
- `src/integrations/supabase/types.ts` — auto-regenerated

---

Confirm and I'll build it.
