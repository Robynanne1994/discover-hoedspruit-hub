import { describe, expect, it } from "vitest";
import { specialCard, specialImage } from "@/lib/specialCard";
import { getSpecialBadge, getSpecialBadgeExcluding, specialBadgeTone } from "@/lib/specialBadge";

// Every specials surface renders the same three slots off this model, so these
// tests are what stops the homepage rail and the specials list drifting apart.
describe("specialCard", () => {
  it("keeps the badge off a claim the value bar already makes", () => {
    const card = specialCard({ discount_type: "percent_off", discount_value: 20 });
    expect(card.value).toEqual({ kind: "deal", text: "20% Off" });
    expect(card.badge.text).toBe("Special");
  });

  it("does the same for an amount-off deal", () => {
    const card = specialCard({ discount_type: "amount_off", discount_value: 50 });
    expect(card.value).toEqual({ kind: "deal", text: "Save R50" });
    expect(card.badge.text).toBe("Special");
  });

  it("keeps a badge that says something the value bar does not", () => {
    const card = specialCard({ day_of_week: "Tuesday", discount_type: "percent_off", discount_value: 20 });
    expect(card.badge.text).toBe("Tuesday Special");
    expect(card.value).toEqual({ kind: "deal", text: "20% Off" });
  });

  it("shortens the badge for a special that runs on two days", () => {
    // "Wednesday & Thursday Special" would outgrow the pill it sits in.
    expect(specialCard({ day_of_week: ["Wednesday", "Thursday"] }).badge.text).toBe("Wed & Thu Special");
  });

  it("steps the badge back when it would repeat the savings accent", () => {
    const card = specialCard({
      price: "R70",
      original_price: "R95",
      discount_type: "amount_off",
      discount_value: 25,
    });
    expect(card.saving).toBe("Save R25");
    expect(card.badge.text).toBe("Special");
  });

  it("always produces a badge so no card in a grid loses its pill", () => {
    expect(specialCard({}).badge.text).toBe("Special");
  });

  it("reads discount wording as the loud tone and everything else as quiet", () => {
    expect(specialCard({ badge_override: "30% Off" }).badge.tone).toBe("discount");
    expect(specialCard({ badge_override: "Buy 2 Get 1 Free" }).badge.tone).toBe("discount");
    expect(specialCard({ day_of_week: "Tuesday" }).badge.tone).toBe("neutral");
    expect(specialCard({ badge_override: "Winter Package" }).badge.tone).toBe("neutral");
  });

  it("carries the money and the time line together", () => {
    const card = specialCard({ price: "R85", price_label: "per plate", card_footer_text: "Every Sunday" });
    expect(card.value).toMatchObject({ kind: "price", price: "R85", note: "per plate" });
    expect(card.meta).toEqual({ text: "Every Sunday", urgent: false });
  });
});

describe("specialImage", () => {
  const row = {
    image_url: "list.jpg",
    homepage_image_url: "home.jpg",
    detail_image_url: "detail.jpg",
    saved_image_url: "saved.jpg",
  };

  it("prefers the crop made for the surface", () => {
    expect(specialImage(row, "home")).toBe("home.jpg");
    expect(specialImage(row, "list")).toBe("list.jpg");
    expect(specialImage(row, "saved")).toBe("saved.jpg");
    expect(specialImage(row, "detail")).toBe("detail.jpg");
  });

  it("falls back through the other images rather than showing nothing", () => {
    expect(specialImage({ detail_image_url: "detail.jpg" }, "home")).toBe("detail.jpg");
    expect(specialImage({ homepage_image_url: "home.jpg" }, "list")).toBe("home.jpg");
    expect(specialImage({ saved_image_url: "  " }, "saved")).toBeNull();
  });

  it("has no image to offer when every column is empty", () => {
    expect(specialImage({}, "list")).toBeNull();
  });
});

describe("getSpecialBadgeExcluding", () => {
  it("matches getSpecialBadge when there is nothing to avoid", () => {
    const s = { day_of_week: "Friday" };
    expect(getSpecialBadgeExcluding(s, null)).toBe(getSpecialBadge(s));
  });

  it("ignores casing and punctuation when comparing", () => {
    expect(getSpecialBadgeExcluding({ badge_override: "20% Off" }, "20% off")).toBe("Special");
  });

  it("keeps the generic label rather than returning nothing", () => {
    expect(getSpecialBadgeExcluding({}, "Special")).toBe("Special");
  });
});

describe("specialBadgeTone", () => {
  it("treats an empty label as quiet", () => {
    expect(specialBadgeTone(null)).toBe("neutral");
  });
});
