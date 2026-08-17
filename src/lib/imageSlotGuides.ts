/**
 * The app's chrome, described so the crop tool can draw it while you position
 * a picture underneath.
 *
 * Cropping to the right shape only solves half the problem. A category card
 * lays a rating chip over the top-left corner and a heart over the top-right; a
 * saved card adds a type capsule and a deal badge; a detail hero carries three
 * floating buttons and loses its bottom 28px under the white title card. Crop
 * without knowing that and the poster's own title ends up underneath a heart —
 * which is exactly what the crop preview was supposed to prevent.
 *
 * Every measurement comes from `cardChrome.ts`, which the live screens style
 * themselves from, so a guide cannot describe a chip the app no longer paints.
 * The numbers are in CSS px exactly as the phone paints them; `CropGuides`
 * scales the whole set by `frame width ÷ box width`, so the guide is life-size
 * relative to the crop no matter how big the dialog draws it.
 */

import {
  CATEGORY_CARD_CHROME,
  DETAIL_HERO_CHROME,
  POSTER_CARD_CHROME,
  SAVED_CARD_CHROME,
  SPECIAL_CARD_CHROME,
} from "./cardChrome";

export type GuideAnchor = "top-left" | "top-right" | "bottom-left" | "bottom-right";

/** One run of text inside a chip — the star, the score, the review count. */
export type PillRun = {
  text: string;
  color?: string;
  fontWeight?: number;
  letterSpacing?: string;
};

/** What sits inside a round button or badge. */
export type CircleContent =
  | { kind: "icon"; icon: "heart" | "heart-idle" | "back" | "share"; size: number; strokeWidth: number; color: string }
  | { kind: "date"; month: string; day: string };

export type GuideShape =
  /** A rounded chip — rating, type capsule, deal badge. */
  | {
      kind: "pill";
      runs: PillRun[];
      /**
       * The runs share one text flow (spaces between them) rather than being
       * separate flex items. SavedCard's rating chip is written that way; the
       * category card's is a flex row with a `gap`.
       */
      inline?: boolean;
      /** Fixed height, where the live chip sets one. */
      height?: number;
      /** Otherwise the height is padding + line box, as the live chip computes it. */
      paddingY?: number;
      paddingX: number;
      fontFamily: string;
      fontSize: number;
      fontWeight: number;
      lineHeight: number;
      letterSpacing?: string;
      uppercase?: boolean;
      /** Flex gap between runs, when they are not `inline`. */
      gap?: number;
      background: string;
      color: string;
      shadow?: string;
    }
  /** A round button or badge floating on the image. */
  | {
      kind: "circle";
      size: number;
      background: string;
      shadow?: string;
      content: CircleContent;
    }
  /** The white sheet that laps over the bottom of a detail hero. */
  | { kind: "sheet"; height: number; radius: number; label: string }
  /** The whole image clipped to a circle, as search rows and avatars do. */
  | { kind: "circleMask"; label: string };

export type SlotGuide = {
  key: string;
  /** One line under the crop frame naming what the guide stands for. */
  legend: string;
  /** Which corner it pins to. Sheets and masks ignore this. */
  anchor?: GuideAnchor;
  /** Inset from the anchored edges, in the slot's box scale. */
  x?: number;
  y?: number;
  shape: GuideShape;
};

/**
 * How tall a chip comes out.
 *
 * A chip with a fixed height says so; the rest stand as tall as their padding
 * plus one line box, which is how the browser lays the live chip out.
 */
export const pillHeight = (shape: Extract<GuideShape, { kind: "pill" }>) =>
  shape.height ?? (shape.paddingY ?? 0) * 2 + shape.fontSize * shape.lineHeight;

/** The height a guide occupies, for the "does it fit in the box" checks. */
export const guideHeight = (shape: GuideShape) => {
  if (shape.kind === "pill") return pillHeight(shape);
  if (shape.kind === "circle") return shape.size;
  if (shape.kind === "sheet") return shape.height;
  return 0;
};

/* ------------------------------------------------------------------ *
 * Detail heroes — ListingDetail / EventDetail / SpecialDetail /
 * LocalChannelDetail all build the same hero.
 * ------------------------------------------------------------------ */

const { sheet, button } = DETAIL_HERO_CHROME;

/** The white title card that laps over the bottom of every detail hero. */
export const titleSheetGuide = ({ height = sheet.height, radius = sheet.radius } = {}): SlotGuide => ({
  key: "title-sheet",
  legend:
    "The white title card laps over the bottom of the image — keep anything important above the dashed line.",
  shape: { kind: "sheet", height, radius, label: "Covered by the white title card" },
});

const heroButton = (
  key: string,
  legend: string,
  anchor: GuideAnchor,
  x: number,
  y: number,
  icon: "back" | "share" | "heart",
): SlotGuide => ({
  key,
  legend,
  anchor,
  x,
  y,
  shape: {
    kind: "circle",
    size: button.size,
    background: button.background,
    shadow: button.shadow,
    content: {
      kind: "icon",
      icon,
      size: button.iconSize,
      strokeWidth: icon === "heart" ? 2 : 1.6,
      color: "#2b2420",
    },
  },
});

/**
 * Everything a detail hero carries: back, share and save floating over the top
 * corners, and the title card over the bottom.
 *
 * `safeTop` is the device's status-bar inset. The buttons sit at
 * `max(safe-top + 10, 16)`, so on a notched phone they ride a good 40px further
 * down the picture than they do in a desktop browser — which is why the preview
 * asks which device you are checking against.
 */
export const detailHeroGuides = (safeTop = 0): SlotGuide[] => {
  const top = DETAIL_HERO_CHROME.overlayTop(safeTop);
  return [
    heroButton("hero-back", "The back button floats over the top-left corner.", "top-left", button.sideInset, top, "back"),
    heroButton(
      "hero-share",
      "Share and save sit in the top-right corner, side by side.",
      "top-right",
      button.sideInset + button.size + button.gap,
      top,
      "share",
    ),
    // Shares the line above it — one legend covers the pair.
    heroButton("hero-save", "", "top-right", button.sideInset, top, "heart"),
    titleSheetGuide(),
  ];
};

/* ------------------------------------------------------------------ *
 * Category page cards — CategoryPage.tsx
 * ------------------------------------------------------------------ */

/**
 * The rating chip and the save heart, exactly as CategoryPage paints them.
 *
 * The sample rating and review count are representative: the chip's width
 * follows its wording, so a four-figure review count runs a few px wider.
 */
export const categoryCardGuides = ({
  rating = "4.3",
  reviews = "294",
}: { rating?: string; reviews?: string } = {}): SlotGuide[] => {
  const chip = CATEGORY_CARD_CHROME.rating;
  const heart = CATEGORY_CARD_CHROME.heart;
  return [
    {
      key: "rating",
      legend: "The ★ rating and review count sit in the top-left corner.",
      anchor: "top-left",
      x: chip.left,
      y: chip.top,
      shape: {
        kind: "pill",
        runs: [
          { text: "★", color: chip.starColor },
          { text: rating },
          { text: `(${reviews})`, color: chip.countColor, fontWeight: chip.countWeight },
        ],
        paddingX: chip.paddingX,
        paddingY: chip.paddingY,
        fontFamily: chip.fontFamily,
        fontSize: chip.fontSize,
        fontWeight: chip.fontWeight,
        lineHeight: chip.lineHeight,
        gap: chip.gap,
        background: chip.background,
        color: chip.color,
      },
    },
    {
      key: "heart",
      legend: "The save (heart) button sits in the top-right corner.",
      anchor: "top-right",
      x: heart.right,
      y: heart.top,
      shape: {
        kind: "circle",
        size: heart.size,
        background: heart.background,
        shadow: heart.shadow,
        content: {
          kind: "icon",
          icon: "heart-idle",
          size: heart.iconSize,
          strokeWidth: heart.strokeWidth,
          color: heart.idleColor,
        },
      },
    },
  ];
};

/* ------------------------------------------------------------------ *
 * Saved screen tiles — SavedCard.tsx
 * ------------------------------------------------------------------ */

/**
 * The type capsule, the heart, and whichever pill the card puts bottom-left:
 * the rating (listings) or the deal / "Ended" badge (specials and past events).
 */
export const savedCardGuides = (
  typeLabel: string,
  bottomLeft?: { kind: "rating"; rating?: string; reviews?: string } | { kind: "deal"; text: string },
): SlotGuide[] => {
  const c = SAVED_CARD_CHROME;
  const guides: SlotGuide[] = [
    {
      key: "type-capsule",
      legend: `The "${typeLabel}" capsule sits in the top-left corner.`,
      anchor: "top-left",
      x: c.inset,
      y: c.top,
      shape: {
        kind: "pill",
        runs: [{ text: typeLabel }],
        height: c.chip.height,
        paddingX: c.chip.paddingX,
        fontFamily: c.chip.fontFamily,
        fontSize: c.chip.fontSize,
        fontWeight: c.chip.fontWeight,
        lineHeight: c.chip.lineHeight,
        letterSpacing: c.typeCapsule.letterSpacing,
        uppercase: true,
        background: c.chip.background,
        color: c.typeCapsule.color,
        shadow: c.chip.shadow,
      },
    },
    {
      key: "heart",
      legend: "The save (heart) button sits in the top-right corner.",
      anchor: "top-right",
      x: c.heart.right,
      y: c.heart.top,
      shape: {
        kind: "circle",
        size: c.heart.size,
        background: c.heart.background,
        shadow: c.heart.shadow,
        content: {
          kind: "icon",
          icon: "heart",
          size: c.heart.iconSize,
          strokeWidth: c.heart.strokeWidth,
          color: c.heart.color,
        },
      },
    },
  ];

  if (bottomLeft?.kind === "rating") {
    const rating = bottomLeft.rating ?? "4.3";
    const reviews = bottomLeft.reviews ?? "294";
    guides.push({
      key: "rating",
      legend: "The ★ rating and review count sit in the bottom-left corner.",
      anchor: "bottom-left",
      x: c.inset,
      y: c.inset,
      shape: {
        kind: "pill",
        runs: [
          { text: "★", color: c.rating.starColor },
          { text: rating },
          { text: `(${reviews})`, letterSpacing: c.rating.countLetterSpacing },
        ],
        // SavedCard writes the whole thing as one run of text, spaces and all,
        // so the guide does too — a flex gap would come out a shade wider.
        inline: true,
        height: c.rating.height,
        paddingX: c.rating.paddingX,
        fontFamily: c.chip.fontFamily,
        fontSize: c.chip.fontSize,
        fontWeight: c.chip.fontWeight,
        lineHeight: c.chip.lineHeight,
        letterSpacing: c.chip.letterSpacing,
        uppercase: true,
        background: c.chip.background,
        color: c.rating.color,
        shadow: c.chip.shadow,
      },
    });
  }

  if (bottomLeft?.kind === "deal") {
    guides.push({
      key: "deal",
      legend: "The deal badge sits in the bottom-left corner — its width follows the wording.",
      anchor: "bottom-left",
      x: c.inset,
      y: c.inset,
      shape: {
        kind: "pill",
        runs: [{ text: bottomLeft.text }],
        height: c.badge.height,
        paddingX: c.badge.paddingX,
        fontFamily: c.chip.fontFamily,
        fontSize: c.chip.fontSize,
        fontWeight: c.chip.fontWeight,
        lineHeight: c.chip.lineHeight,
        letterSpacing: c.badge.letterSpacing,
        uppercase: true,
        background: c.badge.dealBackground,
        color: c.badge.color,
        shadow: c.chip.shadow,
      },
    });
  }

  return guides;
};

/* ------------------------------------------------------------------ *
 * Specials list cards — Specials.tsx + SpecialBadgePill.tsx
 * ------------------------------------------------------------------ */

export const specialCardBadgeGuide = (text = "30% OFF"): SlotGuide => {
  const b = SPECIAL_CARD_CHROME.badge;
  return {
    key: "special-badge",
    legend: "The deal badge sits in the top-left corner — its width follows the wording.",
    anchor: "top-left",
    x: b.left,
    y: b.top,
    shape: {
      kind: "pill",
      runs: [{ text }],
      paddingX: b.paddingX,
      paddingY: b.paddingY,
      fontFamily: b.fontFamily,
      fontSize: b.fontSize,
      fontWeight: b.fontWeight,
      lineHeight: b.lineHeight,
      letterSpacing: b.letterSpacing,
      uppercase: true,
      background: b.dealBackground,
      color: b.color,
    },
  };
};

/* ------------------------------------------------------------------ *
 * Event poster cards — Events.tsx
 * ------------------------------------------------------------------ */

/** The date roundel on the Happening Soon poster card. */
export const posterDateGuide = ({ month = "SEP", day = "18" } = {}): SlotGuide => {
  const d = POSTER_CARD_CHROME.date;
  return {
    key: "poster-date",
    legend: "The date roundel sits in the top-right corner.",
    anchor: "top-right",
    x: d.right,
    y: d.top,
    shape: {
      kind: "circle",
      size: d.size,
      background: d.background,
      content: { kind: "date", month, day },
    },
  };
};

/* ------------------------------------------------------------------ *
 * Round crops
 * ------------------------------------------------------------------ */

/** Anywhere the picture is clipped to a circle. */
export const circleMaskGuide = (legend: string): SlotGuide => ({
  key: "circle-mask",
  legend,
  shape: { kind: "circleMask", label: "Trimmed to a circle" },
});

/**
 * A search row's avatar — Search.tsx paints a 42px circle with
 * `object-fit: cover`, so the corners of a square crop are thrown away.
 */
export const searchCircleGuide = (): SlotGuide =>
  circleMaskGuide("Search results are round — everything outside the circle is trimmed off.");

/** A slot's legends, dropping the blanks that share the line above them. */
export const guideLegends = (guides: SlotGuide[]) =>
  guides.map((g) => g.legend).filter((legend) => legend !== "");
