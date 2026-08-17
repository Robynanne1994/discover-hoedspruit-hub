/**
 * One rule for "which picture does this card show".
 *
 * Every family — listings, events, specials, Local Channels — has a picture per
 * surface: a detail hero, a category card, a homepage tile, a saved tile, a
 * round search thumbnail. Most rows only ever get one of them filled in, and
 * each screen used to write its own two-step fallback (`saved_image_url ||
 * image_url`). That left holes: fill in only the *card* image on a listing and
 * the search row, the homepage tile and the saved tile all came up blank,
 * because none of them look at `card_image_url` and nothing had filled
 * `image_url`.
 *
 * So the chain is: the surface's own crop first — that is the one cropped for
 * this exact box — then every other picture the row has, largest source first.
 * A blank card is now only possible when the row carries no picture at all.
 *
 * The chains are derived from the slot definitions rather than retyped, so a
 * new slot joins the fallback the moment the editor offers it. The `select(…)`
 * lists below have to be written out, because Supabase's client types read the
 * column list as a literal — `imageFallback.test.ts` holds them to the slots.
 */

import { CHANNEL_IMAGE_SLOTS, type ChannelImageSlotKey } from "./channelImageSlots";
import { EVENT_IMAGE_SLOTS, type EventImageSlotKey } from "./eventImageSlots";
import { LISTING_IMAGE_SLOTS, type ListingImageSlotKey } from "./listingImageSlots";
import { SPECIAL_IMAGE_SLOTS, type SpecialImageSlotKey } from "./specialImageSlots";
import type { ImageSlot } from "./imageSlots";

type Row = object | null | undefined;

const clean = (v: unknown): string | null => {
  const s = String(v ?? "").trim();
  return s ? s : null;
};

/** First non-blank field on the row, in the order given. */
export const pickImage = (row: Row, fields: readonly string[]): string | null => {
  if (!row) return null;
  for (const field of fields) {
    const v = clean((row as Record<string, unknown>)[field]);
    if (v) return v;
  }
  return null;
};

/**
 * The chain for one surface: its own crop, then the shared `image_url`, then
 * every other slot in the order the editor lists them (largest box first).
 *
 * `exclude` drops slots that are a different subject rather than a different
 * crop of the same one — an event's host photo is the host's face, not the
 * event's poster, so it must never stand in for a missing event picture.
 */
const chainFor = (
  slots: readonly ImageSlot[],
  preferred: string | undefined,
  exclude: readonly string[] = [],
): string[] => {
  const rest = slots.map((s) => s.field).filter((f) => !exclude.includes(f));
  return Array.from(new Set([...(preferred ? [preferred] : []), "image_url", ...rest]));
};

const fieldFor = (slots: readonly ImageSlot[], key: string | undefined) =>
  key ? slots.find((s) => s.key === key)?.field : undefined;

/** Slots that describe a different subject, not another crop of this one. */
export const EVENT_CHAIN_EXCLUDED = ["hosted_by_image_url"] as const;

/** A listing's picture for one surface, falling back to whatever else it has. */
export const listingImage = (row: Row, surface?: ListingImageSlotKey): string | null =>
  pickImage(row, chainFor(LISTING_IMAGE_SLOTS, fieldFor(LISTING_IMAGE_SLOTS, surface)));

/** An event's picture for one surface. The host photo is never borrowed. */
export const eventImage = (row: Row, surface?: EventImageSlotKey): string | null =>
  pickImage(
    row,
    chainFor(EVENT_IMAGE_SLOTS, fieldFor(EVENT_IMAGE_SLOTS, surface), EVENT_CHAIN_EXCLUDED),
  );

/** A special's picture for one surface. */
export const specialSurfaceImage = (row: Row, surface?: SpecialImageSlotKey): string | null =>
  pickImage(row, chainFor(SPECIAL_IMAGE_SLOTS, fieldFor(SPECIAL_IMAGE_SLOTS, surface)));

/**
 * A channel's picture for one surface. `qr_image_url` is last: a QR-code
 * channel has nothing else, and a blank tile is worse than the code itself.
 */
export const channelImage = (row: Row, surface?: ChannelImageSlotKey): string | null =>
  pickImage(row, [
    ...chainFor(CHANNEL_IMAGE_SLOTS, fieldFor(CHANNEL_IMAGE_SLOTS, surface)),
    "qr_image_url",
  ]);

/**
 * Every image column a family can carry, for `select(…)` lists.
 *
 * Written out rather than joined from the slots because `supabase-js` infers a
 * row's shape from the column string as a *literal type* — a value it can only
 * see as `string` collapses the whole query's result to an error type. The test
 * beside this file checks each one still matches its slots.
 */
export const LISTING_IMAGE_COLUMNS =
  "image_url, detail_image_url, card_image_url, homepage_image_url, saved_image_url, search_image_url";

export const EVENT_IMAGE_COLUMNS =
  "image_url, poster_image_url, detail_image_url, homepage_image_url, saved_image_url, search_image_url, hosted_by_image_url";

export const SPECIAL_IMAGE_COLUMNS =
  "image_url, detail_image_url, homepage_image_url, featured_image_url, saved_image_url, search_image_url";

export const CHANNEL_IMAGE_COLUMNS =
  "image_url, detail_image_url, homepage_image_url, saved_image_url, search_image_url, qr_image_url";

/** The columns a family's slots declare — what the constants above must cover. */
export const slotColumns = (slots: readonly ImageSlot[], extra: readonly string[] = []) =>
  Array.from(new Set(["image_url", ...slots.map((s) => s.field), ...extra]));
