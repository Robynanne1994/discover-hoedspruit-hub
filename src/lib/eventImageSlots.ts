/**
 * Every place an event's picture is painted in the app, and the exact shape of
 * the box it lands in.
 *
 * The admin form used to carry its own hand-typed ratio per upload slot. When a
 * screen's card was resized the number beside it stayed put, so the crop tool
 * kept offering the old shape and `object-fit: cover` quietly trimmed the
 * difference once the event went live.
 *
 * Listing the geometry here once means the editor crops to the very box the app
 * paints into: when the exported image and the box share a ratio, `cover` has
 * nothing left to trim and the crop preview and the live screen are the same
 * picture.
 *
 * Keep `aspect` in step with the screen named beside each slot — the file and
 * line references say where to look, and `eventImageSlots.test.ts` fails if a
 * ratio and its box drift apart.
 */

export type EventImageSlotKey = "card" | "detail" | "homepage" | "saved" | "host";

export type EventImageField =
  | "image_url"
  | "detail_image_url"
  | "homepage_image_url"
  | "saved_image_url"
  | "hosted_by_image_url";

export type EventImageSlot = {
  key: EventImageSlotKey;
  /** Column on `events` this slot writes to (host slots are numbered 1–3). */
  field: EventImageField;
  label: string;
  /** Where it shows up, for the hint under the label. */
  where: string;
  /** width ÷ height of the box the app paints this image into. */
  aspect: number;
  /** Human-readable ratio for the crop dialog and the field hint. */
  aspectLabel: string;
  /** The box in CSS px, life-size as the phone paints it. */
  box: { width: number; height: number };
  /** What the app shows when this slot is empty. */
  fallback: string;
  /**
   * Fraction of the image's height hidden behind chrome that sits over the
   * bottom of the picture (the detail page's raised white panel). The crop
   * dialog paints a guide line here so nothing important is placed under it.
   */
  bottomCoverRatio?: number;
};

export const EVENT_IMAGE_SLOTS: EventImageSlot[] = [
  {
    key: "card",
    field: "image_url",
    label: "Card Cover Image",
    where: "The card on the Events list.",
    // Events.tsx — EventCard row is `height: 188` with a `width: 140` image
    // column set to `alignSelf: stretch`.
    aspect: 140 / 188,
    aspectLabel: "35:47",
    box: { width: 140, height: 188 },
    fallback: "Nothing — the card shows a plain ivory panel instead.",
  },
  {
    key: "detail",
    field: "detail_image_url",
    label: "Detail Cover Image",
    where: "The hero at the top of the event's own page.",
    // EventDetail.tsx — hero is `aspectRatio: "4 / 3"`, full width.
    aspect: 4 / 3,
    aspectLabel: "4:3",
    box: { width: 360, height: 270 },
    fallback: "Falls back to the card cover image.",
    // EventDetail.tsx — the details panel is pulled up with `marginTop: -28`
    // over a 270px-tall hero.
    bottomCoverRatio: 28 / 270,
  },
  {
    key: "homepage",
    field: "homepage_image_url",
    label: "Homepage Upcoming Events Image",
    where: "The What's On row on the home screen.",
    // HomeWhatsOn.tsx — tile is `width: 144, height: 192`.
    aspect: 3 / 4,
    aspectLabel: "3:4",
    box: { width: 144, height: 192 },
    fallback: "Falls back to the card cover image.",
  },
  {
    key: "saved",
    field: "saved_image_url",
    label: "Saved Card Cover Image",
    where: "The tile on a member's Saved screen.",
    // SavedCard.tsx — tile image is `aspectRatio: "4 / 3"`.
    aspect: 4 / 3,
    aspectLabel: "4:3",
    box: { width: 208, height: 156 },
    fallback: "Falls back to the card cover image.",
  },
  {
    key: "host",
    field: "hosted_by_image_url",
    label: "Host Photo",
    where: "The Hosted by row on the event page.",
    // EventDetail.tsx — host avatar is `width: 48, height: 48` with
    // `borderRadius: 999`, so anything off-square loses its edges to the circle.
    aspect: 1,
    aspectLabel: "1:1",
    box: { width: 48, height: 48 },
    fallback: "Nothing — the row shows the host's initial in a circle.",
  },
];

export const eventImageSlot = (key: EventImageSlotKey): EventImageSlot => {
  const slot = EVENT_IMAGE_SLOTS.find((s) => s.key === key);
  if (!slot) throw new Error(`Unknown event image slot: ${key}`);
  return slot;
};
