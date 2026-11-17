import { describe, it, expect } from "vitest";
import { splitNotificationTags } from "./notificationTags";
describe("splitNotificationTags", () => {
  it("splits pipe-separated cells into separate tags", () => {
    expect(splitNotificationTags(["Kids & Family|Community|Food & Drink", "Community", null]))
      .toEqual(["Community", "Food & Drink", "Kids & Family"]);
  });
});
