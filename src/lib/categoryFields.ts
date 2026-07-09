// Shared field definitions for category-aware listing management.
//
// The CSV import/export is driven by LISTING_FIELD_SPECS: a single source of truth
// for every editable column on `listings`, with type metadata so import & export
// can serialize / parse every field consistently.

export type FieldType =
  | "str"             // plain text (null when empty)
  | "int"             // integer
  | "float"           // numeric (e.g. google_rating)
  | "bool"            // nullable boolean ("true"/"false"/empty)
  | "bool_default_false" // boolean with non-null default (e.g. is_featured)
  | "str_array"       // pipe-separated strings
  | "json";           // JSON-encoded object (opening_hours, details_display_mode)

export type FieldSpec = { type: FieldType };

export const LISTING_FIELD_SPECS = {
  // ---------- Universal: identity & content ----------
  title: { type: "str" },
  title_override: { type: "str" },
  long_description: { type: "str" },
  image_url: { type: "str" },
  detail_image_url: { type: "str" },
  gallery_images: { type: "str_array" },
  location: { type: "str" },

  // ---------- Universal: contacts ----------
  phone: { type: "str" },
  phone_label: { type: "str" },
  email: { type: "str" },
  email_label: { type: "str" },
  website: { type: "str" },
  website_label: { type: "str" },
  whatsapp: { type: "str" },
  whatsapp_label: { type: "str" },
  additional_phones: { type: "str_array" },
  additional_phone_labels: { type: "str_array" },
  additional_emails: { type: "str_array" },
  additional_email_labels: { type: "str_array" },
  additional_whatsapps: { type: "str_array" },
  additional_whatsapp_labels: { type: "str_array" },
  additional_websites: { type: "str_array" },
  additional_website_labels: { type: "str_array" },
  action_phone_index: { type: "int" },
  action_email_index: { type: "int" },
  action_whatsapp_index: { type: "int" },
  action_website_index: { type: "int" },
  facebook: { type: "str" },
  instagram: { type: "str" },

  // ---------- Universal: maps & reviews ----------
  google_maps_link: { type: "str" },
  google_rating: { type: "float" },
  google_reviews_count: { type: "int" },
  google_reviews_url: { type: "str" },

  // ---------- Universal: misc ----------
  is_featured: { type: "bool_default_false" },
  opening_hours: { type: "json" },
  details_display_mode: { type: "json" },

  // ---------- Universal: custom blocks ----------
  custom_title_1: { type: "str" },
  custom_text_1: { type: "str" },
  custom_title_2: { type: "str" },
  custom_text_2: { type: "str" },
  custom_title_3: { type: "str" },
  custom_text_3: { type: "str" },

  // ---------- Restaurant ----------
  show_attributes: { type: "bool_default_false" },
  good_for_kids: { type: "bool" },
  pets_allowed: { type: "bool" },
  wheelchair_friendly: { type: "bool" },
  price_level: { type: "int" },
  meal: { type: "str_array" },
  vibe: { type: "str_array" },
  cuisine: { type: "str_array" },
  foods: { type: "str_array" },
  seating: { type: "str_array" },
  service_type: { type: "str_array" },
  kids_playground: { type: "bool" },
  smoking_allowed: { type: "bool" },
  kids_menu: { type: "bool" },
  high_chairs: { type: "bool" },
  nappy_changing_station: { type: "bool" },
  wheelchair_car_park: { type: "bool" },
  wheelchair_entrance: { type: "bool" },
  wheelchair_seating: { type: "bool" },
  wheelchair_toilet: { type: "bool" },
  has_toilet: { type: "bool" },
  has_wifi: { type: "bool" },
  has_free_wifi: { type: "bool" },
  has_wine_list: { type: "bool" },
  has_cocktails: { type: "bool" },
  has_craft_beer: { type: "bool" },
  has_smoothies: { type: "bool" },
  has_coffee: { type: "bool" },
  has_champagne: { type: "bool" },
  has_milkshakes: { type: "bool" },
  has_mocktails: { type: "bool" },
  has_beers_ciders: { type: "bool" },
  has_iced_coffee: { type: "bool" },
  is_franchise: { type: "bool" },
  drive_through: { type: "bool" },

  // ---------- Shopping ----------
  air_conditioned: { type: "bool" },
  payment_methods: { type: "str_array" },
  delivery_available: { type: "bool" },
  
  order_online: { type: "bool" },
  parking_available: { type: "bool" },
  local_products: { type: "bool" },
  shop_type: { type: "str" },
  curio_or_gifts: { type: "bool" },
  product_categories: { type: "str_array" },
  price_range: { type: "str" },

  // ---------- Accommodation ----------
  amenities: { type: "str_array" },
  sleeps: { type: "int" },
  km_from_town: { type: "str" },
  has_restaurant: { type: "bool" },
  has_bar: { type: "bool" },
  has_room_service: { type: "bool" },
  has_breakfast: { type: "bool" },
  breakfast_included: { type: "bool" },
  has_swimming_pool: { type: "bool" },
  has_laundry: { type: "bool" },
  child_friendly: { type: "bool" },
  has_spa: { type: "bool" },
  has_fitness_centre: { type: "bool" },
  has_airport_shuttle: { type: "bool" },
  airport_shuttle_free: { type: "bool" },
  has_aircon: { type: "bool" },
  has_wifi_accom: { type: "bool" },
  has_free_parking: { type: "bool" },
  has_secure_parking: { type: "bool" },
  avg_price_per_person_per_night: { type: "str" },
  rooms_count: { type: "int" },

  // ---------- NGO ----------
  cause: { type: "str" },
  impact: { type: "str" },
  ways_to_give: { type: "str" },
  volunteering: { type: "str" },
  visiting: { type: "str" },

  // ---------- Trades & Services ----------
  business_started_year: { type: "int" },
  years_in_business: { type: "int" },
  after_hours_available: { type: "bool" },
  callout_fee: { type: "bool" },
  specialities: { type: "str" },
  emergency_24hr: { type: "bool" },
  practitioners: { type: "str_array" },

  // ---------- Home & Garden ----------
  services_offered: { type: "str_array" },
  plant_types: { type: "str_array" },

  // ---------- Weddings & Events (venues) ----------
  event_types: { type: "str_array" },
  venue_onsite_accommodation: { type: "bool" },
  venue_accommodation_sleeps: { type: "int" },
  venue_guest_capacity: { type: "int" },
  venue_indoor_outdoor: { type: "str" },
  venue_style_tags: { type: "str_array" },
  venue_setting_types: { type: "str_array" },

  // ---------- Wellness & Beauty ----------
  treatments: { type: "str_array" },
} as const satisfies Record<string, FieldSpec>;

export type ListingFieldName = keyof typeof LISTING_FIELD_SPECS;

// ----- Field groupings used for CSV header selection per category -----

export const UNIVERSAL_FIELDS = [
  "title", "title_override", "long_description",
  "image_url", "detail_image_url", "gallery_images", "location",
  "km_from_town",
  "phone", "phone_label", "email", "email_label",
  "website", "website_label", "whatsapp", "whatsapp_label",
  "additional_phones", "additional_phone_labels",
  "additional_emails", "additional_email_labels",
  "additional_whatsapps", "additional_whatsapp_labels",
  "additional_websites", "additional_website_labels",
  "facebook", "instagram",
  "google_maps_link", "google_rating", "google_reviews_count", "google_reviews_url",
  "is_featured",
  "opening_hours", "details_display_mode",
  "custom_title_1", "custom_text_1",
  "custom_title_2", "custom_text_2",
  "custom_title_3", "custom_text_3",

] as const;


export const RESTAURANT_ONLY_FIELDS = [
  "show_attributes",
  "good_for_kids", "pets_allowed", "wheelchair_friendly", "price_level",
  "meal", "vibe", "cuisine", "foods", "seating", "service_type",
  "kids_playground", "smoking_allowed",
  "kids_menu", "high_chairs", "nappy_changing_station",
  "wheelchair_car_park", "wheelchair_entrance", "wheelchair_seating", "wheelchair_toilet",
  "has_toilet", "has_wifi", "has_free_wifi",
  "has_wine_list", "has_cocktails", "has_craft_beer", "has_smoothies", "has_coffee",
  "has_champagne", "has_milkshakes", "has_mocktails", "has_beers_ciders", "has_iced_coffee",
  "is_franchise", "drive_through",
] as const;

export const SHOPPING_ONLY_FIELDS = [
  "air_conditioned", "payment_methods", "delivery_available",
  "order_online", "parking_available", "wheelchair_friendly", "local_products",
  "shop_type", "curio_or_gifts", "product_categories", "price_range",
] as const;

export const ACCOMMODATION_ONLY_FIELDS = [
  "pets_allowed", "sleeps", "price_range", "amenities",
  "has_restaurant", "has_bar", "has_room_service", "has_breakfast", "breakfast_included",
  "has_swimming_pool", "has_laundry", "child_friendly", "has_spa", "has_fitness_centre",
  "has_airport_shuttle", "airport_shuttle_free", "has_aircon", "has_wifi_accom",
  "has_free_parking", "has_secure_parking", "wheelchair_friendly",
  "avg_price_per_person_per_night", "rooms_count",
] as const;

export const NGO_ONLY_FIELDS = [
  "cause", "impact", "ways_to_give", "volunteering", "visiting",
] as const;

export const TRADES_ONLY_FIELDS = [
  "business_started_year", "years_in_business",
  "after_hours_available", "callout_fee", "emergency_24hr",
  "specialities", "practitioners",
] as const;

export const HOME_GARDEN_ONLY_FIELDS = [
  "services_offered", "plant_types",
  "business_started_year", "years_in_business", "specialities",
] as const;

export const WEDDINGS_EVENTS_ONLY_FIELDS = [
  "event_types",
  "venue_onsite_accommodation", "venue_accommodation_sleeps", "venue_guest_capacity",
  "venue_indoor_outdoor", "venue_style_tags", "venue_setting_types",
] as const;

export const WELLNESS_BEAUTY_ONLY_FIELDS = [
  "treatments",
] as const;

// ----- Category detection -----

export const RESTAURANT_CATEGORY_PATTERN = /restaurant|caf[eé]/i;
export const SHOPPING_CATEGORY_PATTERN = /^shopping$/i;
export const ACCOMMODATION_CATEGORY_PATTERN = /^accommodation$/i;
export const NGO_CATEGORY_PATTERN = /ngo|volunteer/i;
export const WEDDINGS_EVENTS_CATEGORY_PATTERN = /weddings?\s*(&|and)?\s*events?/i;
export const TRADES_CATEGORY_PATTERN = /trades?\s*(&|and)?\s*services?/i;
export const HOME_GARDEN_CATEGORY_PATTERN = /home\s*(&|and)?\s*garden/i;
export const WELLNESS_BEAUTY_CATEGORY_PATTERN = /wellness\s*(&|and)?\s*beauty/i;

export function isRestaurantCategory(t: string): boolean { return RESTAURANT_CATEGORY_PATTERN.test(t); }
export function isShoppingCategory(t: string): boolean { return SHOPPING_CATEGORY_PATTERN.test(t); }
export function isAccommodationCategory(t: string): boolean { return ACCOMMODATION_CATEGORY_PATTERN.test(t); }
export function isNGOCategory(t: string): boolean { return NGO_CATEGORY_PATTERN.test(t); }
export function isTradesCategory(t: string): boolean { return TRADES_CATEGORY_PATTERN.test(t); }
export function isHomeGardenCategory(t: string): boolean { return HOME_GARDEN_CATEGORY_PATTERN.test(t); }
export function isWeddingsEventsCategory(t: string): boolean { return WEDDINGS_EVENTS_CATEGORY_PATTERN.test(t); }
export function isWellnessBeautyCategory(t: string): boolean { return WELLNESS_BEAUTY_CATEGORY_PATTERN.test(t); }

// Get all CSV headers (including virtual `categories` / `subcategories`) for a category.
// De-duplicates because some category groups overlap (e.g. wheelchair_friendly).
export function getCSVHeadersForCategory(categoryTitle: string | null): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (fields: readonly string[]) => {
    for (const f of fields) {
      if (!seen.has(f)) { seen.add(f); out.push(f); }
    }
  };
  push(UNIVERSAL_FIELDS);
  if (categoryTitle && isRestaurantCategory(categoryTitle)) push(RESTAURANT_ONLY_FIELDS);
  if (categoryTitle && isShoppingCategory(categoryTitle)) push(SHOPPING_ONLY_FIELDS);
  if (categoryTitle && isAccommodationCategory(categoryTitle)) push(ACCOMMODATION_ONLY_FIELDS);
  if (categoryTitle && isNGOCategory(categoryTitle)) push(NGO_ONLY_FIELDS);
  if (categoryTitle && isTradesCategory(categoryTitle)) push(TRADES_ONLY_FIELDS);
  if (categoryTitle && isHomeGardenCategory(categoryTitle)) push(HOME_GARDEN_ONLY_FIELDS);
  if (categoryTitle && isWeddingsEventsCategory(categoryTitle)) push(WEDDINGS_EVENTS_ONLY_FIELDS);
  if (categoryTitle && isWellnessBeautyCategory(categoryTitle)) push(WELLNESS_BEAUTY_ONLY_FIELDS);
  out.push("categories", "subcategories");
  return out;
}


// Return the set of category-specific DB field names for a category (no virtual cols, no universals).
export function getCategorySpecificFields(categoryTitle: string | null): string[] {
  const groups: readonly (readonly string[])[] = [
    categoryTitle && isRestaurantCategory(categoryTitle) ? RESTAURANT_ONLY_FIELDS : [],
    categoryTitle && isShoppingCategory(categoryTitle) ? SHOPPING_ONLY_FIELDS : [],
    categoryTitle && isAccommodationCategory(categoryTitle) ? ACCOMMODATION_ONLY_FIELDS : [],
    categoryTitle && isNGOCategory(categoryTitle) ? NGO_ONLY_FIELDS : [],
    categoryTitle && isTradesCategory(categoryTitle) ? TRADES_ONLY_FIELDS : [],
    categoryTitle && isHomeGardenCategory(categoryTitle) ? HOME_GARDEN_ONLY_FIELDS : [],
    categoryTitle && isWeddingsEventsCategory(categoryTitle) ? WEDDINGS_EVENTS_ONLY_FIELDS : [],
    categoryTitle && isWellnessBeautyCategory(categoryTitle) ? WELLNESS_BEAUTY_ONLY_FIELDS : [],
  ];
  const out = new Set<string>();
  for (const g of groups) for (const f of g) out.add(f);
  return Array.from(out);
}

// Return the universal DB fields (excludes virtual `categories` / `subcategories`).
export function getUniversalDbFields(): string[] {
  return [...UNIVERSAL_FIELDS];
}

