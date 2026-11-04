type RestaurantFacilities = Partial<Record<
  | "good_for_kids" | "pets_allowed" | "wheelchair_friendly"
  | "kids_playground" | "kids_menu" | "high_chairs" | "nappy_changing_station"
  | "wheelchair_car_park" | "wheelchair_entrance" | "wheelchair_seating" | "wheelchair_toilet"
  | "has_toilet" | "has_wifi" | "has_free_wifi" | "smoking_allowed" | "drive_through",
  boolean | null
>>;

type FacilityField = { label: string; on: boolean };
type DefinedField = { label: string; value: boolean | null | undefined };

const populated = (fields: DefinedField[]): FacilityField[] =>
  fields.flatMap(({ label, value }) => typeof value === "boolean" ? [{ label, on: value }] : []);

export function restaurantDetailFields(l: RestaurantFacilities) {
  return {
    // These three always appear, including when their stored values are blank.
    summary: [
      { label: "Good for Kids", on: l.good_for_kids === true },
      { label: "Pet-Friendly", on: l.pets_allowed === true },
      { label: "Wheelchair Accessible", on: l.wheelchair_friendly === true },
    ],
    kids: populated([
      { label: "Kids playground", value: l.kids_playground },
      { label: "Kids' menu", value: l.kids_menu },
      { label: "High chairs", value: l.high_chairs },
      { label: "Nappy changing station", value: l.nappy_changing_station },
    ]),
    accessibility: populated([
      { label: "Accessible entrance", value: l.wheelchair_entrance },
      { label: "Accessible seating", value: l.wheelchair_seating },
      { label: "Accessible toilet", value: l.wheelchair_toilet },
      { label: "Accessible parking", value: l.wheelchair_car_park },
    ]),
    amenities: populated([
      { label: "Toilets", value: l.has_toilet },
      { label: l.has_wifi === true && l.has_free_wifi === true ? "WiFi (Free)" : "WiFi", value: l.has_wifi },
      { label: "Smoking section", value: l.smoking_allowed },
    ]),
    service: populated([{ label: "Drive-Through", value: l.drive_through }]),
  };
}