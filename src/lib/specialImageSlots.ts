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
 * Boxes that follow the viewport are computed from `appLayout.ts` rather than
 * fixed at one phone's width, so the guides stay life-size on every device.
 */

import {
  fullBleedWidth,
  gridCardWidth,
  insetWidth,
  previewViewport,
  SAVED_CARD_GRID,
  SPECIALS_CARD_GRID,
} from "./appLayout";
import {
  detailHeroGuides,
  rulerBandGuides,
  savedCardGuides,
  searchCircleGuide,
  specialCardBadgeGuide,
} from "./imageSlotGuides";
import { findSlot, fixedBox, fixedGuides, ratioBox, type ImageSlot } from "./imageSlots";

/**
 * The Top Active Deals card paints its picture as the card's left-hand column:
 * this fraction of the slide's width, as tall as the card. The card and the
 * editor's crop box both read these two numbers so the crop preview and the
 * live screen agree. Measured from the design: 109 × 121 CSS px on a 393pt
 * phone, so the box is a touch taller than it is wide.
 */
export const FEATURED_PHOTO_FRACTION = 0.35;
export const FEATURED_PHOTO_RATIO = 164 / 182;

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
    // grid inside 20px page padding with a 12px gutter.
    aspect: 1,
    aspectLabel: "1:1",
    box: ratioBox((v) => gridCardWidth(SPECIALS_CARD_GRID, v), 1),
    // Two horizontal rulers mark the band the subject has to sit inside: one
    // 37px down from the top of the 214px tile, one 205px down.
    guides: fixedGuides([
      specialCardBadgeGuide(),
      ...rulerBandGuides(
        37,
        205,
        "The subject needs to sit between the two red rulers, 37px and 205px down the 214px tile.",
      ),
    ]),
    fallback: "Nothing — the card shows a plain sand panel instead.",
  },
  {
    key: "detail",
    field: "detail_image_url",
    label: "Individual page image",
    where: "The hero at the top of the special's own page.",
    // SpecialDetail.tsx — hero is `aspectRatio: "4 / 3"`, full width of the shell.
    aspect: 4 / 3,
    aspectLabel: "4:3",
    box: ratioBox(fullBleedWidth, 4 / 3),
    // Two horizontal rulers mark the band the subject has to sit inside: one
    // 69px down from the top of the hero, one 316px down (360px tall at the
    // editor's 480px preview width).
    guides: (viewport) => [
      ...detailHeroGuides(previewViewport(viewport).safeTop),
      ...rulerBandGuides(
        69,
        316,
        "The subject needs to sit between the two red rulers, 69px and 316px down the 360px hero.",
      ),
    ],
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
    box: fixedBox(190, 190),
    // Two horizontal rulers mark the band the subject has to sit inside: one
    // 47px down from the top of the tile, one 164px down.
    guides: fixedGuides(
      rulerBandGuides(
        47,
        164,
        "The subject needs to sit between the two red rulers, 47px and 164px down the 190px tile.",
      ),
    ),
    fallback: "Falls back to the card cover image.",
  },
  {
    key: "featured",
    field: "featured_image_url",
    label: "Featured carousel image",
    where: "The Top Active Deals carousel at the top of the Specials page.",
    // Specials.tsx — FeaturedCard paints the picture as the card's left column:
    // FEATURED_PHOTO_FRACTION of the slide's width and as tall as the card. The
    // card's height follows its own text, so the box is the one measured from
    // the design rather than an exact paint box; whichever edge the card's
    // height differs by is the one `cover` trims.
    aspect: FEATURED_PHOTO_RATIO,
    aspectLabel: "9:10",
    box: ratioBox(
      (v) => Math.round(insetWidth(SPECIALS_CARD_GRID.pageInset, v) * FEATURED_PHOTO_FRACTION),
      FEATURED_PHOTO_RATIO,
    ),
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
    box: ratioBox((v) => gridCardWidth(SAVED_CARD_GRID, v), 4 / 3),
    guides: fixedGuides(savedCardGuides("Special", { kind: "deal", text: "30% OFF" })),
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
    box: fixedBox(42, 42),
    guides: fixedGuides([searchCircleGuide()]),
    fallback: "Falls back to the card cover image.",
  },
];

export const specialImageSlot = (key: SpecialImageSlotKey): SpecialImageSlot =>
  findSlot(SPECIAL_IMAGE_SLOTS, key, "special");
