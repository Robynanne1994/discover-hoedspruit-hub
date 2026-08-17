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
 * picture. `guides` then draws whatever the app lays on top of it, so nothing
 * important ends up parked under a heart or the white title card.
 *
 * Boxes that follow the viewport are computed from `appLayout.ts`, so they stay
 * right at every device width instead of only on the one phone somebody
 * measured.
 */

import { fullBleedWidth, gridCardWidth, previewViewport, SAVED_CARD_GRID } from "./appLayout";
import {
  circleMaskGuide,
  detailHeroGuides,
  posterDateGuide,
  savedCardGuides,
  searchCircleGuide,
} from "./imageSlotGuides";
import { findSlot, fixedBox, fixedGuides, ratioBox, type ImageSlot } from "./imageSlots";

export type EventImageSlotKey =
  | "card"
  | "poster"
  | "detail"
  | "homepage"
  | "saved"
  | "search"
  | "host";

export type EventImageField =
  | "image_url"
  | "poster_image_url"
  | "detail_image_url"
  | "homepage_image_url"
  | "saved_image_url"
  | "search_image_url"
  | "hosted_by_image_url";

export type EventImageSlot = ImageSlot<EventImageSlotKey, EventImageField>;

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
    box: fixedBox(140, 188),
    fallback: "Nothing — the card shows a plain ivory panel instead.",
  },
  {
    key: "poster",
    field: "poster_image_url",
    label: "Happening Soon Card Image",
    where: "The poster card in the Happening Soon carousel at the top of the Events list.",
    // Events.tsx — PosterCard image area is `width: 196, height: 164`.
    aspect: 196 / 164,
    aspectLabel: "49:41",
    box: fixedBox(196, 164),
    guides: fixedGuides([posterDateGuide()]),
    fallback: "Falls back to the card cover image.",
  },
  {
    key: "detail",
    field: "detail_image_url",
    label: "Detail Cover Image",
    where: "The hero at the top of the event's own page.",
    // EventDetail.tsx — hero is `aspectRatio: "4 / 3"`, full width of the shell.
    aspect: 4 / 3,
    aspectLabel: "4:3",
    box: ratioBox(fullBleedWidth, 4 / 3),
    guides: (viewport) => detailHeroGuides(previewViewport(viewport).safeTop),
    fallback: "Falls back to the card cover image.",
  },
  {
    key: "homepage",
    field: "homepage_image_url",
    label: "Homepage Upcoming Events Image",
    where: "The What's On row on the home screen.",
    // HomeWhatsOn.tsx — tile is `width: 144, height: 192`.
    aspect: 3 / 4,
    aspectLabel: "3:4",
    box: fixedBox(144, 192),
    fallback: "Falls back to the card cover image.",
  },
  {
    key: "saved",
    field: "saved_image_url",
    label: "Saved Card Cover Image",
    where: "The tile on a member's Saved screen.",
    // SavedCard.tsx — tile image is `aspectRatio: "4 / 3"` in a two-column
    // grid inside 20px page padding with a 12px gutter.
    aspect: 4 / 3,
    aspectLabel: "4:3",
    box: ratioBox((v) => gridCardWidth(SAVED_CARD_GRID, v), 4 / 3),
    guides: fixedGuides(savedCardGuides("Event")),
    fallback: "Falls back to the card cover image.",
  },
  {
    key: "search",
    field: "search_image_url",
    label: "Search Result Image",
    where: "The round thumbnail beside the event in search results.",
    // Search.tsx — ResultRow avatar is `width: 42, height: 42` with
    // `borderRadius: "50%"`, so anything off-square loses its edges twice over.
    aspect: 1,
    aspectLabel: "1:1",
    box: fixedBox(42, 42),
    guides: fixedGuides([searchCircleGuide()]),
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
    box: fixedBox(48, 48),
    guides: fixedGuides([
      circleMaskGuide("The host photo is round — everything outside the circle is trimmed off."),
    ]),
    fallback: "Nothing — the row shows the host's initial in a circle.",
  },
];

export const eventImageSlot = (key: EventImageSlotKey): EventImageSlot =>
  findSlot(EVENT_IMAGE_SLOTS, key, "event");
