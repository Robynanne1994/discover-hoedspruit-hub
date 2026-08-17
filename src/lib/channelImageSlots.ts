/**
 * The four places a Local Channel's picture is painted in the app — plus the
 * Saved card and the search row, which reuse the same machinery.
 *
 * Each screen already had its own hard-coded box: the listing card paints a
 * 90×128 strip, the homepage row a 90×90 tile, the detail page a full-bleed
 * 4:3 hero. The admin editor knew none of that, so it cropped to "Free" or a
 * guessed ratio and then the app's `object-fit: cover` silently trimmed the
 * result — you only found out what you'd actually chosen after saving.
 *
 * Listing the geometry here once lets the editor crop to the exact box the app
 * will paint into. When the exported image and the box share a ratio, `cover`
 * has nothing left to trim, so the crop preview and the live app are the same
 * picture. `guides` then draws whatever the app lays on top of it.
 *
 * Keep `aspect` and `box` in step with the screen each slot names — the
 * constants beside each one say where to look.
 */

import { savedCardGuides, searchCircleGuide, titleSheetGuide } from "./imageSlotGuides";
import { findSlot, type ImageSlot } from "./imageSlots";

export type ChannelImageSlotKey = "detail" | "homepage" | "listing" | "saved" | "search";

export type ChannelImageField =
  | "detail_image_url"
  | "homepage_image_url"
  | "image_url"
  | "saved_image_url"
  | "search_image_url";

export type ChannelImageSlot = ImageSlot<ChannelImageSlotKey, ChannelImageField>;

export const CHANNEL_IMAGE_SLOTS: ChannelImageSlot[] = [
  {
    key: "detail",
    field: "detail_image_url",
    label: "Individual page image",
    where: "The hero at the top of the channel's own page.",
    // LocalChannelDetail.tsx — hero is `aspectRatio: "4 / 3"`, full width.
    aspect: 4 / 3,
    aspectLabel: "4:3",
    // Life-size on a 390pt phone, which is what the guide below is worked out
    // from (the title sheet is a fixed 28px, the hero scales).
    box: { width: 390, height: 292.5 },
    guides: [titleSheetGuide()],
    fallback: "Falls back to the listing page image, then the QR / image upload.",
  },
  {
    key: "homepage",
    field: "homepage_image_url",
    label: "Homepage feature image",
    where: "The Local Channels row on the home screen.",
    // HomeLocalChannels.tsx — tile is `width: 90, minHeight: 90`.
    aspect: 1,
    aspectLabel: "1:1",
    box: { width: 90, height: 90 },
    fallback: "Falls back to the listing page image.",
  },
  {
    key: "listing",
    field: "image_url",
    label: "Listing page image",
    where: "The card on the Local Channels listing page.",
    // BushTelegraph.tsx — ChannelCard paints `width: 90, height: 128`.
    aspect: 90 / 128,
    aspectLabel: "45:64",
    box: { width: 90, height: 128 },
    fallback: "Nothing — the card shows a coloured gradient instead.",
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
    guides: savedCardGuides("Local Channel"),
    fallback: "Falls back to the listing page image.",
    optional: true,
  },
  {
    key: "search",
    field: "search_image_url",
    label: "Search result image",
    where: "The round thumbnail beside the channel in search results.",
    // Search.tsx — ResultRow avatar is `width: 42, height: 42` with
    // `borderRadius: "50%"`, so anything off-square loses its edges twice over.
    aspect: 1,
    aspectLabel: "1:1",
    box: { width: 42, height: 42 },
    guides: [searchCircleGuide()],
    fallback: "Falls back to the listing page image.",
    optional: true,
  },
];

export const channelImageSlot = (key: ChannelImageSlotKey): ChannelImageSlot =>
  findSlot(CHANNEL_IMAGE_SLOTS, key, "channel");
