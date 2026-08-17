import { describe, it, expect } from "vitest";
import { coverCropArea, cropPreviewLayout, exportSize } from "./cropPreview";
import { CHANNEL_IMAGE_SLOTS, channelImageSlot } from "./channelImageSlots";
import { slotBox } from "./imageSlots";

describe("coverCropArea", () => {
  it("takes the full height of a photo wider than the target", () => {
    // 2000x1000 into 1:1 — a 1000x1000 square out of the middle.
    expect(coverCropArea({ width: 2000, height: 1000 }, 1)).toEqual({
      x: 500,
      y: 0,
      width: 1000,
      height: 1000,
    });
  });

  it("takes the full width of a photo taller than the target", () => {
    // 1200x1600 into 4:3 — a 1200x900 band out of the middle.
    expect(coverCropArea({ width: 1200, height: 1600 }, 4 / 3)).toEqual({
      x: 0,
      y: 350,
      width: 1200,
      height: 900,
    });
  });

  it("keeps a photo already on ratio whole", () => {
    expect(coverCropArea({ width: 900, height: 1280 }, 90 / 128)).toEqual({
      x: 0,
      y: 0,
      width: 900,
      height: 1280,
    });
  });

  it("gives up on a degenerate source", () => {
    expect(coverCropArea({ width: 0, height: 0 }, 1)).toBeUndefined();
    expect(coverCropArea({ width: 100, height: 100 }, 0)).toBeUndefined();
  });
});

describe("cropPreviewLayout", () => {
  it("scales the crop up to the preview box and offsets the photo behind it", () => {
    // A 400x300 crop taken 100px in from the left of an 800x600 photo, shown
    // in a 200x150 box: everything halves.
    const layout = cropPreviewLayout(
      { width: 800, height: 600 },
      { x: 100, y: 60, width: 400, height: 300 },
      { width: 200, height: 150 },
    );
    expect(layout.crop).toEqual({ left: 0, top: 0, width: 200, height: 150 });
    expect(layout.image).toEqual({ left: -50, top: -30, width: 400, height: 300 });
  });

  it("covers the box and centres the overflow when the ratios disagree", () => {
    // A square crop in a 200x100 box: scale by width, spill evenly top and bottom.
    const layout = cropPreviewLayout(
      { width: 1000, height: 1000 },
      { x: 0, y: 0, width: 500, height: 500 },
      { width: 200, height: 100 },
    );
    expect(layout.crop.width).toBe(200);
    expect(layout.crop.height).toBe(200);
    expect(layout.crop.top).toBe(-50);
    expect(layout.crop.left).toBe(0);
  });

  it("keeps the background visible where the crop runs off the photo", () => {
    // Zoomed out past the edges: the photo sits inset inside the export.
    const layout = cropPreviewLayout(
      { width: 100, height: 100 },
      { x: -50, y: -50, width: 200, height: 200 },
      { width: 400, height: 400 },
    );
    expect(layout.image).toEqual({ left: 100, top: 100, width: 200, height: 200 });
  });

  it("returns nothing to draw for an empty crop or box", () => {
    const empty = cropPreviewLayout({ width: 10, height: 10 }, { x: 0, y: 0, width: 0, height: 5 }, { width: 4, height: 4 });
    expect(empty.crop.width).toBe(0);
    expect(empty.image.width).toBe(0);
  });
});

describe("exportSize", () => {
  it("derives the height from the target ratio so cover has nothing to trim", () => {
    // react-easy-crop reports fractional pixels; rounding each side alone
    // would land at 1600x1200.something and drift off 4:3.
    expect(exportSize({ x: 0, y: 0, width: 1600.4, height: 1200.3 }, 4 / 3)).toEqual({
      width: 1600,
      height: 1200,
    });
  });

  it("rounds both sides when the crop is free-form", () => {
    expect(exportSize({ x: 0, y: 0, width: 640.6, height: 480.2 })).toEqual({
      width: 641,
      height: 480,
    });
  });

  it("never exports a zero-sized canvas", () => {
    expect(exportSize({ x: 0, y: 0, width: 0.1, height: 0.1 }, 1)).toEqual({ width: 1, height: 1 });
  });
});

describe("channel image slots", () => {
  it("matches the boxes the app paints", () => {
    // These mirror the hard-coded sizes on the screens named in each comment;
    // if one of those changes, this is the reminder to change the other.
    expect(channelImageSlot("listing").aspect).toBeCloseTo(90 / 128);
    expect(channelImageSlot("homepage").aspect).toBe(1);
    expect(channelImageSlot("detail").aspect).toBeCloseTo(4 / 3);
    expect(channelImageSlot("saved").aspect).toBeCloseTo(4 / 3);
  });

  it("keeps every preview box on its slot's ratio", () => {
    for (const slot of CHANNEL_IMAGE_SLOTS) {
      expect(slotBox(slot).width / slotBox(slot).height).toBeCloseTo(slot.aspect, 5);
    }
  });

  it("writes each slot to its own column", () => {
    const fields = CHANNEL_IMAGE_SLOTS.map((s) => s.field);
    expect(new Set(fields).size).toBe(fields.length);
  });
});
