/**
 * Every place a listing's picture is painted in the app, and the exact shape of
 * the box it lands in.
 *
 * The listings editor used to offer two uploads — a 4:3 "cover" reused on the
 * detail page and the saved card, and a 4:3 "category card cover". Neither
 * matched what the phone actually does: the homepage row paints a *square*
 * tile, so a 4:3 cover lost a third of its width to `object-fit: cover`, and
 * the saved card had no picture of its own at all.
 *
 * Listing the geometry here once means the editor crops to the very box the app
 * paints into: when the exported image and the box share a ratio, `cover` has
 * nothing left to trim, so the crop preview and the live screen are the same
 * picture. `guides` then draws whatever the app lays on top of it.
 *
 * Keep `aspect` and `box` in step with the screen named beside each slot —
 * `listingImageSlots.test.ts` fails if a ratio and its box drift apart.
 */

import { categoryCardGuides, savedCardGuides, searchCircleGuide, titleSheetGuide } from "./imageSlotGuides";
import { findSlot, type ImageSlot } from "./imageSlots";

export type ListingImageSlotKey = "detail" | "card" | "homepage" | "saved" | "search";

export type ListingImageField =
  | "detail_image_url"
  | "card_image_url"
  | "homepage_image_url"
  | "saved_image_url"
  | "search_image_url";

export type ListingImageSlot = ImageSlot<ListingImageSlotKey, ListingImageField>;

export const LISTING_IMAGE_SLOTS: ListingImageSlot[] = [
  {
    key: "detail",
    field: "detail_image_url",
    label: "Individual page image",
    where: "The hero at the top of the listing's own page.",
    // ListingDetail.tsx — hero is `aspectRatio: "4 / 3"`, full width.
    aspect: 4 / 3,
    aspectLabel: "4:3",
    // Life-size on a 390pt phone, which is what the guide below is worked out
    // from (the title sheet is a fixed 28px, the hero scales).
    box: { width: 390, height: 292.5 },
    guides: [titleSheetGuide()],
    fallback: "Nothing — the page opens straight onto the title card.",
  },
  {
    key: "card",
    field: "card_image_url",
    label: "Category page card image",
    where: "The card on a category page — Where to Eat, Shops, and the rest.",
    // CategoryPage.tsx — card image is `aspectRatio: "4 / 3"` in a two-column
    // grid: (390 − 40 page padding − 18 gutter) ÷ 2.
    aspect: 4 / 3,
    aspectLabel: "4:3",
    box: { width: 166, height: 124.5 },
    guides: categoryCardGuides(),
    fallback: "Falls back to the individual page image.",
  },
  {
    key: "homepage",
    field: "homepage_image_url",
    label: "Homepage row image",
    where: "The tile in the home screen rows — Where to Eat, Where to Shop, and the rest.",
    // HomeListings.tsx — tile is `width: 138` with `aspectRatio: "1 / 1"`.
    aspect: 1,
    aspectLabel: "1:1",
    box: { width: 138, height: 138 },
    fallback: "Falls back to the individual page image.",
  },
  {
    key: "saved",
    field: "saved_image_url",
    label: "Saved card image",
    where: "The tile on a member's Saved screen.",
    // SavedCard.tsx — tile image is `aspectRatio: "4 / 3"` in a two-column
    // grid: (390 − 40 page padding − 12 gutter) ÷ 2.
    aspect: 4 / 3,
    aspectLabel: "4:3",
    box: { width: 169, height: 126.75 },
    guides: savedCardGuides("Listing", { kind: "rating" }),
    fallback: "Falls back to the individual page image.",
  },
  {
    key: "search",
    field: "search_image_url",
    label: "Search result image",
    where: "The round thumbnail beside the listing in search results.",
    // Search.tsx — ResultRow avatar is `width: 42, height: 42` with
    // `borderRadius: "50%"`, so anything off-square loses its edges twice over.
    aspect: 1,
    aspectLabel: "1:1",
    box: { width: 42, height: 42 },
    guides: [searchCircleGuide()],
    fallback: "Falls back to the individual page image.",
  },
];

export const listingImageSlot = (key: ListingImageSlotKey): ListingImageSlot =>
  findSlot(LISTING_IMAGE_SLOTS, key, "listing");
