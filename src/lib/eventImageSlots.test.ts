import { describe, it, expect } from "vitest";
import { EVENT_IMAGE_SLOTS, eventImageSlot } from "./eventImageSlots";

describe("event image slots", () => {
  it("matches the boxes the app paints", () => {
    // These mirror the hard-coded sizes on the screens named in each comment;
    // if one of those changes, this is the reminder to change the other.
    // Events.tsx — EventCard: 140 wide image column in a 188 tall row.
    expect(eventImageSlot("card").aspect).toBeCloseTo(140 / 188);
    // EventDetail.tsx — hero `aspectRatio: "4 / 3"`.
    expect(eventImageSlot("detail").aspect).toBeCloseTo(4 / 3);
    // HomeWhatsOn.tsx — tile `width: 144, height: 192`.
    expect(eventImageSlot("homepage").aspect).toBeCloseTo(144 / 192);
    // SavedCard.tsx — tile image `aspectRatio: "4 / 3"`.
    expect(eventImageSlot("saved").aspect).toBeCloseTo(4 / 3);
    // EventDetail.tsx — host avatar `width: 48, height: 48`, fully rounded.
    expect(eventImageSlot("host").aspect).toBe(1);
  });

  it("keeps every box on its slot's ratio", () => {
    for (const slot of EVENT_IMAGE_SLOTS) {
      expect(slot.box.width / slot.box.height).toBeCloseTo(slot.aspect, 5);
    }
  });

  it("writes each slot to its own column", () => {
    const fields = EVENT_IMAGE_SLOTS.map((s) => s.field);
    expect(new Set(fields).size).toBe(fields.length);
  });

  it("throws on an unknown slot rather than cropping to a guess", () => {
    // @ts-expect-error — deliberately off the union
    expect(() => eventImageSlot("nope")).toThrow(/Unknown event image slot/);
  });
});
