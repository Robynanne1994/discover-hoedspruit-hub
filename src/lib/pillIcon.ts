/**
 * One icon size and one lift for every filter pill in the app.
 *
 * Both numbers come from rendered pixels, not guesswork: the size makes the
 * icon's drawn ink span the capital letters beside it, and the lift lands that
 * ink on the cap band instead of hanging below the text's baseline. They live
 * here so a pill on one page can never drift away from a pill on another.
 */
export const PILL_ICON_SIZE = 10.5;
export const PILL_ICON_NUDGE = "-1.4px";

/**
 * The active-filter count mark: a digit in a dark disc beside the word Filters.
 *
 * Measured the same way as the icons above. The digit's drawn ink is 7px tall
 * inside a 15px disc, while the line box it is centred in is taller than the
 * ink, so the number rides high. The lift lands the ink dead centre in the disc.
 */
export const PILL_BADGE_SIZE = 15;
export const PILL_BADGE_NUDGE = "1px";

