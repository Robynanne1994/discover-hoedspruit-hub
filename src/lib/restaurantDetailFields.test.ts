import { describe, expect, it } from "vitest";
import { restaurantDetailFields } from "./restaurantDetailFields";

describe("restaurant detail field placement", () => {
  it("always includes all three summary values, even when blank", () => {
    expect(restaurantDetailFields({}).summary.map(f => f.on)).toEqual([false, false, false]);
    expect(restaurantDetailFields({ good_for_kids: true, pets_allowed: false, wheelchair_friendly: true }).summary.map(f => f.on)).toEqual([true, false, true]);
  });

  it("uses wheelchair_friendly for the summary independently of other accessibility values", () => {
    const fields = restaurantDetailFields({ wheelchair_friendly: false, wheelchair_entrance: true, wheelchair_car_park: false, wheelchair_seating: true, wheelchair_toilet: false });
    expect(fields.summary[2].on).toBe(false);
    expect(fields.accessibility.map(f => f.on)).toEqual([true, true, false, false]);
  });

  it("keeps only the four babies and kids facilities in their own group", () => {
    const fields = restaurantDetailFields({ good_for_kids: true, kids_playground: false, kids_menu: true, high_chairs: false, nappy_changing_station: true });
    expect(fields.kids.map(f => f.on)).toEqual([false, true, false, true]);
    expect(restaurantDetailFields({ good_for_kids: true }).kids).toEqual([]);
  });

  it("places drive-through only in services and pets only in summary", () => {
    const fields = restaurantDetailFields({ pets_allowed: true, drive_through: false, has_toilet: true, has_wifi: false, smoking_allowed: true });
    expect(fields.service.map(f => f.on)).toEqual([false]);
    expect(fields.amenities.map(f => f.on)).toEqual([true, false, true]);
    expect(restaurantDetailFields({ pets_allowed: true, drive_through: true }).amenities).toEqual([]);
  });

  it("preserves omission of blank fields outside summary", () => {
    const fields = restaurantDetailFields({});
    expect([fields.kids, fields.accessibility, fields.amenities, fields.service]).toEqual([[], [], [], []]);
  });
});