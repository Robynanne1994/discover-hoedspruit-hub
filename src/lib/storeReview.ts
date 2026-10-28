/**
 * Where each platform's rating screen lives.
 *
 * Apple's write-review link opens straight into the App Store review sheet, so
 * it can be handed to the OS as a plain link. The Google Play rating URL has not
 * been issued yet, so Android is declared as `null` rather than guessed at: the
 * dialog still offers the choice, and the caller decides what to say when a
 * link is missing.
 */

/** App Store review sheet for the Hello Hoedspruit app. */
export const APPLE_REVIEW_URL =
  "https://apps.apple.com/app/id6786310963?action=write-review";

/** Set this to the Google Play page once it is available. */
export const ANDROID_REVIEW_URL: string | null = null;

export type StorePlatform = "apple" | "android";

/** The rating URL for a platform, or `null` while one has not been added. */
export const storeReviewUrl = (platform: StorePlatform): string | null =>
  platform === "apple" ? APPLE_REVIEW_URL : ANDROID_REVIEW_URL;

/**
 * Opens a store's rating screen in a new tab and reports whether a link exists.
 * Returns false when that platform's URL has not been added yet, so the caller
 * can tell the person instead of silently doing nothing.
 */
export const openStoreReview = (platform: StorePlatform): boolean => {
  const url = storeReviewUrl(platform);
  if (!url) return false;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
};
