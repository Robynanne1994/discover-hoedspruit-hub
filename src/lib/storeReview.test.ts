import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ANDROID_REVIEW_URL,
  APPLE_REVIEW_URL,
  openStoreReview,
  storeReviewUrl,
} from "./storeReview";

describe("store review links", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens the App Store write-review sheet for Apple", () => {
    expect(APPLE_REVIEW_URL).toBe(
      "https://apps.apple.com/app/id6786310963?action=write-review",
    );

    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    expect(openStoreReview("apple")).toBe(true);
    expect(open).toHaveBeenCalledWith(
      "https://apps.apple.com/app/id6786310963?action=write-review",
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("keeps Android inert until the Google Play link is added", () => {
    expect(ANDROID_REVIEW_URL).toBeNull();
    expect(storeReviewUrl("android")).toBeNull();

    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    expect(openStoreReview("android")).toBe(false);
    expect(open).not.toHaveBeenCalled();
  });
});
