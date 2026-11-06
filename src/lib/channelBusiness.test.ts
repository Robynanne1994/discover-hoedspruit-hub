import { describe, expect, it } from "vitest";
import { channelBusinessToCsv, resolveChannelBusiness } from "./channelBusiness";

const listings = [{ id: "wildhire-id", title: "WildHire", title_override: "WILDHIRE" }];
describe("channel associated business", () => {
  it("maps an exact listing title to the same ID as editor selection", () => {
    expect(resolveChannelBusiness("WildHire", listings)).toBe("wildhire-id");
  });
  it("never links a partial or differently cased title", () => {
    expect(() => resolveChannelBusiness("Wild", listings)).toThrow();
    expect(() => resolveChannelBusiness("wildhire", listings)).toThrow();
  });
  it("rejects ambiguous duplicate titles", () => {
    expect(() => resolveChannelBusiness("WildHire", [...listings, { id: "other", title: "WildHire" }])).toThrow();
  });
  it("exports the exact listing title rather than its display override", () => {
    expect(channelBusinessToCsv("wildhire-id", listings)).toBe("WildHire");
  });
  it("allows an empty association", () => {
    expect(resolveChannelBusiness("", listings)).toBeNull();
    expect(channelBusinessToCsv(null, listings)).toBe("");
  });
});