import { describe, expect, it } from "vitest";
import { countEventPrices, eventMatchesPrice, isFreeEvent } from "@/lib/eventPrice";

describe("free events", () => {
  // Robyn's rule: an empty price field means there is nothing to pay.
  it("treats a missing price as free", () => {
    expect(isFreeEvent({ price: null })).toBe(true);
    expect(isFreeEvent({ price: "" })).toBe(true);
    expect(isFreeEvent({ price: "   " })).toBe(true);
    expect(isFreeEvent({})).toBe(true);
  });

  it("treats free wordings as free", () => {
    for (const price of ["Free", "free", "FREE ENTRY", "0", "R0", "r 0", "0.00", "No Charge", "Complimentary"]) {
      expect(isFreeEvent({ price })).toBe(true);
    }
  });

  it("treats a populated price as paid", () => {
    for (const price of ["R200", "From R90", "150", "Enquire Pricing Through Host"]) {
      expect(isFreeEvent({ price })).toBe(false);
    }
  });

  it("filters a list by price without leaking events between options", () => {
    const events = [{ price: null }, { price: "Free" }, { price: "R200" }];
    expect(events.filter((e) => eventMatchesPrice(e, "free"))).toHaveLength(2);
    expect(events.filter((e) => eventMatchesPrice(e, "paid"))).toHaveLength(1);
    expect(events.filter((e) => eventMatchesPrice(e, "any"))).toHaveLength(3);
  });

  it("counts free and paid so they add up to all", () => {
    const counts = countEventPrices([
      { price: null },
      { price: "Free entry" },
      { price: "R200" },
      { price: "From R90" },
    ]);
    expect(counts).toEqual({ any: 4, free: 2, paid: 2 });
  });
});
