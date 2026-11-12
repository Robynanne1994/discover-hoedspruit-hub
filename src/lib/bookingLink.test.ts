import { describe, expect, it } from "vitest";
import { editorBookingLinkType } from "./bookingLink";

describe("editorBookingLinkType", () => {
  it("leaves the booking type blank when neither a link nor a type is set", () => {
    expect(editorBookingLinkType("", null)).toBe("");
    expect(editorBookingLinkType("   ", "  ")).toBe("");
  });

  it("keeps an explicitly selected type visible before a link is entered", () => {
    expect(editorBookingLinkType("", "email")).toBe("email");
  });

  it("detects the type when an existing booking value has no stored type", () => {
    expect(editorBookingLinkType("name@example.com", null)).toBe("email");
    expect(editorBookingLinkType("https://example.com/book", null)).toBe("link");
  });
});
