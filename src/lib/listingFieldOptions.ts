// Reference/format strings for each listing CSV column.
//
// Used to render an extra "reference row" at the top of every exported CSV
// (and downloaded template) so editors know exactly which values are allowed
// per field. The reference row is identified by a leading `#` in the title
// cell and is skipped on import.

import { LISTING_FIELD_SPECS, type FieldType } from "@/lib/categoryFields";

// Option lists — kept in sync with the choices rendered in the listings editor.
const MEAL_OPTIONS = ["Breakfast", "Lunch", "Dinner", "Brunch", "Pub Grub", "Snacks", "Light Meals"];
const VIBE_OPTIONS = ["Casual", "Social", "Fancy", "Scenic", "Romantic", "Hidden Gem", "Late Nights", "Good for Remote Work", "Cosy", "Rustic", "Lively", "Bushveld Feel", "Local Favourite", "Instagrammable", "Quiet Space"];
const CUISINE_OPTIONS = ["Italian", "Indian", "Mexican", "Asian", "Local", "Vegan", "Vegetarian", "Healthy Eats"];
const FOODS_OPTIONS = ["Burgers", "Pizzas", "Seafood", "Sushi", "Grill", "Ribs", "Steaks", "Tapas", "Pasta", "Baked Goods", "Desserts", "Fast Food", "Gelato", "Wraps", "Salads", "Chicken", "Sandwiches"];
const SEATING_OPTIONS = ["Indoor", "Outdoor", "Bar"];
const SERVICE_TYPE_OPTIONS = ["Sit Down", "Takeaway", "Delivery"];
const PAYMENT_METHOD_OPTIONS = ["Cash", "Card", "EFT", "Account"];
const SHOP_TYPE_OPTIONS = ["Shopping Centre", "Curios & Gifts", "General Store", "Boutique", "Hardware", "Grocery", "Clothing", "Electronics", "Pharmacy", "Pet Shop", "Stationery Shop", "Other"];
const ACCOMMODATION_PRICE_RANGE_OPTIONS = ["Budget", "Mid-range", "Luxury"];
const PROPERTY_TYPE_OPTIONS = ["Lodge", "Hotel", "Guest House", "Bed & Breakfast", "Self-Catering", "Villa", "Cottage", "Chalet", "Apartment", "Camping", "Glamping", "Bush Camp", "Backpackers", "Farm Stay", "Other"];
const SERVICES_OFFERED_OPTIONS = ["Nursery", "Landscaping", "Garden maintenance", "Irrigation", "Tree felling/pruning", "Bush Clearing", "Swimming Pool Services", "Interior design", "Upholstery", "Equipment rental", "Equipment servicing/repairs"];
const PLANT_TYPES_OPTIONS = ["Indigenous", "Water-wise", "Exotic", "Trees", "Succulents", "Veggies & Herbs", "Pot plants"];
const EVENT_TYPES_OPTIONS = ["Weddings", "Corporate", "Birthdays", "Private functions", "Conferences", "Baby showers", "Kids parties", "Fundraisers", "Festivals"];
const VENUE_STYLE_TAG_OPTIONS = ["Rustic", "Modern", "Classic", "Boho", "Safari", "Minimalist", "Vintage", "Romantic"];
const VENUE_SETTING_OPTIONS = ["Bush", "Garden", "Riverside", "Farm", "Town", "Lodge"];
const VENUE_INDOOR_OUTDOOR_OPTIONS = ["Indoor", "Outdoor", "Both"];

// Field-specific overrides. When a field is not here, we fall back to the
// generic reference for its FieldType (see `formatReferenceForType`).
const FIELD_REFERENCE_OVERRIDES: Record<string, string> = {
  // Virtual / categorical
  categories: "pipe-separated category names — every category this listing belongs to, e.g. Home & Garden | Building & Renovation. Set here only: the category sheets never ask again. Leave blank to keep the stored ones",
  subcategories: "pipe-separated subcategory names for THIS category only, e.g. Nurseries | Landscaping — the same listing's subcategories under its other categories are filled in on those categories' sheets. Leave blank to keep the stored ones, \"-\" to clear them",
  card_primary_subcategory: "the single label shown on the listing card on THIS category's page only — this category's name, or one of its subcategories. Leave blank to keep the stored label, \"-\" to auto-pick the first populated subcategory",

  title_override: "true / false — true shows the title exactly as typed above (no automatic Title Case), false uses the normal casing. Same as the toggle in the editor",

  // Universal scalars with notable formats
  price_level: "integer 1–4 (1 = $, 4 = $$$$)",
  google_rating: "decimal 0–5, e.g. 4.5",
  google_reviews_count: "integer, e.g. 128",
  opening_hours: `JSON, e.g. {"monday":"09:00-17:00","tuesday":"closed"}`,
  opening_hours_label: `what the opening_hours column above is the hours OF, for a listing that keeps more than one schedule — e.g. Kitchen. Leave blank for the usual single set of hours and the app just says "Opening Hours"`,
  additional_hours: `JSON list of EXTRA schedules for listings that trade on two clocks (e.g. a kitchen and a bar), same day keys and wording as opening_hours: [{"label":"Bar","hours":{"monday":"16:00 - 00:00","tuesday":"closed"}}]. Leave blank for the usual single set of hours, "-" to clear the extras`,
  details_display_mode: `JSON object, e.g. {"meals":"chips","amenities":"default"}`,
  gallery_images: "pipe-separated image URLs",
  image_url: "single image URL",
  detail_image_url: "single image URL",
  google_maps_link: "URL",
  google_reviews_url: "URL",
  google_place_id: "back-office only, never shown in the app: the listing's Google Place ID (e.g. ChIJN1t_tDeuEmsRUsoyG83frY4), which is what the nightly sync fetches the rating and review count with. Leave blank to let the sync find it itself; fill it in for listings it can't match. A full Places URL is fine too, the ID is read out of it",
  facebook: "URL",
  instagram: "URL",
  website: "URL",
  km_from_town: "numeric km from town centre, e.g. 5",
  good_to_know: `pipe-separated highlights shown as "Good to know" chips, e.g. Self-catering | Rim-flow pool | Pet friendly (leave blank to hide the card)`,

  // Restaurant
  meal: `pipe-separated, options: ${MEAL_OPTIONS.join(" | ")}`,
  vibe: `pipe-separated, options: ${VIBE_OPTIONS.join(" | ")}`,
  cuisine: `pipe-separated, options: ${CUISINE_OPTIONS.join(" | ")}`,
  foods: `pipe-separated, options: ${FOODS_OPTIONS.join(" | ")}`,
  seating: `pipe-separated, options: ${SEATING_OPTIONS.join(" | ")}`,
  service_type: `pipe-separated, options: ${SERVICE_TYPE_OPTIONS.join(" | ")}`,

  // Shopping
  payment_methods: `pipe-separated, options: ${PAYMENT_METHOD_OPTIONS.join(" | ")}`,
  shop_type: `one of: ${SHOP_TYPE_OPTIONS.join(" | ")}`,
  product_categories: "pipe-separated free text",
  price_range: `one of: ${ACCOMMODATION_PRICE_RANGE_OPTIONS.join(" | ")} (Accommodation), or free text (Shopping)`,

  // Accommodation
  amenities: "pipe-separated free text, e.g. Pool | Wi-Fi | Air-con",
  sleeps: "integer total adult guest capacity",
  sleeps_children: "integer children capacity",
  min_nights: "integer, minimum number of nights per stay",
  rooms_count: "integer",
  avg_price_per_person_per_night: "text, e.g. R1 200",
  avg_price_per_couple_per_night: "text, e.g. R2 400",
  star_rating: "integer 1-5, the graded star rating of the stay",
  property_type: `free text, new values allowed. Common: ${PROPERTY_TYPE_OPTIONS.join(" | ")}`,

  // Home & Garden
  services_offered: `pipe-separated, options: ${SERVICES_OFFERED_OPTIONS.join(" | ")}`,
  plant_types: `pipe-separated, options: ${PLANT_TYPES_OPTIONS.join(" | ")}`,

  // Weddings & Events
  event_types: `pipe-separated, options: ${EVENT_TYPES_OPTIONS.join(" | ")}`,
  venue_style_tags: `pipe-separated, options: ${VENUE_STYLE_TAG_OPTIONS.join(" | ")}`,
  venue_setting_types: `pipe-separated, options: ${VENUE_SETTING_OPTIONS.join(" | ")}`,
  venue_indoor_outdoor: `one of: ${VENUE_INDOOR_OUTDOOR_OPTIONS.join(" | ")}`,
  venue_guest_capacity: "integer",
  venue_accommodation_sleeps: "integer",

  // Trades & Services
  business_started_year: "integer year, e.g. 2010",

  // Wellness & Beauty
  treatments: "pipe-separated free text",


  // Additional contacts
  additional_phones: "pipe-separated phone numbers",
  additional_phone_labels: "pipe-separated labels (1:1 with additional_phones)",
  additional_emails: "pipe-separated email addresses",
  additional_email_labels: "pipe-separated labels (1:1 with additional_emails)",
  additional_whatsapps: "pipe-separated WhatsApp numbers",
  additional_whatsapp_labels: "pipe-separated labels (1:1 with additional_whatsapps)",
  additional_websites: "pipe-separated URLs",
  additional_website_labels: "pipe-separated labels (1:1 with additional_websites)",
};

function formatReferenceForType(type: FieldType): string {
  switch (type) {
    case "str": return "text";
    case "int": return "integer";
    case "float": return "decimal";
    case "bool": return "true / false (leave blank for unknown)";
    case "bool_default_false": return "true / false";
    case "str_array": return "pipe-separated values";
    case "json": return "JSON object";
  }
}

export function getFieldReference(field: string): string {
  if (FIELD_REFERENCE_OVERRIDES[field]) return FIELD_REFERENCE_OVERRIDES[field];
  const spec = (LISTING_FIELD_SPECS as Record<string, { type: FieldType } | undefined>)[field];
  if (!spec) return "";
  return formatReferenceForType(spec.type);
}

export const REFERENCE_ROW_TITLE = "# REFERENCE ROW — delete this row before importing";

// Build the reference row cells for the given headers. The `title` cell holds
// REFERENCE_ROW_TITLE so the importer can detect & skip it.
export function buildReferenceRow(headers: string[]): string[] {
  return headers.map((h) => {
    if (h === "title") return REFERENCE_ROW_TITLE;
    return getFieldReference(h);
  });
}
