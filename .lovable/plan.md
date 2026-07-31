## Goal

Give each listing an optional separate **card cover image** used on the category page grid cards, cropped at exactly the 4:3 ratio the card renders. If empty, cards keep using the listing's existing image.

## Current state (verified)

- `AdminListings.tsx` saves one image into three columns at once: `image_url`, `detail_image_url`, `saved_image_url` all get the same value (lines 378-380), and the editor has a single `ImageUpload` with `aspect={4/3}` (line 1037).
- The category page card renders `l.image_url` inside a container with `aspectRatio: "4 / 3"` and `objectFit: cover` (`CategoryPage.tsx` ~1134).
- `ImageUpload` + `ImageCropDialog` already provide upload, crop, zoom slider, aspect presets and the eyedropper background picker — so the new field reuses the same component, no new crop UI needed.

## Changes

**1. Database**
Add a nullable `card_image_url text` column to `listings`.

**2. Admin editor (`src/pages/admin/AdminListings.tsx`)**
- Add `card_image_url: ""` to `emptyForm` and to the row-to-form loader.
- Add a second labelled image field under the main image: "Category card cover (optional)" with a short hint that it falls back to the main image, using
  `<ImageUpload bucket="listing-images" value={form.card_image_url} aspect={4/3} onChange={...} />`.
  The crop dialog opens with 4:3 pre-selected and the aspect locked to the card ratio, so the saved crop is pixel-identical to the card render.
- On save, write `card_image_url: form.card_image_url || null` and stop overwriting it from the main image.

**3. Category page (`src/pages/CategoryPage.tsx`)**
- Card image src becomes `l.card_image_url || l.image_url`.
- Add `card_image_url` to the listing select/type so it is fetched.

**4. CSV import/export**
Add a `card_image_url` column to the listings CSV tool (positioned right after `image_url`) so bulk edits stay in sync. Missing/blank values leave the field empty, preserving the fallback.

## Notes

- No behaviour change for existing listings: `card_image_url` is null, so cards continue to use `image_url`.
- Detail page and saved-section imagery are untouched.
- Scope stays on the category page card cover; if you also want the new cover used on search results or the saved page cards, say so and I'll include those.
