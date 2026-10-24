// Meal is fixed to Robyn's six options; Pub Grub and Snacks are retired.
// Desserts belongs to Meal, not Cuisine or Foods.
// These cuisine values are retired as well — they are meals, drinks or
// product types, not cuisines — and are hidden from the editor chips, the
// front-end filters and CSV imports.
export const MEAL_OPTIONS = ["Breakfast", "Brunch", "Lunch", "Dinner", "Light Meals", "Desserts"];

// Retired cuisine values, matched case- and whitespace-insensitively.
// "Farm to Fork" appears in stored data both hyphenated and spaced.
export const RETIRED_CUISINE = new Set(
  [
    "light meals",
    "fried chicken",
    "sourdough",
    "artisan baked goods",
    "waffles",
    "deli",
    "smoked meats",
    "farm-to-fork",
    "farm to fork",
    "snacks",
    "health food",
    // "South African" is retired as a cuisine option at Robyn's request.
    "south african",
    // "Breakfast" is a meal, not a cuisine — it stays available under Meal.
    "breakfast",
  ].map((v) => v.toLowerCase()),
);

// Retired foods values, matched case- and whitespace-insensitively.
// "Light Meals" is a meal and "Local" is a sourcing/origin descriptor, so
// neither is offered as a food.
export const RETIRED_FOODS = new Set(
  [
    "light meals",
    "light meal",
    "local",
  ].map((v) => v.toLowerCase()),
);

export function isRestaurantOptionAllowed(field: string, value: string): boolean {
  const v = value.trim().toLowerCase();
  if (field === "cuisine" && RETIRED_CUISINE.has(v)) return false;
  if (field === "foods" && RETIRED_FOODS.has(v)) return false;
  if (["cuisine", "foods"].includes(field) && v === "desserts") return false;
  // Meal only ever offers the six fixed options — anything else stored on a
  // listing (e.g. old Pub Grub / Snacks values) is hidden from the editor
  // chips and the front-end filters.
  if (field === "meal") {
    return MEAL_OPTIONS.some((m) => m.toLowerCase() === v);
  }
  return true;
}
