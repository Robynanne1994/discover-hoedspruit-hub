import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import {
  APP_SHELL_MAX_WIDTH,
  CATEGORY_CARD_GRID,
  gridCardWidth,
  insetWidth,
  PREVIEW_VIEWPORTS,
  previewViewport,
  SAVED_CARD_GRID,
  shellWidth,
} from "./appLayout";

describe("the app shell", () => {
  it("is the width App.tsx actually caps the page at", () => {
    // Everything the crop guides do is scaled off this number. If the shell is
    // widened and this constant isn't, every guide in the admin editor goes
    // back to being drawn too large and too low on the picture.
    const app = readFileSync(resolve(__dirname, "../App.tsx"), "utf8");
    expect(app).toContain(`max-w-[${APP_SHELL_MAX_WIDTH}px]`);
  });

  it("stops growing past its cap", () => {
    expect(shellWidth(320)).toBe(320);
    expect(shellWidth(APP_SHELL_MAX_WIDTH)).toBe(APP_SHELL_MAX_WIDTH);
    expect(shellWidth(1440)).toBe(APP_SHELL_MAX_WIDTH);
  });
});

describe("card widths", () => {
  it("works a category card out of the page inset and the gutter", () => {
    // CategoryPage.tsx — `paddingLeft/Right: 20`, `gap: 18`, two columns.
    expect(gridCardWidth(CATEGORY_CARD_GRID, 390)).toBeCloseTo(166, 5);
    expect(gridCardWidth(CATEGORY_CARD_GRID, 480)).toBeCloseTo(211, 5);
    expect(gridCardWidth(CATEGORY_CARD_GRID, 1440)).toBeCloseTo(211, 5);
  });

  it("works a saved tile out of its own, narrower gutter", () => {
    expect(gridCardWidth(SAVED_CARD_GRID, 480)).toBeCloseTo(214, 5);
  });

  it("fills the page's gutters for a full-width block", () => {
    expect(insetWidth(20, 480)).toBe(440);
    expect(insetWidth(20, 360)).toBe(320);
  });
});

describe("preview devices", () => {
  it("offers the widest last, and falls back to it", () => {
    const widest = PREVIEW_VIEWPORTS[PREVIEW_VIEWPORTS.length - 1];
    expect(widest.width).toBe(APP_SHELL_MAX_WIDTH);
    expect(previewViewport(9999)).toBe(widest);
  });

  it("carries each device's status-bar inset", () => {
    // The hero's floating buttons are pushed down by it, so a preview that
    // ignored it would put them where no phone paints them.
    expect(previewViewport(390).safeTop).toBeGreaterThan(0);
    expect(previewViewport(APP_SHELL_MAX_WIDTH).safeTop).toBe(0);
  });
});
