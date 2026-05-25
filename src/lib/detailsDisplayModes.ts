// Per-card "show only yes" vs "show yes & no with ticks/crosses" config
// Keys MUST match section.key values built in ListingDetail.tsx.

export type DisplayMode = "yes_only" | "all";

export type SectionGroup = "restaurant" | "accommodation" | "shopping" | "trades";

export interface DisplaySection {
  key: string;
  title: string;
  group: SectionGroup;
}

// Only sections that mix true/false flags (i.e. rendered with ticks/crosses)
export const DISPLAY_SECTIONS: DisplaySection[] = [
  { key: "service",         title: "Service Options",  group: "restaurant" },
  { key: "kids",            title: "Kids & Family",    group: "restaurant" },
  { key: "accessibility",   title: "Accessibility",    group: "restaurant" },
  { key: "amenities",       title: "Amenities",        group: "restaurant" },
  { key: "accom-food",      title: "Food & drink",     group: "accommodation" },
  { key: "accom-transport", title: "Transport",        group: "accommodation" },
  { key: "accom-wellness",  title: "Wellness",         group: "accommodation" },
  { key: "accom-rooms",     title: "Rooms",            group: "accommodation" },
  { key: "shop-amenities",  title: "Amenities",        group: "shopping" },
  { key: "trades-service",  title: "Service info",     group: "trades" },
];

export const DEFAULT_DISPLAY_MODE: DisplayMode = "all";

export const DISPLAY_DEFAULTS_SECTION = "details_display_defaults";

export function resolveSectionMode(
  sectionKey: string,
  perListing: Record<string, DisplayMode | "default"> | null | undefined,
  globalDefaults: Record<string, DisplayMode> | null | undefined,
): DisplayMode {
  const override = perListing?.[sectionKey];
  if (override === "yes_only" || override === "all") return override;
  const def = globalDefaults?.[sectionKey];
  if (def === "yes_only" || def === "all") return def;
  return DEFAULT_DISPLAY_MODE;
}

export function sectionsForGroup(group: SectionGroup): DisplaySection[] {
  return DISPLAY_SECTIONS.filter((s) => s.group === group);
}
