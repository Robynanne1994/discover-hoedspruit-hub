/**
 * The three places a Local Channel's picture is painted in the app — plus the
 * Saved card, which reuses the same machinery.
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
 * picture.
 *
 * Keep `aspect` in step with the screen it names — the constants beside each
 * slot say where to look.
 */

export type ChannelImageSlotKey = "detail" | "homepage" | "listing" | "saved";

export type ChannelImageField =
  | "detail_image_url"
  | "homepage_image_url"
  | "image_url"
  | "saved_image_url";

export type ChannelImageSlot = {
  key: ChannelImageSlotKey;
  /** Column on `bush_telegraph_resources` this slot writes to. */
  field: ChannelImageField;
  label: string;
  /** Where it shows up, for the hint under the label. */
  where: string;
  /** width ÷ height of the box the app paints this image into. */
  aspect: number;
  aspectLabel: string;
  /**
   * The preview box in CSS px. `homepage` and `listing` are life-size — that
   * is genuinely how big they are on a phone.
   */
  box: { width: number; height: number };
  /** What the app shows when this slot is empty. */
  fallback: string;
  /** Shown as a secondary, optional slot rather than one of the main three. */
  optional?: boolean;
};

export const CHANNEL_IMAGE_SLOTS: ChannelImageSlot[] = [
  {
    key: "detail",
    field: "detail_image_url",
    label: "Individual page image",
    where: "The hero at the top of the channel's own page.",
    // LocalChannelDetail.tsx — hero is `aspectRatio: "4 / 3"`, full width.
    aspect: 4 / 3,
    aspectLabel: "4:3",
    box: { width: 360, height: 270 },
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
    // SavedCard.tsx — tile image is `aspectRatio: "4 / 3"`.
    aspect: 4 / 3,
    aspectLabel: "4:3",
    box: { width: 208, height: 156 },
    fallback: "Falls back to the listing page image.",
    optional: true,
  },
];

export const channelImageSlot = (key: ChannelImageSlotKey): ChannelImageSlot => {
  const slot = CHANNEL_IMAGE_SLOTS.find((s) => s.key === key);
  if (!slot) throw new Error(`Unknown channel image slot: ${key}`);
  return slot;
};
