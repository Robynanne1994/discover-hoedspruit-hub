/**
 * Where to put a photo so the screen shows what the crop dialog exported —
 * before anything has been exported.
 *
 * `getCroppedBlob` in ImageCropDialog builds its canvas from the crop area the
 * user dragged out: a rectangle in *source-image* pixels, which may sit partly
 * outside the photo (zooming below 100% is how you add breathing room, and the
 * background colour fills the rest). Re-encoding that JPEG on every drag frame
 * to preview it would be far too slow, so the preview instead reproduces the
 * same result with two nested divs and a CSS transform-free layout.
 *
 * The maths is the composition of two steps:
 *
 *   1. the export — a canvas of `area.width × area.height` with the photo drawn
 *      at `-area.x, -area.y`;
 *   2. `object-fit: cover` — that canvas scaled up until it covers `box`, then
 *      centred.
 *
 * Both are pure ratios, so one scale factor covers them: whichever of
 * `box.width / area.width` and `box.height / area.height` is larger.
 */

export type Size = { width: number; height: number };

/** A crop rectangle in source-image pixels, as react-easy-crop reports it. */
export type CropArea = { x: number; y: number; width: number; height: number };

export type CropPreviewLayout = {
  /**
   * The exported image, placed inside the box the way `object-fit: cover`
   * would place it. Fill it with the crop's background colour and clip to it.
   */
  crop: { left: number; top: number; width: number; height: number };
  /** The source photo, positioned inside `crop`. Clipped by it. */
  image: { left: number; top: number; width: number; height: number };
};

const EMPTY: CropPreviewLayout = {
  crop: { left: 0, top: 0, width: 0, height: 0 },
  image: { left: 0, top: 0, width: 0, height: 0 },
};

export function cropPreviewLayout(natural: Size, area: CropArea, box: Size): CropPreviewLayout {
  if (!(area.width > 0) || !(area.height > 0) || !(box.width > 0) || !(box.height > 0)) {
    return EMPTY;
  }

  const scale = Math.max(box.width / area.width, box.height / area.height);
  const width = area.width * scale;
  const height = area.height * scale;

  return {
    crop: {
      left: (box.width - width) / 2,
      top: (box.height - height) / 2,
      width,
      height,
    },
    image: {
      left: -area.x * scale,
      top: -area.y * scale,
      width: natural.width * scale,
      height: natural.height * scale,
    },
  };
}

/**
 * The crop the app would have chosen on its own.
 *
 * An uncropped photo dropped into a fixed box is painted by `object-fit:
 * cover`: scaled until it fills the box, centred, overflow trimmed. That is
 * the largest rectangle of the box's ratio that fits inside the photo, centred
 * — which is what this returns, in source pixels, ready for react-easy-crop's
 * `initialCroppedAreaPixels`.
 *
 * Opening the dialog on it means the picture on screen the moment a file is
 * chosen is already the picture the app will show, so "upload and save" and
 * "upload, nudge nothing, save" land in the same place.
 */
export function coverCropArea(natural: Size, aspect: number): CropArea | undefined {
  if (!(natural.width > 0) || !(natural.height > 0) || !(aspect > 0)) return undefined;
  const ratio = natural.width / natural.height;
  const width = ratio > aspect ? natural.height * aspect : natural.width;
  const height = ratio > aspect ? natural.height : natural.width / aspect;
  return {
    x: (natural.width - width) / 2,
    y: (natural.height - height) / 2,
    width,
    height,
  };
}

/**
 * Snap an exported canvas to an exact target ratio.
 *
 * react-easy-crop reports the crop area in fractional source pixels, so a
 * "locked to 4:3" crop arrives as something like 1600.4 × 1200.3. Rounding
 * each side independently lands a pixel or two off the ratio, which is enough
 * for `object-fit: cover` to shave a hairline off one edge. Deriving the
 * height from the rounded width keeps the export exactly on ratio.
 */
export function exportSize(area: CropArea, aspect?: number): Size {
  const width = Math.max(1, Math.round(area.width));
  if (!aspect || !(aspect > 0)) {
    return { width, height: Math.max(1, Math.round(area.height)) };
  }
  return { width, height: Math.max(1, Math.round(width / aspect)) };
}
