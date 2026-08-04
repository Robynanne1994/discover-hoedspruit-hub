// Slippy-map (Web Mercator) helpers for the dependency-free tile map used on
// the Location sections of listing and event pages.

export const TILE_SIZE = 256;

export type LatLon = { lat: number; lon: number };

/**
 * Hoedspruit town centre. Kept in step with the `locationBias` centre the
 * Google Places sync uses (supabase/functions/refresh-google-ratings), so the
 * map and the place matching agree on where "town" is. The previous value
 * (lon 31.0) sat 4.7km east of here, in open bushveld — a listing that fell
 * back to it rendered a blank green tile with no roads on it.
 */
export const HOEDSPRUIT_CENTRE: LatLon = { lat: -24.3548, lon: 30.954 };

/**
 * A generous box around Hoedspruit and the reserves it serves. Geocoding is
 * biased towards it and results are checked against it afterwards, so a
 * listing can never be pinned to a same-named street elsewhere in the country.
 */
export const HOEDSPRUIT_BOUNDS = {
  minLat: -25.1,
  maxLat: -23.7,
  minLon: 30.3,
  maxLon: 31.7,
};

/** True when a point is close enough to town to plausibly be a listing. */
export const isNearHoedspruit = ({ lat, lon }: LatLon): boolean =>
  lat >= HOEDSPRUIT_BOUNDS.minLat &&
  lat <= HOEDSPRUIT_BOUNDS.maxLat &&
  lon >= HOEDSPRUIT_BOUNDS.minLon &&
  lon <= HOEDSPRUIT_BOUNDS.maxLon;

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

const asLatLon = (lat: string, lon: string): LatLon | null => {
  const coords = { lat: parseFloat(lat), lon: parseFloat(lon) };
  if (!Number.isFinite(coords.lat) || !Number.isFinite(coords.lon)) return null;
  if (Math.abs(coords.lat) > 90 || Math.abs(coords.lon) > 180) return null;
  // 0,0 is the Atlantic — always a placeholder rather than a real pin.
  if (coords.lat === 0 && coords.lon === 0) return null;
  return coords;
};

/**
 * Pull coordinates straight out of a Google Maps share link, if present.
 *
 * `!3d!4d` is tried before `@`: on a /place/ URL the `@` pair is the camera
 * position (which Google offsets and rounds), while `!3d!4d` is the pin itself.
 * Short maps.app.goo.gl links carry no coordinates at all and return null —
 * those fall through to geocoding.
 */
export const parseCoordsFromMapLink = (url: string): LatLon | null => {
  const patterns: RegExp[] = [
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,
    /[?&](?:query|q|ll|sll|daddr|saddr|destination|center)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /[?&]mlat=(-?\d+(?:\.\d+)?)&mlon=(-?\d+(?:\.\d+)?)/,
    /\/maps\/place\/(-?\d+\.\d+),(-?\d+\.\d+)/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) {
      const coords = asLatLon(m[1], m[2]);
      if (coords) return coords;
    }
  }
  return null;
};

/**
 * Query variants to try for a listing, most specific first.
 *
 * Listing `location` values are written for humans ("Railway Station, 1 Python
 * Street"), and Nominatim has never heard of the venue half. Dropping down to
 * the street address, then to the street on its own, turns a miss into a pin
 * a block or two out rather than a fallback to the middle of town.
 */
export const geocodeQueries = (location?: string | null, title?: string | null): string[] => {
  const queries: string[] = [];
  const add = (value: string) => {
    const trimmed = value.trim().replace(/\s*,\s*/g, ", ").replace(/^,|,$/g, "").trim();
    if (!trimmed) return;
    const full = /hoedspruit/i.test(trimmed)
      ? `${trimmed}, South Africa`
      : `${trimmed}, Hoedspruit, South Africa`;
    if (!queries.includes(full)) queries.push(full);
  };

  const loc = location?.trim();
  if (loc) {
    add(loc);
    const parts = loc.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 1) {
      // Prefer the fragment that looks like a street address.
      const street = parts.find((p) => /\d/.test(p)) ?? parts[parts.length - 1];
      add(street);
      // "1 Python Street" -> "Python Street": the street exists even when the
      // individual house number is not mapped.
      add(street.replace(/^\s*\d+[a-z]?\s+/i, ""));
    } else if (/^\s*\d+[a-z]?\s+/i.test(loc)) {
      add(loc.replace(/^\s*\d+[a-z]?\s+/i, ""));
    }
  }
  if (title?.trim()) add(title.trim());
  return queries;
};

const CACHE_PREFIX = "hh-geocode:";
/** Misses are re-tried after a week; a hit is a street address and keeps. */
const MISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type CacheEntry = { lat: number; lon: number } | { miss: true; ts: number };

const readCache = (key: string): LatLon | "miss" | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed: CacheEntry = JSON.parse(raw);
    if ("miss" in parsed) {
      if (Date.now() - parsed.ts < MISS_TTL_MS) return "miss";
      localStorage.removeItem(key);
      return null;
    }
    if (typeof parsed.lat === "number" && typeof parsed.lon === "number") {
      return { lat: parsed.lat, lon: parsed.lon };
    }
  } catch {
    // ignore unreadable cache
  }
  return null;
};

const writeCache = (key: string, value: CacheEntry) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
};

/**
 * Free-text geocode via Nominatim, biased and then clamped to the Hoedspruit
 * area, and cached in localStorage so repeat visits to a listing don't hit the
 * service again (their usage policy asks for caching).
 */
export const geocode = async (query: string): Promise<LatLon | null> => {
  const cacheKey = `${CACHE_PREFIX}${query.toLowerCase()}`;
  const cached = readCache(cacheKey);
  if (cached === "miss") return null;
  if (cached) return cached;

  const { minLon, maxLat, maxLon, minLat } = HOEDSPRUIT_BOUNDS;
  const url =
    "https://nominatim.openstreetmap.org/search" +
    `?format=json&limit=1&countrycodes=za` +
    `&viewbox=${minLon},${maxLat},${maxLon},${minLat}&bounded=1` +
    `&q=${encodeURIComponent(query)}`;

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Nominatim returned ${res.status}`);
  const arr = await res.json();
  const hit = Array.isArray(arr) ? arr[0] : null;
  const coords = hit ? asLatLon(hit.lat, hit.lon) : null;

  // `bounded=1` should already guarantee this; the check makes it certain that
  // a listing never pins to a same-named street on the other side of the country.
  if (!coords || !isNearHoedspruit(coords)) {
    writeCache(cacheKey, { miss: true, ts: Date.now() });
    return null;
  }
  writeCache(cacheKey, coords);
  return coords;
};

/**
 * The location-bearing columns of a listing or event row. Declared here so the
 * pages can narrow a row to them without reaching for `any` — the generated
 * Supabase types pick the coordinates up on their next regeneration.
 */
export type MappableRow = {
  latitude?: number | null;
  longitude?: number | null;
  google_maps_link?: string | null;
  location?: string | null;
  title?: string | null;
};

export type ResolvedLocation = {
  coords: LatLon;
  /** False when we fell back to the town centre and the pin is indicative only. */
  precise: boolean;
};

/**
 * Everything the Location tab knows about where a listing or event is, in
 * order of trust: coordinates saved on the row, coordinates embedded in its
 * Google Maps link, then a geocode of the written address. Only when all three
 * come up empty does it fall back to the middle of town, flagged imprecise so
 * the map can zoom out instead of pretending to street-level accuracy.
 */
export const resolveLocation = async (input: {
  latitude?: number | null;
  longitude?: number | null;
  googleMapsLink?: string | null;
  location?: string | null;
  title?: string | null;
}): Promise<ResolvedLocation> => {
  if (typeof input.latitude === "number" && typeof input.longitude === "number") {
    const saved = asLatLon(String(input.latitude), String(input.longitude));
    if (saved) return { coords: saved, precise: true };
  }

  if (input.googleMapsLink) {
    const parsed = parseCoordsFromMapLink(input.googleMapsLink);
    if (parsed) return { coords: parsed, precise: true };
  }

  for (const query of geocodeQueries(input.location, input.title)) {
    try {
      const coords = await geocode(query);
      if (coords) return { coords, precise: true };
    } catch {
      // Network or rate-limit trouble: stop asking and use the fallback.
      break;
    }
  }

  return { coords: HOEDSPRUIT_CENTRE, precise: false };
};
