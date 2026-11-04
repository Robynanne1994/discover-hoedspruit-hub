import { describe, expect, it } from "vitest";
import {
  QUICK_CARD_LOCATION_FONT_SIZE,
  QUICK_CARD_LOCATION_LINE_HEIGHT,
  QUICK_CARD_TITLE_FONT_SIZE,
  QUICK_CARD_TITLE_LINE_HEIGHT,
  categoryLineBudget,
  countTextLines,
} from "./quickCardLines";

describe("countTextLines", () => {
  it("reads a one-line title", () => {
    expect(
      countTextLines(19, QUICK_CARD_TITLE_FONT_SIZE, QUICK_CARD_TITLE_LINE_HEIGHT),
    ).toBe(1);
  });

  it("reads a two-line title", () => {
    expect(
      countTextLines(38, QUICK_CARD_TITLE_FONT_SIZE, QUICK_CARD_TITLE_LINE_HEIGHT),
    ).toBe(2);
  });

  it("reads a one-line location", () => {
    expect(
      countTextLines(16, QUICK_CARD_LOCATION_FONT_SIZE, QUICK_CARD_LOCATION_LINE_HEIGHT),
    ).toBe(1);
  });

  it("reads a two-line location", () => {
    expect(
      countTextLines(32, QUICK_CARD_LOCATION_FONT_SIZE, QUICK_CARD_LOCATION_LINE_HEIGHT),
    ).toBe(2);
  });

  it("treats text that is not there as one line", () => {
    expect(
      countTextLines(0, QUICK_CARD_LOCATION_FONT_SIZE, QUICK_CARD_LOCATION_LINE_HEIGHT),
    ).toBe(1);
    expect(
      countTextLines(NaN, QUICK_CARD_TITLE_FONT_SIZE, QUICK_CARD_TITLE_LINE_HEIGHT),
    ).toBe(1);
  });
});

describe("categoryLineBudget", () => {
  it("gives the category names a second line when title and location are both single", () => {
    expect(categoryLineBudget(1, 1)).toBe(2);
  });

  it("gives the names a second line when only the location has used two", () => {
    expect(categoryLineBudget(1, 2)).toBe(2);
  });

  it("gives the names a second line when only the title has used two", () => {
    expect(categoryLineBudget(2, 1)).toBe(2);
  });

  it("keeps the names on one line when both have used two", () => {
    expect(categoryLineBudget(2, 2)).toBe(1);
  });
});
