// Shared field definitions for category-aware listing management

export const UNIVERSAL_FIELDS = [
  "title", "description", "image_url", "location", "phone", "email", "website",
  "whatsapp", "google_maps_link", "google_rating", "google_reviews_count",
  "google_reviews_url", "categories", "subcategories", "is_featured",
  "long_description", "gallery_images", "opening_hours"
] as const;

export const RESTAURANT_ONLY_FIELDS = [
  "good_for_kids", "pets_allowed", "wheelchair_friendly", "price_level",
  "show_attributes", "meal", "vibe", "cuisine", "seating",
  "kids_playground", "smoking_allowed", "service_type",
  "kids_menu", "high_chairs", "wheelchair_car_park", "wheelchair_entrance",
  "wheelchair_seating", "wheelchair_toilet", "has_toilet", "has_wifi", "has_free_wifi"
] as const;

export const RESTAURANT_CATEGORY_PATTERN = /restaurant|caf[eé]/i;

export function isRestaurantCategory(categoryTitle: string): boolean {
  return RESTAURANT_CATEGORY_PATTERN.test(categoryTitle);
}

export function getCSVHeadersForCategory(categoryTitle: string | null): string[] {
  const headers: string[] = [...UNIVERSAL_FIELDS];
  if (categoryTitle && isRestaurantCategory(categoryTitle)) {
    headers.push(...RESTAURANT_ONLY_FIELDS);
  }
  return headers;
}
