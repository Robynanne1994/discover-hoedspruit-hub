/**
 * One shared description of "a picture the app paints somewhere".
 *
 * Events, listings, specials and Local Channels each keep their own list of
 * slots — the columns and the screens differ — but the shape of a slot is the
 * same everywhere, and so is the crop tool that reads it. Declaring it once
 * means a new surface only has to state its geometry; the editor, the ratio
 * lock and the on-image guides all follow from that.
 */

import type { SlotGuide } from "./imageSlotGuides";

export type ImageSlot<Key extends string = string, Field extends string = string> = {
  key: Key;
  /** The column this slot writes to. */
  field: Field;
  label: string;
  /** Where it shows up, for the hint under the label. */
  where: string;
  /** width ÷ height of the box the app paints this image into. */
  aspect: number;
  /** Human-readable ratio for the crop dialog and the field hint. */
  aspectLabel: string;
  /**
   * The box in CSS px, life-size as the phone paints it. Guides are measured
   * against this, so it has to be the real thing, not a nominal size.
   */
  box: { width: number; height: number };
  /** Chrome the live screen paints over this image. Drawn in the crop tool. */
  guides?: SlotGuide[];
  /** What the app shows when this slot is empty. */
  fallback: string;
  /** Shown as a secondary, optional slot rather than one of the main ones. */
  optional?: boolean;
};

/** Look a slot up by key, loudly — a typo must not silently crop to a guess. */
export const findSlot = <S extends ImageSlot>(
  slots: readonly S[],
  key: S["key"],
  what: string,
): S => {
  const slot = slots.find((s) => s.key === key);
  if (!slot) throw new Error(`Unknown ${what} image slot: ${key}`);
  return slot;
};
