// Desserts belongs to Meal, not Cuisine or Foods.
export const MEAL_OPTIONS = ["Breakfast", "Lunch", "Dinner", "Brunch", "Pub Grub", "Snacks", "Light Meals", "Desserts"];

export function isRestaurantOptionAllowed(field: string, value: string): boolean {
  return !(["cuisine", "foods"].includes(field) && value.trim().toLowerCase() === "desserts");
}