/**
 * The chrome the app paints *on top of* a picture, described once so the crop
 * tool can draw it while you position the image.
 *
 * Cropping to the right shape only solves half the problem. A category card
 * also lays a rating pill over the top-left corner and a heart over the
 * top-right; a saved card adds a type capsule and a deal badge; a detail hero
 * loses its bottom 28px under the white title card. Crop without knowing that
 * and the poster's own title ends up underneath a heart — which is exactly what
 * the crop preview was supposed to prevent.
 *
 * Every measurement here is in the same px scale as its slot's `box`, taken
 * from the component named beside it. CropGuides scales the whole set by
 * `frame width ÷ box width`, so the guide is life-size relative to the crop no
 * matter how big the dialog draws it.
 *
 * Keep these numbers in step with the screens they name.
 */

export type GuideAnchor = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export type GuideShape =
  /** A rounded chip — rating, type capsule, deal badge. */
  | {
      kind: "pill";
      text: string;
      /** A second, lighter run of text after `text` — e.g. a review count. */
      mutedText?: string;
      height: number;
      paddingX: number;
      fontSize: number;
      /** Matches the live chip's weight. Defaults to 700. */
      fontWeight?: number;
      /** Space between the star / text runs, in box px. Defaults to 4. */
      gap?: number;
      letterSpacing?: string;
      /** `light` is the frosted white chip; `deal` red; `quiet` olive. */
      tone: "light" | "deal" | "quiet";
      /** Lead the text with a ★, the way rating chips do. */
      star?: boolean;
    }
  /** A round button or badge floating on the image. */
  | {
      kind: "circle";
      size: number;
      glyph: "heart" | "date";
      /** The lucide icon size the live button uses. Defaults to 55% of `size`. */
      iconSize?: number;
      strokeWidth?: number;
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
 * The white title card on every detail page.
 *
 * EventDetail / ListingDetail / SpecialDetail / LocalChannelDetail all pull the
 * sheet up over the hero with `marginTop: -28` and round its top corners by
 * 28px, so the bottom 28px of the picture is never seen.
 */
export const titleSheetGuide = ({ height = 28, radius = 28 } = {}): SlotGuide => ({
  key: "title-sheet",
  legend: "The white title card laps over the bottom of the image — keep anything important above the dashed line.",
  shape: { kind: "sheet", height, radius, label: "Covered by the white title card" },
});

/** The save button. Sizes and insets differ per card, so they're passed in. */
export const heartGuide = ({
  size,
  x,
  y,
  iconSize,
}: {
  size: number;
  x: number;
  y: number;
  iconSize?: number;
}): SlotGuide => ({
  key: "heart",
  legend: "The save (heart) button sits in the top-right corner.",
  anchor: "top-right",
  x,
  y,
  shape: { kind: "circle", size, glyph: "heart", iconSize, strokeWidth: 2 },
});

/**
 * The category page card — CategoryPage.tsx.
 *
 * The rating chip is `top: 8, left: 8` with `padding: "3px 8px"` at 11px on a
 * lineHeight of 1, so it stands 17px tall; the rating runs at weight 600 and
 * the review count at 400, separated by a 4px gap. CardHeart is a 26px circle
 * at `top: 8, right: 8` carrying a 16px lucide heart. The sample text is a
 * representative rating and review count; a longer count runs a few px wider.
 */
export const categoryCardGuides = (): SlotGuide[] => [
  {
    key: "rating",
    legend: "The ★ rating and review count sit in the top-left corner.",
    anchor: "top-left",
    x: 8,
    y: 8,
    shape: {
      kind: "pill",
      text: "4.3",
      mutedText: "(294)",
      star: true,
      height: 17,
      paddingX: 8,
      fontSize: 11,
      fontWeight: 600,
      gap: 4,
      tone: "light",
    },
  },
  heartGuide({ size: 26, x: 8, y: 8, iconSize: 16 }),
];


/**
 * The tile on a member's Saved screen — SavedCard.tsx.
 *
 * The type capsule is a 20px chip at `top: 4, left: 8`. The heart's 30px circle
 * lands 4px in from the top and right (its 44px hit area is offset by -3). The
 * bottom-left slot holds either the rating chip (listings, 18px at inset 8) or
 * the deal / "Ended" badge (specials, 20px at the same inset).
 */
export const savedCardGuides = (
  typeLabel: string,
  bottomLeft?: { kind: "rating" } | { kind: "deal"; text: string },
): SlotGuide[] => {
  const guides: SlotGuide[] = [
    {
      key: "type-capsule",
      legend: `The "${typeLabel}" capsule sits in the top-left corner.`,
      anchor: "top-left",
      x: 8,
      y: 4,
      shape: {
        kind: "pill",
        text: typeLabel,
        height: 20,
        paddingX: 8,
        fontSize: 10,
        letterSpacing: "0.08em",
        tone: "light",
      },
    },
    heartGuide({ size: 30, x: 4, y: 4 }),
  ];

  if (bottomLeft?.kind === "rating") {
    guides.push({
      key: "rating",
      legend: "The ★ rating and review count sit in the bottom-left corner.",
      anchor: "bottom-left",
      x: 8,
      y: 8,
      shape: { kind: "pill", text: "4.3 (294)", star: true, height: 18, paddingX: 6, fontSize: 10, tone: "light" },
    });
  }

  if (bottomLeft?.kind === "deal") {
    guides.push({
      key: "deal",
      legend: "The deal badge sits in the bottom-left corner — its width follows the wording.",
      anchor: "bottom-left",
      x: 8,
      y: 8,
      shape: {
        kind: "pill",
        text: bottomLeft.text,
        height: 20,
        paddingX: 8,
        fontSize: 10,
        letterSpacing: "0.06em",
        tone: "deal",
      },
    });
  }

  return guides;
};

/** The badge on a specials list card — Specials.tsx, `top: 8, left: 8`. */
export const specialCardBadgeGuide = (text = "30% OFF"): SlotGuide => ({
  key: "special-badge",
  legend: "The deal badge sits in the top-left corner — its width follows the wording.",
  anchor: "top-left",
  x: 8,
  y: 8,
  shape: { kind: "pill", text, height: 19, paddingX: 9, fontSize: 10, letterSpacing: "0.06em", tone: "deal" },
});

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

/** The date roundel on the Happening Soon poster card — Events.tsx, 46px at 10,10. */
export const posterDateGuide = (): SlotGuide => ({
  key: "poster-date",
  legend: "The date roundel sits in the top-right corner.",
  anchor: "top-right",
  x: 10,
  y: 10,
  shape: { kind: "circle", size: 46, glyph: "date" },
});
