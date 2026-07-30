// Slippy-map (Web Mercator) helpers for the dependency-free tile map used on
// the Location sections of listing and event pages.

export const TILE_SIZE = 256;

export type LatLon = { lat: number; lon: number };

export const HOEDSPRUIT_CENTRE: LatLon = { lat: -24.3567, lon: 31.0 };

/** Fractional tile column for a longitude at the given zoom. */
export const lonToTileX = (lon: number, zoom: number): number =>
  ((lon + 180) / 360) * 2 ** zoom;

/** Fractional tile row for a latitude at the given zoom. */
export const latToTileY = (lat: number, zoom: number): number => {
  const rad = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** zoom;
};

export type Tile = {
  key: string;
  z: number;
  x: number;
  y: number;
  /** CSS offset of the tile inside the viewport, in px. */
  left: number;
  top: number;
};

/**
 * Tiles needed to fill a `width` x `height` viewport centred on `lat`/`lon`,
 * with their pixel offsets. Columns wrap around the antimeridian; rows outside
 * the projection are dropped.
 */
export const buildTileGrid = ({
  lat,
  lon,
  zoom,
  width,
  height,
}: LatLon & { zoom: number; width: number; height: number }): Tile[] => {
  if (!(width > 0) || !(height > 0)) return [];
  const n = 2 ** zoom;
  const centreX = lonToTileX(lon, zoom) * TILE_SIZE;
  const centreY = latToTileY(lat, zoom) * TILE_SIZE;
  const originX = centreX - width / 2;
  const originY = centreY - height / 2;

  const firstCol = Math.floor(originX / TILE_SIZE);
  const lastCol = Math.floor((originX + width) / TILE_SIZE);
  const firstRow = Math.floor(originY / TILE_SIZE);
  const lastRow = Math.floor((originY + height) / TILE_SIZE);

  const tiles: Tile[] = [];
  for (let col = firstCol; col <= lastCol; col++) {
    for (let row = firstRow; row <= lastRow; row++) {
      if (row < 0 || row > n - 1) continue;
      const x = ((col % n) + n) % n;
      tiles.push({
        key: `${zoom}/${col}/${row}`,
        z: zoom,
        x,
        y: row,
        left: col * TILE_SIZE - originX,
        top: row * TILE_SIZE - originY,
      });
    }
  }
  return tiles;
};

/** Pull coordinates straight out of a Google Maps share link, if present. */
export const parseCoordsFromMapLink = (url: string): LatLon | null => {
  const at = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (at) return { lat: parseFloat(at[1]), lon: parseFloat(at[2]) };
  const data = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (data) return { lat: parseFloat(data[1]), lon: parseFloat(data[2]) };
  const query = url.match(/[?&](?:query|q)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (query) return { lat: parseFloat(query[1]), lon: parseFloat(query[2]) };
  return null;
};

const CACHE_PREFIX = "hh-geocode:";

/**
 * Free-text geocode via Nominatim, cached in localStorage so repeat visits to a
 * listing don't hit the service again (their usage policy asks for caching).
 */
export const geocode = async (query: string): Promise<LatLon | null> => {
  const cacheKey = `${CACHE_PREFIX}${query.toLowerCase()}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (typeof parsed?.lat === "number" && typeof parsed?.lon === "number") return parsed;
    }
  } catch {
    // ignore unreadable cache
  }

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`
  );
  const arr = await res.json();
  if (!Array.isArray(arr) || !arr[0]) return null;
  const coords: LatLon = { lat: parseFloat(arr[0].lat), lon: parseFloat(arr[0].lon) };
  if (!Number.isFinite(coords.lat) || !Number.isFinite(coords.lon)) return null;
  try {
    localStorage.setItem(cacheKey, JSON.stringify(coords));
  } catch {
    // ignore quota errors
  }
  return coords;
};
