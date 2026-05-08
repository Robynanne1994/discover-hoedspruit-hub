// Static category catalogues used by the notifications system.
// IDs are stable slugs stored on the user's preferences row.

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
      { id: "restaurants-cafes", label: "Restaurants & Cafés", count: 52 },
      { id: "accommodation", label: "Accommodation", count: 63 },
      { id: "activities-adventures", label: "Activities & Adventures", count: 7 },
      { id: "tours-safaris", label: "Tours & Safaris", count: 0 },
      { id: "nightlife", label: "Nightlife", count: 0 },
    ],
  },
  {
    label: "Lifestyle",
    items: [
      { id: "shopping", label: "Shopping", count: 92 },
      { id: "wellness-beauty", label: "Wellness & Beauty", count: 15 },
      { id: "art-culture", label: "Art & Culture", count: 1 },
      { id: "sports-fitness", label: "Sports & Fitness", count: 0 },
      { id: "weddings-events", label: "Weddings & Events", count: 0 },
    ],
  },
  {
    label: "Home & Services",
    items: [
      { id: "home-garden", label: "Home & Garden", count: 7 },
      { id: "property", label: "Property", count: 9 },
      { id: "auto-mechanical", label: "Auto & Mechanical", count: 17 },
      { id: "trades-services", label: "Trades & Services", count: 88 },
      { id: "building-renovation", label: "Building & Renovation", count: 0 },
      { id: "transport", label: "Transport", count: 0 },
      { id: "business-workspaces", label: "Business & Workspaces", count: 0 },
    ],
  },
  {
    label: "Health & Community",
    items: [
      { id: "health-medical", label: "Health & Medical", count: 26 },
      { id: "education", label: "Education", count: 12 },
      { id: "community", label: "Community", count: 14 },
      { id: "ngos-volunteering", label: "NGOs & Volunteering", count: 7 },
      { id: "pets-vets", label: "Pets & Vets", count: 0 },
      { id: "emergency-services", label: "Emergency Services", count: 0 },
      { id: "financial-legal", label: "Financial & Legal", count: 0 },
    ],
  },
];

export const EVENT_CATEGORY_GROUPS: CategoryGroup[] = [
  {
    label: "What's On",
    items: [
      { id: "music-live", label: "Music & Live", count: 0 },
      { id: "markets-popups", label: "Markets & Pop-ups", count: 0 },
      { id: "food-dining", label: "Food & Dining", count: 0 },
      { id: "family-kids", label: "Family & Kids", count: 0 },
    ],
  },
  {
    label: "Active & Outdoor",
    items: [
      { id: "sport-active", label: "Sport & Active", count: 0 },
      { id: "wellness-yoga", label: "Wellness & Yoga", count: 0 },
    ],
  },
  {
    label: "Mind & Community",
    items: [
      { id: "workshops-talks", label: "Workshops & Talks", count: 0 },
      { id: "conservation", label: "Conservation", count: 0 },
      { id: "community", label: "Community", count: 0 },
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
    eyebrow: "NEW EVENTS · CATEGORIES",
    title: "pick your kind of fun.",
    subline: "Choose which event types you want to hear about.",
    groups: EVENT_CATEGORY_GROUPS,
    column: "events_new_categories",
    itemNoun: { one: "event", many: "events" },
  },
  listings_new: {
    eyebrow: "NEW LISTINGS · CATEGORIES",
    title: "tell us what to send.",
    subline: "Choose which categories trigger a notification when a new place joins the app.",
    groups: LISTING_CATEGORY_GROUPS,
    column: "listings_new_categories",
    itemNoun: { one: "listing", many: "listings" },
  },
  listings_updates: {
    eyebrow: "LISTING UPDATES · CATEGORIES",
    title: "narrow it down.",
    subline: "Choose which categories you want updates from when followed places change.",
    groups: LISTING_CATEGORY_GROUPS,
    column: "listings_updates_categories",
    itemNoun: { one: "listing", many: "listings" },
  },
  specials_new: {
    eyebrow: "NEW SPECIALS · CATEGORIES",
    title: "pick your kind of deal.",
    subline: "Choose which kinds of business deals you want to hear about.",
    groups: LISTING_CATEGORY_GROUPS,
    column: "specials_new_categories",
    itemNoun: { one: "listing", many: "listings" },
  },
};

export const allCategoryIds = (groups: CategoryGroup[]) =>
  groups.flatMap((g) => g.items.map((i) => i.id));

export const totalCategoryCount = (groups: CategoryGroup[]) =>
  groups.reduce((sum, g) => sum + g.items.length, 0);
