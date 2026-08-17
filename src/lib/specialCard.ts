import {
  getSpecialBadgeExcluding,
  specialBadgeTone,
  type BadgeTone,
  type SpecialBadgeLike,
} from "./specialBadge";
import {
  savingLabel,
  specialMeta,
  specialValue,
  type SpecialLike,
  type SpecialValue,
} from "./specialValue";
import { specialSurfaceImage } from "./imageFallback";
import type { SpecialImageSlotKey } from "./specialImageSlots";

// Specials are heterogeneous — a fixed price, a percentage, a freebie, a weekly
// night, a seasonal package — but every card that shows one has the same three
// slots: a badge, a value, and a time line. This module decides what goes in
// each slot, once, so the homepage rail, the specials list and the saved grid
// can never disagree about a given special.

export interface SpecialCardLike extends SpecialLike, SpecialBadgeLike {
  image_url?: string | null;
  detail_image_url?: string | null;
  homepage_image_url?: string | null;
  saved_image_url?: string | null;
  featured_image_url?: string | null;
  search_image_url?: string | null;
}

export type SpecialSurface = "home" | "list" | "saved" | "detail" | "featured" | "search";

const SURFACE_SLOT: Record<SpecialSurface, SpecialImageSlotKey> = {
  home: "homepage",
  list: "card",
  saved: "saved",
  detail: "detail",
  featured: "featured",
  search: "search",
};

// Each surface has a preferred crop and the same fallback chain behind it — see
// imageFallback.ts — so a special missing its surface-specific art still shows
// a picture everywhere rather than a blank panel.
export const specialImage = (s: SpecialCardLike, surface: SpecialSurface): string | null =>
  specialSurfaceImage(s as Record<string, unknown>, SURFACE_SLOT[surface]);

export interface SpecialCardModel {
  /** Pill that sits on the image. Always present — every card wears one. */
  badge: { text: string; tone: BadgeTone };
  /** Left of the value bar: a price, a written offer, or nothing. */
  value: SpecialValue;
  /** Right of the value bar: urgency, the business's wording, or the schedule. */
  meta: { text: string; urgent: boolean };
  /** Accent beside a price ("Save R25"). Null unless there is a price. */
  saving: string | null;
}

export interface SpecialCardOptions {
  /** True for the narrow cards — the 2-col specials grid and the homepage rail. */
  compact?: boolean;
  /**
   * False only for the detail page, which shows the full offer wording. On a
   * card the special's shorter `card_deal_text` is used when it has one.
   */
  card?: boolean;
}

export const specialCard = (
  s: SpecialCardLike,
  { compact = false, card = true }: SpecialCardOptions = {}
): SpecialCardModel => {
  const value = specialValue(s, { card });
  const saving = value.kind === "price" ? savingLabel(s) : null;

  // The badge and the value bar are fed by the same columns, so a 20%-off deal
  // with no price would otherwise print "20% OFF" twice on one card. The value
  // bar owns the money; the badge steps back to its next-best label.
  const spokenByValue = value.kind === "deal" ? value.text : saving;
  const badgeText = getSpecialBadgeExcluding(s, spokenByValue);

  return {
    badge: { text: badgeText, tone: specialBadgeTone(badgeText) },
    value,
    // The schedule only has to squeeze when it shares a line with the money.
    // With nothing in the value slot it gets the whole strip, so the business's
    // own wording fits as written.
    meta: specialMeta(s, { compact: compact && value.kind !== "none" }),
    saving,
  };
};
