import { describe, expect, it } from "vitest";
import { savingLabel, specialDateLine, specialMeta, specialValue } from "@/lib/specialValue";

// Deals are entered by hand, so the value bar has to cope with a price, a
// free-text offer, or nothing at all.
describe("specialValue", () => {
  it("uses the price when one is set", () => {
    expect(specialValue({ price: "R85", price_label: "per plate" })).toEqual({
      kind: "price",
      price: "R85",
      original: null,
      note: "per plate",
    });
  });

  it("keeps the original price for the strikethrough", () => {
    expect(specialValue({ price: "R70", original_price: "R95" })).toMatchObject({
      kind: "price",
      price: "R70",
      original: "R95",
    });
  });

  it("drops an original price identical to the price", () => {
    expect(specialValue({ price: "R70", original_price: "R70" })).toMatchObject({ original: null });
  });

  it("falls back to the savings wording when there is no price", () => {
    expect(specialValue({ savings: "Buy 1, get 1 free" })).toEqual({
      kind: "deal",
      text: "Buy 1, get 1 free",
    });
  });

  it("still shows a lone original price rather than nothing", () => {
    expect(specialValue({ original_price: "R120" })).toEqual({ kind: "deal", text: "R120" });
  });

  it("prefers a written offer over a stray original price", () => {
    expect(specialValue({ freebie_text: "Free breakfast", original_price: "R450" })).toEqual({
      kind: "deal",
      text: "Free breakfast",
    });
  });

  it("reports nothing to show when every money field is empty", () => {
    expect(specialValue({ price: "  ", savings: null })).toEqual({ kind: "none" });
  });
});

describe("savingLabel", () => {
  it("shows the business's own wording verbatim", () => {
    expect(savingLabel({ price: "R70", original_price: "R95", savings: "50% Off" })).toBe("50% Off");
  });

  it("derives the saving from the two prices", () => {
    expect(savingLabel({ price: "R70", original_price: "R95" })).toBe("Save R25");
  });

  it("keeps the derived saving currency-free when the source was", () => {
    expect(savingLabel({ price: "70", original_price: "95" })).toBe("Save 25");
  });

  it("stays quiet when the original is not actually higher", () => {
    expect(savingLabel({ price: "R95", original_price: "R70" })).toBeNull();
    expect(savingLabel({ price: "R95" })).toBeNull();
  });
});

describe("specialDateLine", () => {
  it("names the day a weekly special runs on", () => {
    expect(specialDateLine({ day_of_week: ["Tuesday"] })).toBe("Every Tuesday");
  });

  it("abbreviates once a special runs on more than one day", () => {
    expect(specialDateLine({ day_of_week: ["Wednesday", "Thursday"] })).toBe("Every Wed & Thu");
  });

  it("keeps the end date alongside the days", () => {
    expect(specialDateLine({ day_of_week: ["Wednesday", "Thursday"], valid_until: "2026-08-12" }))
      .toBe("Wed & Thu until 12 Aug");
    expect(specialDateLine({ day_of_week: ["Tuesday"], valid_until: "2026-08-12" }))
      .toBe("Tuesdays until 12 Aug");
  });

  it("still reads a row that holds a single day name", () => {
    expect(specialDateLine({ day_of_week: "Friday" })).toBe("Every Friday");
  });

  it("falls back to the dates when there is no weekly schedule", () => {
    expect(specialDateLine({ valid_from: "2026-08-01", valid_until: "2026-08-12" })).toBe("1 to 12 Aug");
    expect(specialDateLine({})).toBeNull();
  });
});

describe("specialMeta", () => {
  const inDays = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };

  it("lets urgency override the business's own footer wording", () => {
    expect(specialMeta({ card_footer_text: "Every Sunday", valid_until: inDays(2) })).toEqual({
      text: "2 days left",
      urgent: true,
    });
  });

  it("uses the footer wording when the deal is not ending soon", () => {
    expect(specialMeta({ card_footer_text: "Every Sunday", valid_until: inDays(40) })).toEqual({
      text: "Every Sunday",
      urgent: false,
    });
  });

  it("says nothing when there is no footer wording and no dates", () => {
    expect(specialMeta({ valid_until: null })).toEqual({ text: "", urgent: false });
  });
});
