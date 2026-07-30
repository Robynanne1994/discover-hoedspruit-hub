import { useEffect, useMemo, useRef, useState } from "react";
import { buildTileGrid, TILE_SIZE, type LatLon } from "@/lib/tileMap";

// CARTO Voyager raster basemap: OpenStreetMap data, no API key, no account.
// Swap this single line to change the map's look (e.g. "light_all" for the
// muted grey Positron style).
const TILE_STYLE = "voyager";
const SUBDOMAINS = ["a", "b", "c", "d"];

const tileUrl = (z: number, x: number, y: number, retina: boolean) =>
  `https://${SUBDOMAINS[Math.abs(x + y) % SUBDOMAINS.length]}.basemaps.cartocdn.com/rastertiles/${TILE_STYLE}/${z}/${x}/${y}${retina ? "@2x" : ""}.png`;

/** Straight OpenStreetMap tiles, used only if a CARTO tile fails to load. */
const fallbackTileUrl = (z: number, x: number, y: number) =>
  `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;

type Props = {
  coords: LatLon | null;
  /** Opening this in a new tab is the map's tap action. */
  href?: string;
  /** Accessible name, e.g. the listing title. */
  label?: string;
  zoom?: number;
  height?: number;
  pinColor?: string;
};

/**
 * A real, street-level map rendered from raster tiles — no SDK, no API key and
 * none of the chrome the OpenStreetMap iframe embed forces on us. It is
 * deliberately static: tapping it opens directions rather than panning, so it
 * never traps the page scroll on mobile.
 */
const LocationMap = ({
  coords,
  href,
  label,
  zoom = 16,
  height = 220,
  pinColor = "#715a3d",
}: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const retina = typeof window !== "undefined" && window.devicePixelRatio > 1.2;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(el.getBoundingClientRect().width);
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const tiles = useMemo(
    () =>
      coords && width
        ? buildTileGrid({ lat: coords.lat, lon: coords.lon, zoom, width, height })
        : [],
    [coords, width, height, zoom]
  );

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        height,
        overflow: "hidden",
        background: "linear-gradient(135deg, #E4DECA 0%, #D3CCB5 100%)",
        isolation: "isolate",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          // Warms the tiles a touch so they sit with the ivory palette and let
          // the pin carry the colour.
          filter: "saturate(0.82) sepia(0.1) brightness(1.02)",
        }}
      >
        {tiles.map((t) => (
          <img
            key={t.key}
            src={tileUrl(t.z, t.x, t.y, retina)}
            alt=""
            draggable={false}
            loading="lazy"
            decoding="async"
            style={{
              position: "absolute",
              left: t.left,
              top: t.top,
              width: TILE_SIZE,
              height: TILE_SIZE,
              opacity: 0,
              transition: "opacity 250ms ease-out",
              userSelect: "none",
            }}
            onLoad={(e) => (e.currentTarget.style.opacity = "1")}
            onError={(e) => {
              const img = e.currentTarget;
              if (img.dataset.fallback) return;
              img.dataset.fallback = "1";
              img.src = fallbackTileUrl(t.z, t.x, t.y);
            }}
          />
        ))}
      </div>

      {coords && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: `${pinColor}1F`,
            }}
          />
          <svg
            width={30}
            height={38}
            viewBox="0 0 30 38"
            fill="none"
            style={{ position: "absolute", left: "50%", bottom: 0, transform: "translateX(-50%)" }}
          >
            <ellipse cx="15" cy="35.5" rx="5" ry="2" fill="rgba(26,26,26,0.22)" />
            <path
              d="M15 1.5c-6.35 0-11.5 5.02-11.5 11.2 0 8.1 9.7 19 11.5 21 1.8-2 11.5-12.9 11.5-21 0-6.18-5.15-11.2-11.5-11.2Z"
              fill={pinColor}
              stroke="#FFFFFF"
              strokeWidth="2.5"
            />
            <circle cx="15" cy="12.7" r="4.1" fill="#FFFFFF" />
          </svg>
        </div>
      )}

      {href && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label ? `Open ${label} in maps` : "Open in maps"}
          style={{ position: "absolute", inset: 0, zIndex: 1 }}
        />
      )}

      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          zIndex: 2,
          padding: "2px 6px",
          borderTopLeftRadius: 8,
          background: "rgba(255,255,255,0.74)",
          color: "rgba(43,36,32,0.6)",
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontSize: 9,
          lineHeight: "12px",
          letterSpacing: "0.02em",
          textDecoration: "none",
        }}
      >
        © OpenStreetMap, © CARTO
      </a>
    </div>
  );
};

export default LocationMap;
