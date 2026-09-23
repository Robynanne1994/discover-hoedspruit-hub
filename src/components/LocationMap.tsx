import { useEffect, useRef, useState } from "react";
import type { LatLon } from "@/lib/tileMap";

const PROJECT_ID = import.meta.env["VITE_SUPABASE_PROJECT_ID"];
const MAP_ENDPOINT = `https://${PROJECT_ID}.supabase.co/functions/v1/static-map`;

type Props = {
  coords: LatLon | null;
  /** Opening this in a new tab is the map's tap action. */
  href?: string;
  /** Accessible name, e.g. the listing title. */
  label?: string;
  /** False when `coords` is only the town centre fallback. */
  precise?: boolean;
  zoom?: number;
  height?: number;
  pinColor?: string;
};

/** Street level for a real address; town level for the fallback. */
const PRECISE_ZOOM = 15;
const APPROXIMATE_ZOOM = 13;
/** Google Static Maps caps size at 640 per side (before scale=2). */
const MAX_SIDE = 640;

/**
 * A static Google map served through our own backend so the API key never
 * ships in the app. Tapping it opens directions rather than panning.
 */
const LocationMap = ({
  coords,
  href,
  label,
  precise = true,
  zoom,
  height = 220,
  pinColor = "#715a3d",
}: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const level = zoom ?? (precise ? PRECISE_ZOOM : APPROXIMATE_ZOOM);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(Math.round(el.getBoundingClientRect().width));
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Bucket width to 20px steps so small resizes reuse the cached image.
  const reqW = Math.min(MAX_SIDE, Math.max(50, Math.ceil(width / 20) * 20));
  const reqH = Math.min(MAX_SIDE, Math.max(50, Math.round(height)));
  const src =
    coords && width
      ? `${MAP_ENDPOINT}?lat=${coords.lat.toFixed(5)}&lon=${coords.lon.toFixed(5)}&zoom=${level}&width=${reqW}&height=${reqH}`
      : null;

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [src]);

  const unreachable = !!src && failed;

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
      {src && !failed && (
        <img
          src={src}
          alt=""
          aria-hidden
          draggable={false}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: reqW,
            height: reqH,
            transform: "translate(-50%, -50%)",
            opacity: loaded ? 1 : 0,
            transition: "opacity 250ms ease-out",
            userSelect: "none",
          }}
        />
      )}

      {unreachable && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 24px",
            textAlign: "center",
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize: 13,
            color: "rgba(43,36,32,0.55)",
          }}
        >
          Map unavailable offline. Tap for directions.
        </div>
      )}

      {coords && !unreachable && (
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

      {!unreachable && (
        <span
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
            pointerEvents: "none",
          }}
        >
          © Google
        </span>
      )}
    </div>
  );
};

export default LocationMap;
