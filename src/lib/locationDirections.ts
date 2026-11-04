// "Hoedspruit & Surrounds" is an area, not an address. Places recorded that way
// show no map and no copyable address, so they must offer no directions either.
// The fixed action bar and the Location tab both read this rule from here, so
// neither can offer a journey the other has already hidden.

export const SURROUNDS_LOCATION = "Hoedspruit & Surrounds";

// The area label as it is stored, matched whatever its casing or padding.
export const isSurroundsLocation = (location?: string | null): boolean =>
  (location ?? "").trim().toLowerCase() === "hoedspruit & surrounds";

// The Google Maps URL for a place, or null when there is nowhere to navigate to.
// A surrounds location never gets one — not even when a maps link happens to be
// saved against the record — because there is no single point to travel to.
export const directionsHref = ({
  mapsLink,
  location,
  title,
}: {
  mapsLink?: string | null;
  location?: string | null;
  title?: string | null;
}): string | null => {
  if (isSurroundsLocation(location)) return null;
  if (mapsLink) return mapsLink;
  const query = (location ?? "").trim() || (title ?? "").trim();
  return query
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
    : null;
};
