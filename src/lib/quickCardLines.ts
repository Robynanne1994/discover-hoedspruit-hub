/**
 * The quick-filter rows on the Explore categories page are short cards: a square
 * homepage crop beside a listing's title, its category names and its location.
 * Only the category names may take a second line, and only while the card has
 * room for it. A title or a location that already runs to two lines has used up
 * some of that room, and the names are still given a second line unless both of
 * them have. Both are measured from the rendered text, so the rule follows the
 * real width of the card rather than a guess at character counts.
 */

// Text sizes the row is built with, kept here so the card and this rule cannot
// drift apart.
export const QUICK_CARD_TITLE_FONT_SIZE = 15;
export const QUICK_CARD_TITLE_LINE_HEIGHT = 1.25;
export const QUICK_CARD_LOCATION_FONT_SIZE = 12;
export const QUICK_CARD_LOCATION_LINE_HEIGHT = 1.3;

/**
 * How many lines a rendered block of text is taking. A block that has been
 * clamped reports the clamped height, which is the height the card actually pays
 * for, so that is the height that counts.
 */
export const countTextLines = (
  height: number,
  fontSize: number,
  lineHeight: number,
): number => {
  const single = fontSize * lineHeight;
  if (!Number.isFinite(height) || height <= 0) return 1;
  if (!Number.isFinite(single) || single <= 0) return 1;
  return Math.max(1, Math.round(height / single));
};

/**
 * The category names get a second line unless the title and the location have
 * both already used two. One of them on two lines still leaves room, and text
 * that is not there measures as a single line, so a listing with no location
 * still leaves the room too.
 */
export const categoryLineBudget = (titleLines: number, locationLines: number): number =>
  titleLines >= 2 && locationLines >= 2 ? 1 : 2;
