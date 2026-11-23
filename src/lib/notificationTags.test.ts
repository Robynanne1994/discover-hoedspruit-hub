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

  it("merges business and networking tags into Business & Networking", () => {
    expect(splitEventNotificationTags(["Business", "Networking", "Business Networking", "Art"]))
      .toEqual(["Art", "Business & Networking"]);
  });

  it("merges party and festival tags into Parties & Festivals", () => {
    expect(splitEventNotificationTags(["Party", "Festival", "Parties", "Festivals", "Art"]))
      .toEqual(["Art", "Parties & Festivals"]);
  });

  it("merges conservation and tourism tags into Conservation & Tourism", () => {
    expect(splitEventNotificationTags(["Conservation", "Tourism", "Conservation Tourism", "Art"]))
      .toEqual(["Art", "Conservation & Tourism"]);
  });

  it("merges wildlife and nature tags into Wildlife & Nature", () => {
    expect(splitEventNotificationTags(["Wildlife", "Nature", "Wildlife Nature", "Art"]))
      .toEqual(["Art", "Wildlife & Nature"]);
  });

  it("removes Theatre without removing other event interests", () => {
    expect(splitEventNotificationTags(["Theatre", "Art"])).toEqual(["Art"]);
  });
});
