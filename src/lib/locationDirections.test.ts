import { describe, expect, it } from "vitest";
import { directionsHref, isSurroundsLocation } from "./locationDirections";

describe("isSurroundsLocation", () => {
  it("reads the area label whatever its casing or padding", () => {
    expect(isSurroundsLocation("Hoedspruit & Surrounds")).toBe(true);
    expect(isSurroundsLocation("  hoedspruit & SURROUNDS ")).toBe(true);
    expect(isSurroundsLocation("Hoedspruit")).toBe(false);
    expect(isSurroundsLocation("Hoedspruit & Surround ")).toBe(false);
    expect(isSurroundsLocation(null)).toBe(false);
    expect(isSurroundsLocation("")).toBe(false);
  });
});

describe("directionsHref", () => {
  it("offers no directions for the surrounds area, even with a saved maps link", () => {
    expect(directionsHref({ location: "Hoedspruit & Surrounds" })).toBeNull();
    expect(
      directionsHref({
        mapsLink: "https://maps.google.com/?q=1",
        location: "Hoedspruit & Surrounds",
        title: "Hoedspruit Emergency Response",
      }),
    ).toBeNull();
  });

  it("uses a saved maps link for a real place", () => {
    expect(
      directionsHref({
        mapsLink: "https://maps.google.com/?q=Orinda",
        location: "Orinda Park",
      }),
    ).toBe("https://maps.google.com/?q=Orinda");
  });

  it("searches by location, falling back to the title, and gives up on nothing", () => {
    expect(directionsHref({ location: "Orinda Park" })).toBe(
      "https://www.google.com/maps/search/?api=1&query=Orinda%20Park",
    );
    expect(directionsHref({ title: "Panzi Lodge" })).toBe(
      "https://www.google.com/maps/search/?api=1&query=Panzi%20Lodge",
    );
    expect(directionsHref({})).toBeNull();
  });
});
