import { describe, expect, it } from "vitest";
import {
  HOEDSPRUIT_CENTRE,
  TILE_SIZE,
  buildTileGrid,
  geocodeQueries,
  isNearHoedspruit,
  latToTileY,
  lonToTileX,
  parseCoordsFromMapLink,
} from "@/lib/tileMap";

// Hoedspruit town centre, the fallback the Location tab falls back to.
const HOEDSPRUIT = HOEDSPRUIT_CENTRE;

describe("buildTileGrid", () => {
  it("puts the requested point in the middle of the viewport", () => {
    const zoom = 16;
    const width = 358;
    const height = 220;
    const tiles = buildTileGrid({ ...HOEDSPRUIT, zoom, width, height });

    const centreCol = Math.floor(lonToTileX(HOEDSPRUIT.lon, zoom));
    const centreRow = Math.floor(latToTileY(HOEDSPRUIT.lat, zoom));
    const centreTile = tiles.find((t) => t.x === centreCol && t.y === centreRow);
    expect(centreTile).toBeDefined();

    // Offset of the point within its own tile, added to that tile's position,
    // must land dead centre.
    const withinX = (lonToTileX(HOEDSPRUIT.lon, zoom) % 1) * TILE_SIZE;
    const withinY = (latToTileY(HOEDSPRUIT.lat, zoom) % 1) * TILE_SIZE;
    expect(centreTile!.left + withinX).toBeCloseTo(width / 2, 6);
    expect(centreTile!.top + withinY).toBeCloseTo(height / 2, 6);
  });

  it("covers the whole viewport", () => {
    const tiles = buildTileGrid({ ...HOEDSPRUIT, zoom: 16, width: 358, height: 220 });
    // Enough tiles to span the viewport, and no more than the four the corners
    // can straddle. The exact count depends on where the point sits inside its
    // own tile, so it is not pinned to a number.
    expect(tiles.length).toBeGreaterThanOrEqual(2);
    expect(tiles.length).toBeLessThanOrEqual(4);
    expect(Math.min(...tiles.map((t) => t.left))).toBeLessThanOrEqual(0);
    expect(Math.max(...tiles.map((t) => t.left + TILE_SIZE))).toBeGreaterThanOrEqual(358);
    expect(Math.min(...tiles.map((t) => t.top))).toBeLessThanOrEqual(0);
    expect(Math.max(...tiles.map((t) => t.top + TILE_SIZE))).toBeGreaterThanOrEqual(220);
  });

  it("returns nothing before the container has been measured", () => {
    expect(buildTileGrid({ ...HOEDSPRUIT, zoom: 16, width: 0, height: 220 })).toEqual([]);
  });

  it("keeps tile indexes inside the pyramid", () => {
    const tiles = buildTileGrid({ lat: 0, lon: 179.99, zoom: 3, width: 800, height: 400 });
    expect(tiles.every((t) => t.x >= 0 && t.x < 8 && t.y >= 0 && t.y < 8)).toBe(true);
  });
});

describe("HOEDSPRUIT_CENTRE", () => {
  it("sits in built-up Hoedspruit, not the bush east of it", () => {
    // The Google Places sync biases its search to this point; the map fallback
    // has to agree with it, or a listing that fails to geocode lands on an
    // empty tile with no roads on it.
    expect(HOEDSPRUIT_CENTRE.lat).toBeCloseTo(-24.3548, 3);
    expect(HOEDSPRUIT_CENTRE.lon).toBeCloseTo(30.954, 3);
    expect(isNearHoedspruit(HOEDSPRUIT_CENTRE)).toBe(true);
  });

  it("rejects coordinates from elsewhere in the country", () => {
    // Johannesburg — what an unbounded search for a common street name returns.
    expect(isNearHoedspruit({ lat: -26.2041, lon: 28.0473 })).toBe(false);
  });
});

describe("geocodeQueries", () => {
  it("falls back from the venue name to the street address", () => {
    const queries = geocodeQueries("Railway Station, 1 Python Street", "Some Business");
    expect(queries[0]).toBe("Railway Station, 1 Python Street, Hoedspruit, South Africa");
    expect(queries).toContain("1 Python Street, Hoedspruit, South Africa");
    expect(queries).toContain("Python Street, Hoedspruit, South Africa");
  });

  it("does not repeat Hoedspruit when the address already says it", () => {
    expect(geocodeQueries("Kamogelo Centre, Hoedspruit")).toContain(
      "Kamogelo Centre, Hoedspruit, South Africa"
    );
  });

  it("uses the title when there is no address", () => {
    expect(geocodeQueries(null, "Hat & Creek")).toEqual(["Hat & Creek, Hoedspruit, South Africa"]);
  });

  it("returns nothing when there is neither", () => {
    expect(geocodeQueries(null, null)).toEqual([]);
  });
});

describe("parseCoordsFromMapLink", () => {
  it("reads the @lat,lon form", () => {
    expect(parseCoordsFromMapLink("https://www.google.com/maps/@-24.3567,31.0523,17z")).toEqual({
      lat: -24.3567,
      lon: 31.0523,
    });
  });

  it("prefers the pin over the camera position on a place URL", () => {
    // The @ pair is where the camera sits; !3d!4d is the pin itself.
    expect(
      parseCoordsFromMapLink(
        "https://www.google.com/maps/place/Shop/@-24.3500,30.9500,17z/data=!4m6!3m5!3d-24.3548!4d30.954"
      )
    ).toEqual({ lat: -24.3548, lon: 30.954 });
  });

  it("reads the ll and destination parameter forms", () => {
    expect(parseCoordsFromMapLink("https://maps.google.com/?ll=-24.35,30.95")).toEqual({
      lat: -24.35,
      lon: 30.95,
    });
    expect(
      parseCoordsFromMapLink("https://www.google.com/maps/dir/?api=1&destination=-24.35,30.95")
    ).toEqual({ lat: -24.35, lon: 30.95 });
  });

  it("ignores a 0,0 placeholder", () => {
    expect(parseCoordsFromMapLink("https://www.google.com/maps/@0,0,17z")).toBeNull();
  });

  it("reads the !3d!4d form", () => {
    expect(parseCoordsFromMapLink("https://maps.google.com/x/data=!3d-24.35!4d31.05")).toEqual({
      lat: -24.35,
      lon: 31.05,
    });
  });

  it("reads the query parameter form", () => {
    expect(
      parseCoordsFromMapLink("https://www.google.com/maps/search/?api=1&query=-24.35,31.05")
    ).toEqual({ lat: -24.35, lon: 31.05 });
  });

  it("returns null for a link with no coordinates", () => {
    expect(parseCoordsFromMapLink("https://maps.app.goo.gl/abc123")).toBeNull();
  });
});
