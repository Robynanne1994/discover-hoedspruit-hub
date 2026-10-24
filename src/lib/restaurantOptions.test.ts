import { describe, expect, it } from "vitest";
import { MEAL_OPTIONS, isRestaurantOptionAllowed } from "./restaurantOptions";

describe("Desserts meal classification", () => {
  it("offers Desserts as a meal", () => {
    expect(MEAL_OPTIONS).toContain("Desserts");
    expect(isRestaurantOptionAllowed("meal", "Desserts")).toBe(true);
  });
  it("never offers Desserts under Cuisine", () => {
    expect(isRestaurantOptionAllowed("cuisine", " DESSERTS ")).toBe(false);
    expect(isRestaurantOptionAllowed("cuisine", "Italian")).toBe(true);
  });
  it("never offers Desserts under Foods", () => {
    expect(isRestaurantOptionAllowed("foods", "desserts")).toBe(false);
    expect(isRestaurantOptionAllowed("foods", "Pasta")).toBe(true);
  });
});

describe("Meal options are the fixed six", () => {
  it("lists exactly Breakfast, Brunch, Lunch, Dinner, Light Meals, Desserts", () => {
    expect(MEAL_OPTIONS).toEqual(["Breakfast", "Brunch", "Lunch", "Dinner", "Light Meals", "Desserts"]);
  });
  it("retires Pub Grub and Snacks everywhere", () => {
    expect(isRestaurantOptionAllowed("meal", "Pub Grub")).toBe(false);
    expect(isRestaurantOptionAllowed("meal", "snacks")).toBe(false);
    expect(isRestaurantOptionAllowed("meal", "Lunch")).toBe(true);
  });
});