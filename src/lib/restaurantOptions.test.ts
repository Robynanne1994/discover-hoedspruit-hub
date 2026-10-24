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
  it("hides Breakfast as a cuisine option but keeps it as a meal", () => {
    expect(isRestaurantOptionAllowed("cuisine", "Breakfast")).toBe(false);
    expect(isRestaurantOptionAllowed("cuisine", " breakfast ")).toBe(false);
    expect(isRestaurantOptionAllowed("meal", "Breakfast")).toBe(true);
  });
  it("hides Bakery and Artisan Bakery as cuisine options", () => {
    expect(isRestaurantOptionAllowed("cuisine", "Bakery")).toBe(false);
    expect(isRestaurantOptionAllowed("cuisine", " ARTISAN BAKERY ")).toBe(false);
    expect(isRestaurantOptionAllowed("foods", "Bakery")).toBe(true);
    expect(isRestaurantOptionAllowed("meal", "Bakery")).toBe(false);
  });
describe("Retired cuisine values — dishes, labels and serving types", () => {
  it("hides Platters, Health Bowls and Seasonal as cuisine options", () => {
    expect(isRestaurantOptionAllowed("cuisine", "Platters")).toBe(false);
    expect(isRestaurantOptionAllowed("cuisine", " health bowls ")).toBe(false);
    expect(isRestaurantOptionAllowed("cuisine", "SEASONAL")).toBe(false);
  });
  it("retires Local as a cuisine and offers African instead", () => {
    expect(isRestaurantOptionAllowed("cuisine", "Local")).toBe(false);
    expect(isRestaurantOptionAllowed("cuisine", " local ")).toBe(false);
    expect(isRestaurantOptionAllowed("cuisine", "African")).toBe(true);
  });
  it("offers Portuguese and American as cuisine options", () => {
    expect(isRestaurantOptionAllowed("cuisine", "Portuguese")).toBe(true);
    expect(isRestaurantOptionAllowed("cuisine", " american ")).toBe(true);
  });
  it("still allows real cuisines and other fields", () => {
    expect(isRestaurantOptionAllowed("cuisine", "Italian")).toBe(true);
    expect(isRestaurantOptionAllowed("cuisine", "Baked Goods")).toBe(true);
    expect(isRestaurantOptionAllowed("meal", "Deli")).toBe(false); // retired as a meal
    expect(isRestaurantOptionAllowed("foods", "Snacks")).toBe(true);
    expect(isRestaurantOptionAllowed("foods", "South African")).toBe(true);
  });
});

describe("Retired foods values are hidden", () => {
  it("hides Light Meals and Local as foods options", () => {
    expect(isRestaurantOptionAllowed("foods", "Light Meals")).toBe(false);
    expect(isRestaurantOptionAllowed("foods", " local ")).toBe(false);
    expect(isRestaurantOptionAllowed("foods", "Local")).toBe(false);
    expect(isRestaurantOptionAllowed("foods", "Burgers")).toBe(true);
  });
  it("keeps Light Meals as a meal and Local as a cuisine", () => {
    expect(isRestaurantOptionAllowed("meal", "Light Meals")).toBe(true);
    expect(isRestaurantOptionAllowed("cuisine", "Local")).toBe(true);
  });
});
