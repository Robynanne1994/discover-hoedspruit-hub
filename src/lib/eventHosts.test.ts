import { describe, it, expect } from "vitest";
import { buildHostDirectory, resolveHost } from "./eventHosts";

const dir = buildHostDirectory([{ name: "Hoedspruit Running Club", image_url: "img.jpg", link: "https://run.co" }]);

describe("resolveHost", () => {
  it("fills image and link from a matching host name, ignoring case and spaces", () => {
    const h = resolveHost({ name: "  hoedspruit  running club " }, dir);
    expect(h.image).toBe("img.jpg");
    expect(h.link).toBe("https://run.co");
  });
  it("keeps the event's own image and link", () => {
    const h = resolveHost({ name: "Hoedspruit Running Club", image: "own.jpg", link: "https://own" }, dir);
    expect(h.image).toBe("own.jpg");
    expect(h.link).toBe("https://own");
  });
  it("leaves listing-linked hosts alone", () => {
    const h = resolveHost({ name: "Hoedspruit Running Club", listingId: "x" }, dir);
    expect(h.image).toBeUndefined();
  });
  it("leaves unmatched names alone", () => {
    expect(resolveHost({ name: "Other" }, dir).image).toBeUndefined();
  });
});

describe("resolveHost subtitle", () => {
  const dirWithSub = buildHostDirectory([{ name: "Hoedspruit Running Club", subtitle: "Weekly social runs" }]);
  it("fills the subtitle from a matching host name", () => {
    expect(resolveHost({ name: "hoedspruit running club" }, dirWithSub).subtitle).toBe("Weekly social runs");
  });
  it("keeps the event's own subtitle", () => {
    expect(resolveHost({ name: "Hoedspruit Running Club", subtitle: "Trail series" }, dirWithSub).subtitle).toBe("Trail series");
  });
});
