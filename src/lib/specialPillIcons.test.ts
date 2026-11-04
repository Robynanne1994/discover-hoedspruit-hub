import { describe, expect, it } from "vitest";
import type { ReactElement } from "react";
import {
  Bed,
  Car,
  Compass,
  Heart,
  HeartPulse,
  Leaf,
  Sparkles,
  Tag,
  UtensilsCrossed,
} from "lucide-react";
import { specialPillIcon } from "./specialPillIcons";

const mark = (tab: string) => specialPillIcon(tab) as ReactElement;

describe("special category pill marks", () => {
  it("marks Beauty with the sparkle mark", () => {
    expect(mark("Beauty").type).toBe(Sparkles);
  });

  it("marks Couples with the heart mark", () => {
    expect(mark("Couples").type).toBe(Heart);
  });

  it("marks Health with the heart-pulse mark", () => {
    expect(mark("Health").type).toBe(HeartPulse);
  });

  it("marks Game Drives with the safari vehicle mark", () => {
    expect(mark("Game Drives").type).toBe(Car);
  });

  it("marks Wellness with the leaf mark", () => {
    expect(mark("Wellness").type).toBe(Leaf);
  });

  it("marks Activities with the compass mark", () => {
    expect(mark("Activities").type).toBe(Compass);
  });

  it("keeps the food and stay marks", () => {
    expect(mark("Food & Drink").type).toBe(UtensilsCrossed);
    expect(mark("Accommodation").type).toBe(Bed);
  });

  it("falls back to the plain tag mark for a category none of the rules know", () => {
    expect(mark("Motoring").type).toBe(Tag);
  });
});
