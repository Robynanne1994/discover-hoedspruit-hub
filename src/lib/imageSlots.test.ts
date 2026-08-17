import { describe, it, expect } from "vitest";
import {
  APP_SHELL_MAX_WIDTH,
  CATEGORY_CARD_GRID,
  DEFAULT_PREVIEW_WIDTH,
  gridCardWidth,
  PREVIEW_VIEWPORTS,
  SAVED_CARD_GRID,
  shellWidth,
} from "./appLayout";
import { CATEGORY_CARD_CHROME, DETAIL_HERO_CHROME, SAVED_CARD_CHROME } from "./cardChrome";
import { CHANNEL_IMAGE_SLOTS, channelImageSlot } from "./channelImageSlots";
import { EVENT_IMAGE_SLOTS } from "./eventImageSlots";
import { guideHeight } from "./imageSlotGuides";
import { LISTING_IMAGE_SLOTS, listingImageSlot } from "./listingImageSlots";
import { SPECIAL_IMAGE_SLOTS, specialImageSlot } from "./specialImageSlots";
import { slotBox, slotGuides, type ImageSlot } from "./imageSlots";

const FAMILIES: [string, ImageSlot[]][] = [
  ["events", EVENT_IMAGE_SLOTS],
  ["listings", LISTING_IMAGE_SLOTS],
  ["specials", SPECIAL_IMAGE_SLOTS],
  ["channels", CHANNEL_IMAGE_SLOTS],
];

const WIDTHS = PREVIEW_VIEWPORTS.map((v) => v.width);

describe.each(FAMILIES)("%s image slots", (_name, slots) => {
  it("keeps every box on its slot's ratio, at every device width", () => {
    // The box is what the guides are measured against, so a box that has
    // drifted off the ratio puts the chrome in the wrong place as well as
    // cropping to the wrong shape.
    for (const slot of slots) {
      for (const viewport of WIDTHS) {
        const box = slotBox(slot, viewport);
        expect(box.width / box.height).toBeCloseTo(slot.aspect, 5);
      }
    }
  });

  it("writes each slot to its own column", () => {
    const fields = slots.map((s) => s.field);
    expect(new Set(fields).size).toBe(fields.length);
  });

  it("keeps every guide inside the box it is measured against", () => {
    for (const slot of slots) {
      for (const viewport of WIDTHS) {
        const box = slotBox(slot, viewport);
        for (const guide of slotGuides(slot, viewport)) {
          const { shape } = guide;
          expect(guideHeight(shape) + (guide.y ?? 0)).toBeLessThanOrEqual(box.height);
          if (shape.kind === "circle") {
            expect(shape.size + (guide.x ?? 0)).toBeLessThanOrEqual(box.width);
          }
        }
      }
    }
  });
});

/**
 * The bug these guard against: every "follows the viewport" box was worked out
 * on a 390pt phone and then frozen, while the app shell actually stops widening
 * at 480. A category card is 211px wide in any window past that, so guides
 * drawn against a 166px box came out 27% too big and 27% too far down the
 * picture — which is what made the editor and the live card disagree.
 */
describe("boxes that follow the viewport", () => {
  it("grows a category card with the shell, and stops where the shell stops", () => {
    const card = listingImageSlot("card");
    expect(slotBox(card, 390).width).toBeCloseTo((390 - 40 - 18) / 2, 5);
    expect(slotBox(card, 480).width).toBeCloseTo((480 - 40 - 18) / 2, 5);
    // Past the shell's cap the card stops growing, so the guides stop shrinking.
    expect(slotBox(card, 1440)).toEqual(slotBox(card, APP_SHELL_MAX_WIDTH));
  });

  it("previews at the shell's widest by default", () => {
    expect(DEFAULT_PREVIEW_WIDTH).toBe(APP_SHELL_MAX_WIDTH);
    expect(slotBox(listingImageSlot("card")).width).toBeCloseTo(
      gridCardWidth(CATEGORY_CARD_GRID, APP_SHELL_MAX_WIDTH),
      5,
    );
  });

  it("gives every saved tile the same box, whichever family it belongs to", () => {
    // One SavedCard paints all four, so one box has to serve all four.
    const saved = [
      listingImageSlot("saved"),
      specialImageSlot("saved"),
      channelImageSlot("saved"),
      EVENT_IMAGE_SLOTS.find((s) => s.key === "saved")!,
    ];
    for (const slot of saved) {
      for (const viewport of WIDTHS) {
        expect(slotBox(slot, viewport).width).toBeCloseTo(
          gridCardWidth(SAVED_CARD_GRID, viewport),
          5,
        );
      }
    }
  });

  it("gives a detail hero the full width of the shell", () => {
    for (const viewport of WIDTHS) {
      expect(slotBox(listingImageSlot("detail"), viewport).width).toBe(shellWidth(viewport));
    }
  });
});

describe("guides drawn from the live chrome", () => {
  it("puts the category card's rating and heart where CategoryPage does", () => {
    const guides = slotGuides(listingImageSlot("card"));
    const rating = guides.find((g) => g.key === "rating")!;
    const heart = guides.find((g) => g.key === "heart")!;

    expect(rating.anchor).toBe("top-left");
    expect(rating.x).toBe(CATEGORY_CARD_CHROME.rating.left);
    expect(rating.y).toBe(CATEGORY_CARD_CHROME.rating.top);
    // `padding: "3px 8px"` at 11px on a lineHeight of 1 stands 17px tall.
    expect(guideHeight(rating.shape)).toBeCloseTo(17, 5);

    expect(heart.anchor).toBe("top-right");
    expect(heart.x).toBe(CATEGORY_CARD_CHROME.heart.right);
    expect(heart.y).toBe(CATEGORY_CARD_CHROME.heart.top);
    expect(guideHeight(heart.shape)).toBe(CATEGORY_CARD_CHROME.heart.size);
  });

  it("draws the heart as CategoryPage draws it before it is saved", () => {
    const heart = slotGuides(listingImageSlot("card")).find((g) => g.key === "heart")!;
    expect(heart.shape).toMatchObject({
      kind: "circle",
      content: {
        kind: "icon",
        icon: "heart-idle",
        size: CATEGORY_CARD_CHROME.heart.iconSize,
        strokeWidth: CATEGORY_CARD_CHROME.heart.strokeWidth,
      },
    });
  });

  it("lines the saved tile's heart up with its type capsule", () => {
    const guides = slotGuides(listingImageSlot("saved"));
    const capsule = guides.find((g) => g.key === "type-capsule")!;
    const heart = guides.find((g) => g.key === "heart")!;
    // The 30px circle sits inside a 44px hit area offset by −3, which is what
    // puts both tops on the same 4px line.
    expect(heart.y).toBe(SAVED_CARD_CHROME.heart.hitOffset + (44 - 30) / 2);
    expect(capsule.y).toBe(heart.y);
  });

  it("moves a detail hero's buttons down by the device's status bar", () => {
    // `--overlay-top` is `max(safe-top + 10px, 16px)`, so the same hero has its
    // buttons 16px down in a browser and 57px down on a 390pt iPhone.
    const desktop = slotGuides(listingImageSlot("detail"), 480).find((g) => g.key === "hero-back")!;
    const phone = slotGuides(listingImageSlot("detail"), 390).find((g) => g.key === "hero-back")!;
    expect(desktop.y).toBe(16);
    expect(phone.y).toBe(DETAIL_HERO_CHROME.overlayTop(47));
    expect(phone.y!).toBeGreaterThan(desktop.y!);
  });

  it("puts share and save side by side in the hero's top-right corner", () => {
    const guides = slotGuides(listingImageSlot("detail"));
    const share = guides.find((g) => g.key === "hero-share")!;
    const save = guides.find((g) => g.key === "hero-save")!;
    const { size, gap, sideInset } = DETAIL_HERO_CHROME.button;
    expect(save.x).toBe(sideInset);
    expect(share.x).toBe(sideInset + size + gap);
    expect(share.y).toBe(save.y);
  });
});

describe("the boxes the app paints", () => {
  it("matches the listing screens", () => {
    // ListingDetail.tsx — hero `aspectRatio: "4 / 3"`.
    expect(listingImageSlot("detail").aspect).toBeCloseTo(4 / 3);
    // CategoryPage.tsx — card image `aspectRatio: "4 / 3"`.
    expect(listingImageSlot("card").aspect).toBeCloseTo(4 / 3);
    // HomeListings.tsx — tile `width: 138` at `aspectRatio: "1 / 1"`.
    expect(listingImageSlot("homepage").aspect).toBe(1);
    // SavedCard.tsx — tile image `aspectRatio: "4 / 3"`.
    expect(listingImageSlot("saved").aspect).toBeCloseTo(4 / 3);
    // Search.tsx — ResultRow avatar `width: 42, height: 42`, fully rounded.
    expect(listingImageSlot("search").aspect).toBe(1);
  });

  it("matches the specials screens", () => {
    // Specials.tsx — DealCard image `aspectRatio: "1 / 1"`.
    expect(specialImageSlot("card").aspect).toBe(1);
    // SpecialDetail.tsx — hero `aspectRatio: "4 / 3"`.
    expect(specialImageSlot("detail").aspect).toBeCloseTo(4 / 3);
    // Specials.tsx — FeaturedCard image `aspectRatio: "3 / 2"`.
    expect(specialImageSlot("featured").aspect).toBeCloseTo(3 / 2);
  });

  it("matches the local channel screens", () => {
    // LocalChannelDetail.tsx — hero `aspectRatio: "4 / 3"`.
    expect(channelImageSlot("detail").aspect).toBeCloseTo(4 / 3);
    // BushTelegraph.tsx — ChannelCard paints `width: 90, height: 128`.
    expect(channelImageSlot("listing").aspect).toBeCloseTo(90 / 128);
    expect(channelImageSlot("search").aspect).toBe(1);
  });
});

describe("the round surfaces", () => {
  it("mask every crop that lands in a circle", () => {
    // A square crop is only half the job: the app then clips it to a circle,
    // so the editor has to show what the circle throws away.
    const rounded = [
      listingImageSlot("search"),
      specialImageSlot("search"),
      channelImageSlot("search"),
    ];
    for (const slot of rounded) {
      expect(slotGuides(slot).some((g) => g.shape.kind === "circleMask")).toBe(true);
    }
  });
});

describe("the detail heroes", () => {
  it("all warn about the white title card", () => {
    // Every detail page pulls its title sheet up with `marginTop: -28`, so all
    // four families need the same guide — that is the whole point of sharing it.
    const heroes = [
      listingImageSlot("detail"),
      specialImageSlot("detail"),
      channelImageSlot("detail"),
      EVENT_IMAGE_SLOTS.find((s) => s.key === "detail")!,
    ];
    for (const slot of heroes) {
      const sheet = slotGuides(slot).find((g) => g.shape.kind === "sheet");
      expect(sheet).toBeDefined();
      expect(sheet!.shape).toMatchObject({ kind: "sheet", height: 28, radius: 28 });
    }
  });
});

describe("unknown slots", () => {
  it("throw rather than cropping to a guess", () => {
    // @ts-expect-error — deliberately off the union
    expect(() => listingImageSlot("nope")).toThrow(/Unknown listing image slot/);
    // @ts-expect-error — deliberately off the union
    expect(() => specialImageSlot("nope")).toThrow(/Unknown special image slot/);
    // @ts-expect-error — deliberately off the union
    expect(() => channelImageSlot("nope")).toThrow(/Unknown channel image slot/);
  });
});
