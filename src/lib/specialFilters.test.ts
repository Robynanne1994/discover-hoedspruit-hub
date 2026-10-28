import { describe, expect, it } from "vitest";
import { countSpecialFilters, specialMatchesBooking, specialMatchesType, specialRequiresBooking } from "./specialFilters";

describe("specials filters", () => {
  it("treats missing, empty and whitespace booking links as not required", () => {
    for (const booking_link of [undefined, null, "", "   "]) {
      expect(specialRequiresBooking({ booking_link })).toBe(false);
      expect(specialMatchesBooking({ booking_link }, "not-required")).toBe(true);
      expect(specialMatchesBooking({ booking_link }, "required")).toBe(false);
    }
  });

  it("counts populated links as booking required and Any as every special", () => {
    const specials = [{ booking_link: "https://example.com" }, { booking_link: "tel:123" }, { booking_link: null }];
    expect(countSpecialFilters(specials).booking).toEqual({ any: 3, required: 2, "not-required": 1 });
    expect(specialMatchesBooking(specials[0], "required")).toBe(true);
    expect(specialMatchesBooking(specials[2], "any")).toBe(true);
  });

  it.each(["buy_x_get_y", "percent_off", "freebie", "fixed_price"] as const)("matches and counts %s by stored special type", (discount_type) => {
    const specials = [{ discount_type }, { discount_type: "amount_off" }, { discount_type: null }];
    expect(specialMatchesType(specials[0], discount_type)).toBe(true);
    expect(specialMatchesType(specials[1], discount_type)).toBe(false);
    expect(countSpecialFilters(specials).type[discount_type]).toBe(1);
    expect(countSpecialFilters(specials).type.any).toBe(3);
  });
});