import { describe, it, expect } from "vitest";
import { CHANNEL_IMAGE_SLOTS, channelImageSlot } from "./channelImageSlots";
import { EVENT_IMAGE_SLOTS } from "./eventImageSlots";
import { LISTING_IMAGE_SLOTS, listingImageSlot } from "./listingImageSlots";
import { SPECIAL_IMAGE_SLOTS, specialImageSlot } from "./specialImageSlots";
import type { ImageSlot } from "./imageSlots";

const FAMILIES: [string, ImageSlot[]][] = [
  ["events", EVENT_IMAGE_SLOTS],
  ["listings", LISTING_IMAGE_SLOTS],
  ["specials", SPECIAL_IMAGE_SLOTS],
  ["channels", CHANNEL_IMAGE_SLOTS],
];

describe.each(FAMILIES)("%s image slots", (_name, slots) => {
  it("keeps every box on its slot's ratio", () => {
    // The box is what the guides are measured against, so a box that has
    // drifted off the ratio puts the chrome in the wrong place as well as
    // cropping to the wrong shape.
    for (const slot of slots) {
      expect(slot.box.width / slot.box.height).toBeCloseTo(slot.aspect, 5);
    }
  });

  it("writes each slot to its own column", () => {
    const fields = slots.map((s) => s.field);
    expect(new Set(fields).size).toBe(fields.length);
  });

  it("keeps every guide inside the box it is measured against", () => {
    for (const slot of slots) {
      for (const guide of slot.guides ?? []) {
        const { shape } = guide;
        if (shape.kind === "sheet") {
          expect(shape.height).toBeLessThan(slot.box.height);
        }
        if (shape.kind === "circle") {
          expect(shape.size + (guide.y ?? 0)).toBeLessThanOrEqual(slot.box.height);
          expect(shape.size + (guide.x ?? 0)).toBeLessThanOrEqual(slot.box.width);
        }
        if (shape.kind === "pill") {
          expect(shape.height + (guide.y ?? 0)).toBeLessThanOrEqual(slot.box.height);
        }
      }
    }
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
      expect(slot.guides?.some((g) => g.shape.kind === "circleMask")).toBe(true);
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
      const sheet = slot.guides?.find((g) => g.shape.kind === "sheet");
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
