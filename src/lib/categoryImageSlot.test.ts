import { describe, it, expect } from "vitest";
import { CATEGORY_IMAGE_SLOT } from "./categoryImageSlot";
import { coverCropArea, exportSize } from "./cropPreview";

describe("CATEGORY_IMAGE_SLOT", () => {
  it("names the same ratio as both preview boxes", () => {
    const { aspect, grid, list } = CATEGORY_IMAGE_SLOT;
    expect(grid.width / grid.height).toBeCloseTo(aspect, 5);
    expect(list.width / list.height).toBeCloseTo(aspect, 5);
  });

  it("leaves `object-fit: cover` nothing to trim on either card", () => {
    // A landscape source, cropped the way the dialog opens on it, exported the
    // way the dialog exports it — the result has to be square, or the app
    // shaves an edge off after saving.
    const area = coverCropArea({ width: 4032, height: 3024 }, CATEGORY_IMAGE_SLOT.aspect)!;
    const out = exportSize(area, CATEGORY_IMAGE_SLOT.aspect);
    expect(out.width).toBe(out.height);
  });
});
