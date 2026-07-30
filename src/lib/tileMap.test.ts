import { describe, expect, it } from "vitest";
import {
  TILE_SIZE,
  buildTileGrid,
  latToTileY,
  lonToTileX,
  parseCoordsFromMapLink,
} from "@/lib/tileMap";

// Hoedspruit town centre, the fallback the Location tab falls back to.
const HOEDSPRUIT = { lat: -24.3567, lon: 31.0 };

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
    expect(tiles.length).toBe(6);
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

describe("parseCoordsFromMapLink", () => {
  it("reads the @lat,lon form", () => {
    expect(parseCoordsFromMapLink("https://www.google.com/maps/@-24.3567,31.0523,17z")).toEqual({
      lat: -24.3567,
      lon: 31.0523,
    });
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
