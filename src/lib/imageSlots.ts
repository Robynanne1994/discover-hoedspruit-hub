/**
 * One shared description of "a picture the app paints somewhere".
 *
 * Events, listings, specials and Local Channels each keep their own list of
 * slots — the columns and the screens differ — but the shape of a slot is the
 * same everywhere, and so is the crop tool that reads it. Declaring it once
 * means a new surface only has to state its geometry; the editor, the ratio
 * lock and the on-image guides all follow from that.
 *
 * A slot's box and its guides are both **functions of the device width**, not
 * fixed numbers. They have to be: App.tsx caps the shell at 480px, so a
 * category card is 166px wide on a small Android and 211px in a desktop tab,
 * while the rating chip laid over it is 17px tall on both. A slot that hard-codes
 * one width draws its guides at the wrong size everywhere else — which is what
 * made the crop tool's chrome sit lower and larger than the real card.
 */

import { DEFAULT_PREVIEW_WIDTH } from "./appLayout";
import type { SlotGuide } from "./imageSlotGuides";

export type Size = { width: number; height: number };

/** The box the app paints an image into, at a given device width. */
export type SlotBox = (viewport: number) => Size;

/** The chrome painted over it, at a given device width. */
export type SlotGuides = (viewport: number) => SlotGuide[];

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
   * The box in CSS px, life-size as the phone paints it at `viewport`. Guides
   * are measured against this, so it has to be the real thing, not a nominal
   * size.
   */
  box: SlotBox;
  /** Chrome the live screen paints over this image. Drawn in the crop tool. */
  guides?: SlotGuides;
  /** What the app shows when this slot is empty. */
  fallback: string;
  /** Shown as a secondary, optional slot rather than one of the main ones. */
  optional?: boolean;
};

/** A box the app pins to a fixed size — a carousel tile, an avatar. */
export const fixedBox = (width: number, height: number): SlotBox => () => ({ width, height });

/**
 * A box whose width follows the layout and whose height follows its ratio.
 *
 * `widthAt` is the screen's own arithmetic — `gridCardWidth`, `fullBleedWidth`
 * — so the box is derived from the same numbers the screen lays itself out
 * with rather than a remembered result of them.
 */
export const ratioBox = (widthAt: (viewport: number) => number, aspect: number): SlotBox =>
  (viewport) => {
    const width = widthAt(viewport);
    return { width, height: width / aspect };
  };

/** Guides that don't change with the device. */
export const fixedGuides = (guides: SlotGuide[]): SlotGuides => () => guides;

/** A slot's box at a device width, defaulting to what the editor previews at. */
export const slotBox = (slot: ImageSlot, viewport: number = DEFAULT_PREVIEW_WIDTH): Size =>
  slot.box(viewport);

/** A slot's guides at a device width, defaulting to what the editor previews at. */
export const slotGuides = (slot: ImageSlot, viewport: number = DEFAULT_PREVIEW_WIDTH): SlotGuide[] =>
  slot.guides?.(viewport) ?? [];

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
