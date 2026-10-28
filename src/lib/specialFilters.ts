export const SPECIAL_TYPE_OPTIONS = [
  { key: "any", label: "Any" },
  { key: "buy_x_get_y", label: "Buy X; Get Y" },
  { key: "percent_off", label: "% Saving" },
  { key: "freebie", label: "Freebie" },
  { key: "fixed_price", label: "Fixed Price" },
] as const;

export const SPECIAL_BOOKING_OPTIONS = [
  { key: "any", label: "Any" },
  { key: "required", label: "Booking Required" },
  { key: "not-required", label: "Booking Not Required" },
] as const;

export type SpecialTypeFilter = typeof SPECIAL_TYPE_OPTIONS[number]["key"];
export type SpecialBookingFilter = typeof SPECIAL_BOOKING_OPTIONS[number]["key"];
type FilterableSpecial = { booking_link?: string | null; discount_type?: string | null };

export function specialRequiresBooking(special: FilterableSpecial): boolean {
  return Boolean(special.booking_link?.trim());
}

export function specialMatchesBooking(special: FilterableSpecial, filter: SpecialBookingFilter): boolean {
  return filter === "any" || specialRequiresBooking(special) === (filter === "required");
}

export function specialMatchesType(special: FilterableSpecial, filter: SpecialTypeFilter): boolean {
  return filter === "any" || special.discount_type?.trim().toLowerCase() === filter;
}

export function countSpecialFilters(specials: FilterableSpecial[]) {
  const booking = Object.fromEntries(SPECIAL_BOOKING_OPTIONS.map(({ key }) =>
    [key, specials.filter((special) => specialMatchesBooking(special, key)).length]
  )) as Record<SpecialBookingFilter, number>;
  const type = Object.fromEntries(SPECIAL_TYPE_OPTIONS.map(({ key }) =>
    [key, specials.filter((special) => specialMatchesType(special, key)).length]
  )) as Record<SpecialTypeFilter, number>;
  return { booking, type };
}