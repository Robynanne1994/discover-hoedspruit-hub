// Shared field definitions for category-aware listing management

export const UNIVERSAL_FIELDS = [
  "title", "description", "image_url", "location", "phone", "email", "website", "website_label",
  "whatsapp", "google_maps_link", "google_rating", "google_reviews_count",
  "google_reviews_url", "categories", "subcategories", "is_featured",
  "long_description", "gallery_images", "opening_hours",
  "custom_title_1", "custom_text_1",
  "custom_title_2", "custom_text_2",
  "custom_title_3", "custom_text_3"
] as const;

export const RESTAURANT_ONLY_FIELDS = [
  "good_for_kids", "pets_allowed", "wheelchair_friendly", "price_level",
  "show_attributes", "meal", "vibe", "cuisine", "seating",
  "kids_playground", "smoking_allowed", "service_type",
  "kids_menu", "high_chairs", "nappy_changing_station", "wheelchair_car_park", "wheelchair_entrance",
  "wheelchair_seating", "wheelchair_toilet", "has_toilet", "has_wifi", "has_free_wifi"
] as const;

export const SHOPPING_ONLY_FIELDS = [
  "air_conditioned", "payment_methods", "delivery_available",
  "order_online", "parking_available", "wheelchair_friendly", "local_products",
  "shop_type", "curio_or_gifts", "product_categories", "price_range"
] as const;

export const ACCOMMODATION_ONLY_FIELDS = [
  "pets_allowed", "sleeps", "price_range", "km_from_town",
  "has_restaurant", "has_bar", "has_room_service", "has_breakfast", "breakfast_included",
  "has_swimming_pool", "has_laundry", "child_friendly", "has_spa", "has_fitness_centre",
  "has_airport_shuttle", "airport_shuttle_free", "has_aircon", "has_wifi_accom", "has_free_parking", "has_secure_parking"
] as const;

export const NGO_ONLY_FIELDS = [
  "cause", "impact", "ways_to_give", "volunteering", "visiting"
] as const;

export const RESTAURANT_CATEGORY_PATTERN = /restaurant|caf[eé]/i;
export const SHOPPING_CATEGORY_PATTERN = /^shopping$/i;
export const ACCOMMODATION_CATEGORY_PATTERN = /^accommodation$/i;
export const NGO_CATEGORY_PATTERN = /ngo|volunteer/i;

export function isRestaurantCategory(categoryTitle: string): boolean {
  return RESTAURANT_CATEGORY_PATTERN.test(categoryTitle);
}

export function isShoppingCategory(categoryTitle: string): boolean {
  return SHOPPING_CATEGORY_PATTERN.test(categoryTitle);
}

export function isAccommodationCategory(categoryTitle: string): boolean {
  return ACCOMMODATION_CATEGORY_PATTERN.test(categoryTitle);
}

export function isNGOCategory(categoryTitle: string): boolean {
  return NGO_CATEGORY_PATTERN.test(categoryTitle);
}

export function getCSVHeadersForCategory(categoryTitle: string | null): string[] {
  const headers: string[] = [...UNIVERSAL_FIELDS];
  if (categoryTitle && isRestaurantCategory(categoryTitle)) {
    headers.push(...RESTAURANT_ONLY_FIELDS);
  }
  if (categoryTitle && isShoppingCategory(categoryTitle)) {
    headers.push(...SHOPPING_ONLY_FIELDS);
  }
  if (categoryTitle && isAccommodationCategory(categoryTitle)) {
    headers.push(...ACCOMMODATION_ONLY_FIELDS);
  }
  return headers;
}
