import { collectSpecialTags, countSpecialTags, specialMatchesTag, uniqueTags } from "./specialTags";
import { countSpecialFilters, specialMatchesBooking, specialMatchesType, type SpecialBookingFilter, type SpecialTypeFilter } from "./specialFilters";
import { countSpecialKinds, specialMatchesKind } from "./specialKind";
import { isEndingSoon, isOngoingSpecial, type SpecialLike } from "./specialValue";
import { isUpcomingSpecial } from "./specialVisibility";

export type SpecialValidity = "all" | "upcoming" | "ending-soon" | "ongoing";
type Facet = "category" | "validity" | "booking" | "savings" | "kind";
export type SpecialFacetRow = SpecialLike & {
  title?: string | null;
  business_name?: string | null;
  description?: string | null;
  tag?: string | null;
  tags?: string[] | null;
  sub_tag_1?: string | null;
  sub_tag_2?: string | null;
  booking_link?: string | null;
  special_type?: string | null;
};
export type SpecialFacetState = {
  search: string;
  categories: string[];
  validity: SpecialValidity;
  booking: SpecialBookingFilter;
  savings: SpecialTypeFilter;
  kind: string;
};

export function specialMatchesValidity(s: SpecialFacetRow, validity: SpecialValidity): boolean {
  if (validity === "upcoming") return isUpcomingSpecial(s);
  if (validity === "ending-soon") return isEndingSoon(s);
  if (validity === "ongoing") return isOngoingSpecial(s);
  return true;
}

export function specialMatchesFacets(s: SpecialFacetRow, state: SpecialFacetState, skip?: Facet): boolean {
  const q = state.search.trim().toLowerCase();
  return (!q || [s.title, s.business_name, s.description].some((v) => v?.toLowerCase().includes(q))) &&
    (skip === "category" || !state.categories.length || state.categories.some((tag) => specialMatchesTag(s, tag))) &&
    (skip === "validity" || specialMatchesValidity(s, state.validity)) &&
    (skip === "booking" || specialMatchesBooking(s, state.booking)) &&
    (skip === "savings" || specialMatchesType(s, state.savings)) &&
    (skip === "kind" || specialMatchesKind(s, state.kind));
}

export function countSpecialFacets(specials: SpecialFacetRow[], state: SpecialFacetState) {
  const base = (skip: Facet) => specials.filter((s) => specialMatchesFacets(s, state, skip));
  const categories = base("category");
  const tags = uniqueTags([...specials.flatMap(collectSpecialTags), ...state.categories]);
  const categoryCounts = countSpecialTags(categories, tags);
  for (const tag of tags) if (!categoryCounts.has(tag)) categoryCounts.set(tag, 0);
  const validityBase = base("validity");
  const kinds = countSpecialKinds(base("kind"));
  if (state.kind && !kinds.options.some((o) => o.label.toLowerCase() === state.kind.toLowerCase())) {
    kinds.options.push({ label: state.kind, count: 0 });
  }
  return {
    tags,
    category: categoryCounts,
    categoryTotal: categories.length,
    validity: Object.fromEntries((["all", "upcoming", "ending-soon", "ongoing"] as const).map((v) =>
      [v, validityBase.filter((s) => specialMatchesValidity(s, v)).length]
    )) as Record<SpecialValidity, number>,
    booking: countSpecialFilters(base("booking")).booking,
    savings: countSpecialFilters(base("savings")).type,
    kinds,
  };
}