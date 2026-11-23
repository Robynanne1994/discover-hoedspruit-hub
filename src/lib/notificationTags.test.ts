import { describe, it, expect } from "vitest";
import { splitEventNotificationTags, splitNotificationTags } from "./notificationTags";

describe("splitNotificationTags", () => {
  it("splits pipe-separated cells into separate tags", () => {
    expect(splitNotificationTags(["Kids & Family|Community|Food & Drink", "Community", null]))
      .toEqual(["Community", "Food & Drink", "Kids & Family"]);
  });
});

describe("splitEventNotificationTags", () => {
  it("removes the thirteen activity-specific options but keeps their broader interests", () => {
    expect(splitEventNotificationTags([
      "Yoga|Running|Cycling|Golf|Hiking|Trail Running|Wine",
      "Fashion|Competition|Books|Outdoor|Safety",
      "Sports & Fitness",
      "Food & Drink",
      "Wine Tasting",
    ])).toEqual(["Food & Drink", "Sports & Fitness", "Wine Tasting"]);
  });

  it("merges every dance or music tag into Dance & Music", () => {
    expect(splitEventNotificationTags(["Dance", "Music", "Live Music", "Live Music Festival", "Art"]))
      .toEqual(["Art", "Dance & Music"]);
  });

  it("merges every health or wellness tag into Health & Wellness", () => {
    expect(splitEventNotificationTags(["Health", "Wellness", "Wellness Retreat", "Health & Wellness", "Art"]))
      .toEqual(["Art", "Health & Wellness"]);
  });
});
