// Registry of customisable icon slots in the app.
// Add new slots here and reference them via <AppIcon slot="..." fallback={...} />

export interface IconSlot {
  key: string;
  label: string;
  group: string;
  description?: string;
}

export const ICON_SLOTS: IconSlot[] = [
  // Bottom nav
  { key: "nav.home", label: "Home", group: "Bottom Navigation" },
  { key: "nav.explore", label: "Explore", group: "Bottom Navigation" },
  { key: "nav.specials", label: "Specials", group: "Bottom Navigation" },
  { key: "nav.events", label: "Events", group: "Bottom Navigation" },
  { key: "nav.profile", label: "Profile", group: "Bottom Navigation" },

  // Listing actions
  { key: "action.favourite", label: "Favourite (heart)", group: "Listing Actions" },
  { key: "action.share", label: "Share", group: "Listing Actions" },
  { key: "action.visited", label: "Been here", group: "Listing Actions" },
  { key: "action.directions", label: "Directions", group: "Listing Actions" },
  { key: "action.call", label: "Call", group: "Listing Actions" },
  { key: "action.website", label: "Website", group: "Listing Actions" },
  { key: "action.whatsapp", label: "WhatsApp", group: "Listing Actions" },
  { key: "action.email", label: "Email", group: "Listing Actions" },

  // Generic UI
  { key: "ui.search", label: "Search", group: "UI" },
  { key: "ui.filter", label: "Filter", group: "UI" },
  { key: "ui.back", label: "Back arrow", group: "UI" },
  { key: "ui.star", label: "Star (rating)", group: "UI" },
  { key: "ui.calendar", label: "Calendar", group: "UI" },
  { key: "ui.location", label: "Location pin", group: "UI" },
];

export const ICON_SLOT_GROUPS = Array.from(
  new Set(ICON_SLOTS.map((s) => s.group))
);
