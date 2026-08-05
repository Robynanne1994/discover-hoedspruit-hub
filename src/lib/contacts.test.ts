import { describe, it, expect } from "vitest";
import { isUsableWebsite, websiteHref, websiteKind } from "./contacts";
import { sanitizeDashes } from "./sanitizeListing";

describe("isUsableWebsite", () => {
  it("accepts real websites, with or without a scheme", () => {
    expect(isUsableWebsite("https://www.hoedspruit.co.za")).toBe(true);
    expect(isUsableWebsite("http://example.com/menu")).toBe(true);
    expect(isUsableWebsite("example.co.za")).toBe(true);
    expect(isUsableWebsite("  www.example.com/bookings  ")).toBe(true);
  });

  it("rejects the placeholders a CSV uses for 'no website'", () => {
    expect(isUsableWebsite("-")).toBe(false);
    expect(isUsableWebsite("–")).toBe(false);
    expect(isUsableWebsite("N/A")).toBe(false);
    expect(isUsableWebsite("None")).toBe(false);
    expect(isUsableWebsite("")).toBe(false);
    expect(isUsableWebsite(null)).toBe(false);
  });

  it("rejects free text that would otherwise become a broken link", () => {
    expect(isUsableWebsite("coming soon")).toBe(false);
    expect(isUsableWebsite("ask us")).toBe(false);
    expect(isUsableWebsite("facebook")).toBe(false);
  });
});

describe("websiteKind", () => {
  it("recognises a social page saved in the website column", () => {
    expect(websiteKind("https://www.facebook.com/hellohoedspruit")).toBe("facebook");
    expect(websiteKind("fb.me/hellohoedspruit")).toBe("facebook");
    expect(websiteKind("https://instagram.com/hellohoedspruit")).toBe("instagram");
  });

  it("treats everything else as a plain website", () => {
    expect(websiteKind("https://www.example.co.za")).toBe("website");
    // A business whose own domain merely mentions the word.
    expect(websiteKind("https://notfacebook.co.za")).toBe("website");
  });
});

describe("websiteHref", () => {
  it("keeps an absolute URL as-is and makes a bare domain absolute", () => {
    expect(websiteHref("https://example.com")).toBe("https://example.com");
    expect(websiteHref("example.com/menu")).toBe("https://example.com/menu");
  });
});

describe("sanitizeDashes", () => {
  it("blanks placeholder strings without touching real values", () => {
    const row = sanitizeDashes({ website: "-", phone: "015 793 0000", email: "N/A" });
    expect(row.website).toBeNull();
    expect(row.email).toBeNull();
    expect(row.phone).toBe("015 793 0000");
  });

  it("drops placeholder entries from additional contact arrays", () => {
    const row = sanitizeDashes({ additional_websites: ["-", "https://example.com", "n/a"] });
    expect(row.additional_websites).toEqual(["https://example.com"]);
  });
});
