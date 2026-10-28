import { describe, expect, it } from "vitest";
import { APP_DOWNLOAD_URL } from "./appLinks";

describe("APP_DOWNLOAD_URL", () => {
  it("is the marketing download page shared from Share the App", () => {
    expect(APP_DOWNLOAD_URL).toBe("https://hellohoedspruit.co/download");
  });
});
