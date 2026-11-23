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
      "Yoga|Running|Cycling|Golf|Hiking|Trail Running|Wine|Live Music",
      "Fashion|Competition|Books|Outdoor|Safety",
      "Sports & Fitness",
      "Food & Drink",
      "Wine Tasting",
      "Live Music Festival",
    ])).toEqual(["Food & Drink", "Live Music Festival", "Sports & Fitness", "Wine Tasting"]);
  });
});
