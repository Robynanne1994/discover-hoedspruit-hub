/**
 * The chrome the app paints *on top of* a picture, measured once.
 *
 * A category card lays a rating chip over the top-left corner and a save heart
 * over the top-right; a saved tile adds a type capsule and a deal badge; a
 * specials card carries its discount badge; an event poster a date roundel; a
 * detail hero loses its top corners to floating buttons and its bottom 28px to
 * the white title card.
 *
 * The admin crop tool has to draw all of that so a poster's own title doesn't
 * end up underneath a heart. It used to draw it from numbers hand-copied out of
 * the screens, and copies drift: the count beside a rating was one grey, the
 * guide another; the saved-card rating chip tracks at 0.1em on the phone and at
 * nothing in the guide; the heart's icon was 16px live and 16.5px drawn.
 *
 * So the numbers live here, once, and *both* sides import them — the live card
 * styles its chip from this file, and `imageSlotGuides.ts` builds the crop
 * guide from the same object. They cannot disagree, because there is only one
 * of them.
 *
 * Everything is in CSS px, exactly as the phone paints it. None of it scales
 * with the viewport — that is the whole reason the crop guides have to know how
 * wide the card is (see `appLayout.ts`).
 */

import { HN, INK, MUTED, NOHEMI } from "./type";

/** Frosted white, the background under every floating chip and button. */
export const CHIP_BG = "rgba(255,255,255,0.95)";
/** The saved screen's chips sit a hair more transparent. */
export const CHIP_BG_SOFT = "rgba(255,255,255,0.94)";
export const CHIP_SHADOW = "0 1px 4px rgba(0,5,5,0.14)";
export const CHIP_BLUR = "blur(4px)";

export const STAR = "#E9B417";
export const HEART_INK = "#5b4632";
/** The heart before it is saved — CategoryPage's `CardHeart`. */
export const HEART_IDLE = "rgba(18, 18, 20, 0.55)";
export const DEAL_RED = "#C0392B";
export const DEAL_OLIVE = "#4F4A38";
export const BODY = "#2b2420";

/**
 * The category page card — CategoryPage.tsx.
 *
 * A 4:3 picture with the Google rating pinned top-left and the save heart
 * top-right. Both are fixed sizes, so how much of the picture they cover
 * depends entirely on how wide the card is.
 */
export const CATEGORY_CARD_CHROME = {
  rating: {
    top: 8,
    left: 8,
    paddingX: 8,
    paddingY: 3,
    fontFamily: HN,
    fontSize: 11,
    fontWeight: 600,
    lineHeight: 1,
    /** Flex gap between the star, the score and the review count. */
    gap: 4,
    background: CHIP_BG,
    color: INK,
    countColor: MUTED,
    countWeight: 400,
    starColor: STAR,
  },
  heart: {
    top: 8,
    right: 8,
    size: 26,
    iconSize: 16,
    strokeWidth: 2,
    background: CHIP_BG,
    shadow: CHIP_SHADOW,
    blur: CHIP_BLUR,
    idleColor: HEART_IDLE,
    savedColor: HEART_INK,
  },
} as const;

/**
 * The tile on a member's Saved screen — SavedCard.tsx.
 *
 * The heart's 30px circle is centred in a 44px hit area offset by −3, which
 * lands the visible circle 4px in from the top and the right; the type capsule
 * is pinned to the same 4px so the two tops line up.
 */
export const SAVED_CARD_CHROME = {
  /** Left/right and bottom inset shared by the capsule and the bottom pills. */
  inset: 8,
  /** Top inset of the type capsule — matched to the heart circle. */
  top: 4,
  chip: {
    height: 20,
    paddingX: 8,
    background: CHIP_BG_SOFT,
    shadow: CHIP_SHADOW,
    blur: CHIP_BLUR,
    /** `type.label` — 10px / 700 / 0.1em / uppercase. */
    fontFamily: HN,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.1em",
    lineHeight: 1,
  },
  typeCapsule: {
    letterSpacing: "0.08em",
    color: "#1a1a1a",
  },
  rating: {
    height: 18,
    paddingX: 6,
    color: BODY,
    starColor: STAR,
    /** The review count tightens up so "(294)" doesn't run away. */
    countLetterSpacing: "-0.03em",
  },
  badge: {
    height: 20,
    paddingX: 8,
    letterSpacing: "0.06em",
    endedLetterSpacing: "0.1em",
    dealBackground: DEAL_RED,
    quietBackground: DEAL_OLIVE,
    color: "#FFFFFF",
    endedColor: MUTED,
  },
  heart: {
    /** The visible circle, once the 44px hit area's −3 offset is taken off. */
    top: 4,
    right: 4,
    size: 30,
    iconSize: 16,
    strokeWidth: 2,
    hitArea: 44,
    hitOffset: -3,
    background: CHIP_BG,
    shadow: CHIP_SHADOW,
    blur: CHIP_BLUR,
    color: HEART_INK,
  },
} as const;

/**
 * The specials list card — Specials.tsx `DealCard` with `SpecialBadgePill`.
 *
 * `padding: "4px 9px"` at 10px on a lineHeight of 1.1 stands the badge 19px
 * tall; its width follows the wording, so a long deal name runs wider.
 */
export const SPECIAL_CARD_CHROME = {
  badge: {
    top: 8,
    left: 8,
    fontFamily: HN,
    fontSize: 10,
    fontWeight: 700,
    paddingX: 9,
    paddingY: 4,
    lineHeight: 1.1,
    letterSpacing: "0.06em",
    dealBackground: DEAL_RED,
    quietBackground: DEAL_OLIVE,
    color: "#FFFFFF",
  },
} as const;

/** The date roundel on the Happening Soon poster card — Events.tsx. */
export const POSTER_CARD_CHROME = {
  date: {
    top: 10,
    right: 10,
    size: 46,
    background: CHIP_BG_SOFT,
    blur: CHIP_BLUR,
    month: {
      fontFamily: HN,
      fontSize: 8.5,
      fontWeight: 700,
      letterSpacing: "0.12em",
      color: "#6B6A5E",
      lineHeight: 1,
    },
    day: {
      fontFamily: NOHEMI,
      fontSize: 17,
      fontWeight: 550,
      color: INK,
      lineHeight: 1,
      marginTop: 2,
    },
  },
} as const;

/**
 * Every detail hero — ListingDetail / EventDetail / SpecialDetail /
 * LocalChannelDetail all build theirs the same way.
 *
 * The white title card is pulled up over the picture with `marginTop: -28` and
 * rounds its top corners by 28px, so the bottom 28px is never seen. Back, share
 * and save float over the top at `--overlay-top`, which is
 * `max(safe-top + 10px, 16px)` — 16 in a browser, but pushed well down the
 * picture by the status bar on a notched phone.
 */
export const DETAIL_HERO_CHROME = {
  sheet: { height: 28, radius: 28 },
  button: {
    size: 40,
    iconSize: 20,
    sideInset: 16,
    /** Gap between share and save in the right-hand cluster. */
    gap: 8,
    background: "#FFFFFF",
    shadow: "0 2px 8px rgba(0,0,0,0.18)",
  },
  /** `--overlay-top` in src/index.css. */
  overlayTop: (safeTop: number) => Math.max(safeTop + 10, 16),
} as const;
