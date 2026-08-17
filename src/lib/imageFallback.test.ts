import { describe, expect, it } from "vitest";
import {
  channelImage,
  eventImage,
  listingImage,
  slotColumns,
  specialSurfaceImage,
  CHANNEL_IMAGE_COLUMNS,
  EVENT_IMAGE_COLUMNS,
  LISTING_IMAGE_COLUMNS,
  SPECIAL_IMAGE_COLUMNS,
} from "./imageFallback";
import { CHANNEL_IMAGE_SLOTS } from "./channelImageSlots";
import { EVENT_IMAGE_SLOTS } from "./eventImageSlots";
import { LISTING_IMAGE_SLOTS } from "./listingImageSlots";
import { SPECIAL_IMAGE_SLOTS } from "./specialImageSlots";

// The `select(…)` constants are written out by hand — supabase-js needs a
// literal — so this is what stops one drifting from the slots it stands for.
describe("image column lists cover every slot", () => {
  const cases = [
    ["listings", LISTING_IMAGE_COLUMNS, slotColumns(LISTING_IMAGE_SLOTS)],
    ["events", EVENT_IMAGE_COLUMNS, slotColumns(EVENT_IMAGE_SLOTS)],
    ["specials", SPECIAL_IMAGE_COLUMNS, slotColumns(SPECIAL_IMAGE_SLOTS)],
    ["channels", CHANNEL_IMAGE_COLUMNS, slotColumns(CHANNEL_IMAGE_SLOTS, ["qr_image_url"])],
  ] as const;

  it.each(cases)("%s", (_name, written, derived) => {
    expect(written.split(",").map((c) => c.trim()).sort()).toEqual([...derived].sort());
  });
});

describe("a surface prefers its own crop", () => {
  it("uses the slot's own column when it is filled", () => {
    const listing = { image_url: "main.jpg", search_image_url: "round.jpg" };
    expect(listingImage(listing, "search")).toBe("round.jpg");
    expect(listingImage(listing, "detail")).toBe("main.jpg");
  });
});

describe("one picture fills every empty slot", () => {
  it("lends the category card image to the search row and the homepage tile", () => {
    const listing = { card_image_url: "card.jpg" };
    expect(listingImage(listing, "search")).toBe("card.jpg");
    expect(listingImage(listing, "homepage")).toBe("card.jpg");
    expect(listingImage(listing, "saved")).toBe("card.jpg");
    expect(listingImage(listing, "detail")).toBe("card.jpg");
  });

  it("does the same for events, specials and channels", () => {
    expect(eventImage({ poster_image_url: "p.jpg" }, "saved")).toBe("p.jpg");
    expect(specialSurfaceImage({ featured_image_url: "f.jpg" }, "search")).toBe("f.jpg");
    expect(channelImage({ homepage_image_url: "h.jpg" }, "listing")).toBe("h.jpg");
  });

  it("falls back to a QR code rather than leaving a channel blank", () => {
    expect(channelImage({ qr_image_url: "qr.png" }, "homepage")).toBe("qr.png");
  });

  it("treats blank and whitespace-only columns as empty", () => {
    expect(listingImage({ search_image_url: "   ", card_image_url: "" }, "search")).toBeNull();
    expect(listingImage({}, "search")).toBeNull();
    expect(listingImage(null, "search")).toBeNull();
  });
});

describe("the host photo is not the event's picture", () => {
  it("never lends a host's face to an event card", () => {
    expect(eventImage({ hosted_by_image_url: "host.jpg" }, "card")).toBeNull();
  });

  it("still uses it when the host photo is what was asked for", () => {
    expect(eventImage({ hosted_by_image_url: "host.jpg" }, "host")).toBe("host.jpg");
  });
});
