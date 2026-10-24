// Meal is fixed to Robyn's six options; Pub Grub and Snacks are retired.
// Desserts belongs to Meal, not Cuisine or Foods.
export const MEAL_OPTIONS = ["Breakfast", "Brunch", "Lunch", "Dinner", "Light Meals", "Desserts"];

export function isRestaurantOptionAllowed(field: string, value: string): boolean {
  const v = value.trim().toLowerCase();
  if (["cuisine", "foods"].includes(field) && v === "desserts") return false;
  // Meal only ever offers the six fixed options — anything else stored on a
  // listing (e.g. old Pub Grub / Snacks values) is hidden from the editor
  // chips and the front-end filters.
  if (field === "meal") {
    return MEAL_OPTIONS.some((m) => m.toLowerCase() === v);
  }
  return true;
}
