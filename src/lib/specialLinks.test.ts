import { describe, expect, it } from "vitest";
import { labelledWebLinks, parseBookings, serializeBookings, parseDoneCell } from "./specialLinks";
import { specialCsvAction, specialCsvScope } from "./specialCsvScope";
import { isActiveSpecial, isVisibleSpecial } from "./specialVisibility";

describe("special links", () => {
  it("shows each pipe-separated link only with its label", () => {
    const out = labelledWebLinks("https://a.co/promo|https://b.co/x", "Shop Sale|-");
    expect(out).toEqual([{ href: "https://a.co/promo", label: "Shop Sale", platform: "other" }]);
  });
  it("keeps multiple socials in order", () => {
    const out = labelledWebLinks("https://facebook.com/p|https://instagram.com/q", "FB Post|Insta Post");
    expect(out.map((l) => l.platform)).toEqual(["facebook", "instagram"]);
  });
});

describe("special bookings", () => {
  it("pairs links, types and labels by position", () => {
    const b = parseBookings("link|email", "https://x.co|a@b.co", "Book Online|Email Us");
    expect(b[1]).toEqual({ type: "email", link: "a@b.co", label: "Email Us" });
  });
  it("round-trips with '-' for blank slots", () => {
    const s = serializeBookings([{ type: "link", link: "https://x.co", label: "" }, { type: "", link: "a@b.co", label: "Mail" }]);
    expect(s).toEqual({ link: "https://x.co|a@b.co", type: "link|-", label: "-|Mail" });
  });
});

describe("done ongoing specials", () => {
  const now = new Date("2026-11-06T08:00:00Z");
  it("reads TRUE as done", () => {
    expect(parseDoneCell("TRUE")).toBe(true);
    expect(parseDoneCell("FALSE")).toBe(false);
  });
  it("moves a done special to Past and hides it", () => {
    expect(specialCsvScope({ is_active: true, is_done: true }, now)).toBe("passed");
    expect(isActiveSpecial({ is_active: true, is_done: true })).toBe(false);
    expect(isVisibleSpecial({ is_active: true, is_done: true })).toBe(false);
  });
  it("lets the Active sheet mark an active special done", () => {
    expect(specialCsvAction("active", { is_active: true, is_done: true }, { is_active: true }, now)).toBe("update");
    expect(specialCsvAction("active", { is_active: true, is_done: true }, undefined, now)).toBe("skip");
  });
});
