import { describe, it, expect } from "vitest";
import { EVENT_IMAGE_SLOTS, eventImageSlot } from "./eventImageSlots";
import { slotBox, slotGuides } from "./imageSlots";

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
    // Search.tsx — ResultRow avatar `width: 42, height: 42`, fully rounded.
    expect(eventImageSlot("search").aspect).toBe(1);
  });

  it("keeps every box on its slot's ratio", () => {
    for (const slot of EVENT_IMAGE_SLOTS) {
      expect(slotBox(slot).width / slotBox(slot).height).toBeCloseTo(slot.aspect, 5);
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

  it("rules the homepage tile at 28px and 126px down a 192px box", () => {
    const slot = eventImageSlot("homepage");
    // The tile itself is untouched — the rulers are drawn over it, not cut into it.
    expect(slotBox(slot)).toEqual({ width: 144, height: 192 });
    const rulers = slotGuides(slot).filter((g) => g.shape.kind === "hline");
    expect(rulers.map((g) => (g.shape as { y: number }).y)).toEqual([28, 126]);
    // One legend covers the pair, so it is not read out twice under the frame.
    expect(rulers.map((g) => g.legend).filter((l) => l !== "")).toHaveLength(1);
  });

  it("rules the detail hero at 59px and 324px down a 360px box", () => {
    const slot = eventImageSlot("detail");
    // The hero keeps its 4:3 shape at the shell's widest — 480 x 360.
    expect(slotBox(slot)).toEqual({ width: 480, height: 360 });
    const rulers = slotGuides(slot).filter((g) => g.shape.kind === "hline");
    expect(rulers.map((g) => (g.shape as { y: number }).y)).toEqual([59, 324]);
    expect(rulers.map((g) => g.legend).filter((l) => l !== "")).toHaveLength(1);
    // The hero's own chrome is still drawn: three floating buttons and the sheet.
    const chrome = slotGuides(slot).filter((g) => g.shape.kind !== "hline");
    expect(chrome.filter((g) => g.shape.kind === "circle")).toHaveLength(3);
    expect(chrome.filter((g) => g.shape.kind === "sheet")).toHaveLength(1);
  });
});
