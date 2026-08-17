/**
 * Every place a special's picture is painted in the app, and the exact shape of
 * the box it lands in.
 *
 * The specials editor carried its ratios inline, hand-typed beside each upload.
 * One of them had drifted: the specials list card paints a *square* tile, but
 * the editor offered 4:3 (labelled "3:4"), so `object-fit: cover` quietly shaved
 * the sides off every card image after saving.
 *
 * Same contract as the other three families: crop to the box the app paints
 * into and `cover` has nothing left to trim, so the crop preview and the live
 * screen are the same picture. `guides` draws whatever the app lays on top.
 *
 * Keep `aspect` and `box` in step with the screen named beside each slot.
 */

import {
  savedCardGuides,
  searchCircleGuide,
  specialCardBadgeGuide,
  titleSheetGuide,
} from "./imageSlotGuides";
import { findSlot, type ImageSlot } from "./imageSlots";

export type SpecialImageSlotKey = "card" | "detail" | "homepage" | "featured" | "saved" | "search";

export type SpecialImageField =
  | "image_url"
  | "detail_image_url"
  | "homepage_image_url"
  | "featured_image_url"
  | "saved_image_url"
  | "search_image_url";

export type SpecialImageSlot = ImageSlot<SpecialImageSlotKey, SpecialImageField>;

export const SPECIAL_IMAGE_SLOTS: SpecialImageSlot[] = [
  {
    key: "card",
    field: "image_url",
    label: "Card cover image",
    where: "The card on the Specials list. Also the picture every other slot falls back to.",
    // Specials.tsx — DealCard image is `aspectRatio: "1 / 1"` in a two-column
    // grid: (390 − 40 page padding − 12 gutter) ÷ 2.
    aspect: 1,
    aspectLabel: "1:1",
    box: { width: 169, height: 169 },
    guides: [specialCardBadgeGuide()],
    fallback: "Nothing — the card shows a plain sand panel instead.",
  },
  {
    key: "detail",
    field: "detail_image_url",
    label: "Individual page image",
    where: "The hero at the top of the special's own page.",
    // SpecialDetail.tsx — hero is `aspectRatio: "4 / 3"`, full width.
    aspect: 4 / 3,
    aspectLabel: "4:3",
    box: { width: 390, height: 292.5 },
    guides: [titleSheetGuide()],
    fallback: "Falls back to the card cover image.",
  },
  {
    key: "homepage",
    field: "homepage_image_url",
    label: "Homepage feature image",
    where: "The Active Specials row on the home screen.",
    // HomeSpecials.tsx — the tile is a fixed 190 tall but its width follows the
    // viewport (`calc((100vw − 32px) / 1.5)`, clamped 200–280), so it is the one
    // box in the app with no single ratio: ~1.05:1 on a small phone, ~1.26:1 on
    // a 390pt one, 1.47:1 on a tablet. Left at the square the editor has always
    // offered — it sits inside every one of those, so `cover` trims the sides
    // rather than cutting the top or bottom off.
    aspect: 1,
    aspectLabel: "1:1",
    box: { width: 190, height: 190 },
    fallback: "Falls back to the card cover image.",
  },
  {
    key: "featured",
    field: "featured_image_url",
    label: "Featured carousel image",
    where: "The Top Deals carousel at the top of the Specials page.",
    // Specials.tsx — FeaturedCard image is `aspectRatio: "3 / 2"`.
    aspect: 3 / 2,
    aspectLabel: "3:2",
    box: { width: 348, height: 232 },
    fallback: "Falls back to the card cover image.",
  },
  {
    key: "saved",
    field: "saved_image_url",
    label: "Saved card image",
    where: "The tile on a member's Saved screen.",
    // SavedCard.tsx — tile image is `aspectRatio: "4 / 3"`.
    aspect: 4 / 3,
    aspectLabel: "4:3",
    box: { width: 169, height: 126.75 },
    guides: savedCardGuides("Special", { kind: "deal", text: "30% OFF" }),
    fallback: "Falls back to the card cover image.",
  },
  {
    key: "search",
    field: "search_image_url",
    label: "Search result image",
    where: "The round thumbnail beside the special in search results.",
    // Search.tsx — ResultRow avatar is `width: 42, height: 42`, fully rounded.
    aspect: 1,
    aspectLabel: "1:1",
    box: { width: 42, height: 42 },
    guides: [searchCircleGuide()],
    fallback: "Falls back to the card cover image.",
  },
];

export const specialImageSlot = (key: SpecialImageSlotKey): SpecialImageSlot =>
  findSlot(SPECIAL_IMAGE_SLOTS, key, "special");
