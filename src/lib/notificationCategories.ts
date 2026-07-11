// Category catalogues used by the notifications system.
// IDs are stable slugs stored on the user's notification_preferences row.
// Kept in sync with the real listing categories (public.categories) and the
// real event tags in use.

export type NotificationFilterType =
  | "events_new"
  | "listings_new"
  | "listings_updates"
  | "specials_new";

export interface CategoryItem {
  id: string;
  label: string;
  count: number;
}

export interface CategoryGroup {
  label: string;
  items: CategoryItem[];
}

export const LISTING_CATEGORY_GROUPS: CategoryGroup[] = [
  {
    label: "Eat & Stay",
    items: [
      { id: "restaurants-cafes", label: "Restaurants & Cafés", count: 0 },
      { id: "accommodation", label: "Accommodation", count: 0 },
      { id: "nightlife", label: "Nightlife", count: 0 },
    ],
  },
  {
    label: "Things To Do",
    items: [
      { id: "activities-adventures", label: "Activities & Adventures", count: 0 },
      { id: "tours-safaris", label: "Tours & Safaris", count: 0 },
      { id: "sports-fitness", label: "Sports & Fitness", count: 0 },
      { id: "arts-culture", label: "Arts & Culture", count: 0 },
      { id: "weddings-events", label: "Weddings & Events", count: 0 },
    ],
  },
  {
    label: "Lifestyle & Shopping",
    items: [
      { id: "shopping", label: "Shopping", count: 0 },
      { id: "wellness-beauty", label: "Wellness & Beauty", count: 0 },
      { id: "pets-vets", label: "Pets & Vets", count: 0 },
    ],
  },
  {
    label: "Home & Property",
    items: [
      { id: "home-garden", label: "Home & Garden", count: 0 },
      { id: "property", label: "Property", count: 0 },
      { id: "building-renovation", label: "Building & Renovation", count: 0 },
      { id: "auto-mechanical", label: "Auto & Mechanical", count: 0 },
      { id: "transport", label: "Transport", count: 0 },
    ],
  },
  {
    label: "Services & Business",
    items: [
      { id: "trades-services", label: "Trades & Services", count: 0 },
      { id: "financial-legal", label: "Financial & Legal", count: 0 },
      { id: "business-workspaces", label: "Business & Workspaces", count: 0 },
    ],
  },
  {
    label: "Health & Community",
    items: [
      { id: "health-medical", label: "Health & Medical", count: 0 },
      { id: "emergency-services", label: "Emergency Services", count: 0 },
      { id: "education", label: "Education", count: 0 },
      { id: "community", label: "Community", count: 0 },
      { id: "ngos-volunteering", label: "NGOs & Volunteering", count: 0 },
    ],
  },
];

export const EVENT_CATEGORY_GROUPS: CategoryGroup[] = [
  {
    label: "Active & Wellness",
    items: [
      { id: "sport-fitness", label: "Sport & Fitness", count: 0 },
      { id: "wellness", label: "Wellness", count: 0 },
    ],
  },
  {
    label: "Food, Markets & Entertainment",
    items: [
      { id: "food-drink", label: "Food & Drink", count: 0 },
      { id: "markets", label: "Markets", count: 0 },
      { id: "entertainment", label: "Entertainment", count: 0 },
    ],
  },
  {
    label: "Learning & Community",
    items: [
      { id: "workshops", label: "Workshops", count: 0 },
      { id: "education", label: "Education", count: 0 },
      { id: "arts-crafts", label: "Arts & Crafts", count: 0 },
      { id: "business", label: "Business", count: 0 },
    ],
  },
];

export const FILTER_TYPE_META: Record<
  NotificationFilterType,
  {
    eyebrow: string;
    title: string;
    subline: string;
    groups: CategoryGroup[];
    column: "events_new_categories" | "listings_new_categories" | "listings_updates_categories" | "specials_new_categories";
    itemNoun: { one: string; many: string };
  }
> = {
  events_new: {
    eyebrow: "NEW EVENTS",
    title: "pick your kind of fun.",
    subline: "Choose which event types you want to be notified about.",
    groups: EVENT_CATEGORY_GROUPS,
    column: "events_new_categories",
    itemNoun: { one: "event", many: "events" },
  },
  listings_new: {
    eyebrow: "NEW LISTINGS",
    title: "tell us what to send.",
    subline: "Choose which categories you want to be notified about if a new business listing is added.",
    groups: LISTING_CATEGORY_GROUPS,
    column: "listings_new_categories",
    itemNoun: { one: "listing", many: "listings" },
  },
  listings_updates: {
    eyebrow: "LISTING UPDATES",
    title: "narrow it down.",
    subline: "Choose which categories you want updates from when changes are made to business details.",
    groups: LISTING_CATEGORY_GROUPS,
    column: "listings_updates_categories",
    itemNoun: { one: "listing", many: "listings" },
  },
  specials_new: {
    eyebrow: "NEW SPECIALS",
    title: "pick your kind of deal.",
    subline: "Choose what specials you want to be notified about.",
    groups: LISTING_CATEGORY_GROUPS,
    column: "specials_new_categories",
    itemNoun: { one: "listing", many: "listings" },
  },
};

export const allCategoryIds = (groups: CategoryGroup[]) =>
  groups.flatMap((g) => g.items.map((i) => i.id));

export const totalCategoryCount = (groups: CategoryGroup[]) =>
  groups.reduce((sum, g) => sum + g.items.length, 0);
