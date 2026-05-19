## Goal

Upgrade `src/components/admin/ImageCropDialog.tsx` so admins can zoom **out** within a chosen aspect ratio (even smaller than the image area), and fill any empty space around the image with a chosen colour — either a hex code typed in, or picked directly from the image with an eyedropper.

## Changes (single file: `src/components/admin/ImageCropDialog.tsx`)

### 1. Allow zooming out
- Change zoom slider range from `min={1}` to `min={0.2}`, keep `max={4}`, step `0.01`.
- Pass `minZoom={0.2}` and `maxZoom={4}` to `<Cropper>` so react-easy-crop permits sub-1 zoom.
- Keep `restrictPosition={false}` (already set) so the image can sit anywhere inside the crop frame.

### 2. Background fill colour state
- New state: `bgColor: string` (default `"#ffffff"`).
- New state: `pickingColor: boolean` for eyedropper mode.
- Pass `style={{ containerStyle: { background: bgColor } }}` to `<Cropper>` so the empty area inside the crop frame visibly reflects the chosen colour during cropping.

### 3. UI controls (added below the aspect buttons, above zoom)
- **Hex input**: small `<Input>` (width ~110px) bound to `bgColor`, accepts `#rrggbb`. Live-updates preview.
- **Swatch**: a 28×28 square showing current `bgColor`.
- **Eyedropper button**: 
  - If the browser supports `window.EyeDropper` (Chromium), clicking opens the native picker (`new EyeDropper().open()` → sets `bgColor` to `result.sRGBHex`).
  - Fallback: toggle `pickingColor=true`. While active, overlay a transparent `<div>` on top of the cropper with `cursor: crosshair`. On click, draw the underlying image to an offscreen canvas, sample the pixel under the click (mapping click coords → image coords using the cropper's current crop/zoom or simpler: sample from a pre-rendered full image canvas), set `bgColor` to that hex, then exit picking mode.

### 4. Apply fill on confirm
- Update `getCroppedBlob` to accept `bgColor`:
  - Create canvas at `area.width × area.height`.
  - `ctx.fillStyle = bgColor; ctx.fillRect(0, 0, w, h);` first.
  - Then `ctx.drawImage(...)` — when zoom <1, `area` extends beyond image bounds and `drawImage` with the same source/dest rect naturally leaves the fill colour showing in the margins. (We may need to clamp source rect to image bounds and compute the corresponding destination rect so empty areas stay filled — handled inside the helper.)
- Output remains `image/jpeg` 0.92 (jpeg has no transparency, so fill is baked in correctly).

### 5. Reset on close
- Reset `bgColor`, `pickingColor`, `zoom`, `crop` when dialog opens/closes.

## Notes / Technical details
- `EyeDropper` API works in Chrome/Edge; the fallback canvas-sample path covers Safari/Firefox.
- For the canvas fallback we'll load the image once into a hidden `<img>`/canvas ref so colour sampling is O(1) per click.
- No changes to `ImageUpload.tsx` or any consumers — the dialog API (`onConfirm(blob)`) is unchanged.
- No DB / backend changes.

## Out of scope
- Saving the chosen background colour per listing (it's baked into the exported JPEG).
- Changing default aspect logic or other crop behaviour.
