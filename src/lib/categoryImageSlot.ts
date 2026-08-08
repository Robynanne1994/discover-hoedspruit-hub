/**
 * The box a category's cover image is painted into on the Explore page.
 *
 * Every card that shows `categories.image_url` gives it a square:
 *
 *   - Categories.tsx, grid view — `aspectRatio: "1 / 1"`, full card width.
 *   - Categories.tsx, list view — a fixed 96×96 tile at the left of the row.
 *   - CategoriesSection.tsx, home carousel — `aspect-square`.
 *
 * All three paint with `object-fit: cover`, so an image that isn't square gets
 * silently trimmed to one. Cropping to this ratio in the admin editor means
 * `cover` has nothing left to trim and the crop preview and the phone show the
 * same picture.
 *
 * Keep `aspect` in step with those three screens.
 */

export type CategoryImageSlot = {
  /** width ÷ height of the box the app paints the cover into. */
  aspect: number;
  aspectLabel: string;
  /**
   * The grid card, life-size: on a 390px-wide phone the Explore grid is two
   * columns inside 20px page padding with a 12px gutter — (390 − 40 − 12) / 2.
   */
  grid: { width: number; height: number };
  /** The list-view row's tile. Life-size — it is 96×96 on every phone. */
  list: { width: number; height: number };
};

export const CATEGORY_IMAGE_SLOT: CategoryImageSlot = {
  aspect: 1,
  aspectLabel: "1:1",
  grid: { width: 169, height: 169 },
  list: { width: 96, height: 96 },
};
