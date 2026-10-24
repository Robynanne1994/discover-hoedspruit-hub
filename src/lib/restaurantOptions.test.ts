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

describe("Retired cuisine values are hidden", () => {
  it("blocks Robyn's ten retired values as cuisine options", () => {
    const retired = [
      "Light Meals",
      "Fried Chicken",
      "Sourdough",
      "Artisan Baked Goods",
      "Waffles",
      "Deli",
      "Smoked Meats",
      "Farm-to-Fork",
      "Farm to Fork",
      "Snacks",
      "Health Food",
    ];
    for (const value of retired) {
      expect(isRestaurantOptionAllowed("cuisine", ` ${value} `)).toBe(false);
    }
  });
  it("hides South African as a cuisine option", () => {
    expect(isRestaurantOptionAllowed("cuisine", "South African")).toBe(false);
    expect(isRestaurantOptionAllowed("cuisine", " south african ")).toBe(false);
  });
  it("still allows real cuisines and other fields", () => {
    expect(isRestaurantOptionAllowed("cuisine", "Italian")).toBe(true);
    expect(isRestaurantOptionAllowed("cuisine", "Baked Goods")).toBe(true);
    expect(isRestaurantOptionAllowed("meal", "Deli")).toBe(false); // retired as a meal
    expect(isRestaurantOptionAllowed("foods", "Snacks")).toBe(true);
    expect(isRestaurantOptionAllowed("foods", "South African")).toBe(true);
  });
});
