import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Search,
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";

const HN = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const INK = "#1A1A1A";
const MUTED = "#6B6A5E";
const BORDER = "1px solid rgba(0,0,0,0.06)";

const srOnly: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap",
  border: 0,
};

const iconForCode = (code: number) => {
  if (code === 0) return Sun;
  if (code === 1 || code === 2) return CloudSun;
  if (code === 3) return Cloud;
  if (code === 45 || code === 48) return CloudFog;
  if (code >= 51 && code <= 57) return CloudDrizzle;
  if (code >= 61 && code <= 67) return CloudRain;
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return CloudSnow;
  if (code >= 80 && code <= 82) return CloudRain;
  if (code >= 95 && code <= 99) return CloudLightning;
  return null;
};

const WeatherChip = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["home-weather-chip"],
    queryFn: async () => {
      const res = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=-24.3547&longitude=30.9506&current=temperature_2m,weather_code"
      );
      if (!res.ok) throw new Error("weather");
      return res.json() as Promise<{ current: { temperature_2m: number; weather_code: number } }>;
    },
    staleTime: 15 * 60 * 1000,
  });

  if (isLoading || isError || !data?.current) return null;
  const Icon = iconForCode(data.current.weather_code);
  if (!Icon) return null;

  return (
    <div
      style={{
        height: 48,
        borderRadius: 16,
        background: "#FFFFFF",
        border: BORDER,
        padding: "0 12px",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        flexShrink: 0,
      }}
    >
      <Icon size={20} color={INK} strokeWidth={1.5} />
      <span style={{ fontFamily: HN, fontSize: 15, color: INK }}>
        {Math.round(data.current.temperature_2m)}°
      </span>
    </div>
  );
};

const HomeMasthead = () => {
  const { user } = useAuth();
  const unread = useUnreadNotifications();

  return (
    <div style={{ padding: "56px 20px 0" }}>
      <h1 style={srOnly}>Hello Hoedspruit</h1>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <WeatherChip />

        <Link
          to="/search"
          aria-label="Search Hoedspruit"
          style={{
            flex: 1,
            minWidth: 0,
            height: 48,
            borderRadius: 16,
            background: "#FFFFFF",
            border: BORDER,
            padding: "0 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            transition: "transform 150ms ease-out",
          }}
          onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
          onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <Search size={18} color={MUTED} strokeWidth={1.8} />
          <span
            style={{
              fontFamily: HN,
              fontSize: 16,
              color: MUTED,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            Search Hoedspruit
          </span>
        </Link>

        <Link
          to="/search"
          aria-label="Search"
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: BORDER,
            flexShrink: 0,
          }}
        >
          <Search size={18} color={INK} strokeWidth={1.8} />
        </Link>
        {user && (
          <Link
            to="/my-notifications"
            aria-label="Notifications"
            style={{
              position: "relative",
              width: 40,
              height: 40,
              borderRadius: 999,
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: BORDER,
              flexShrink: 0,
            }}
          >
            <Bell size={18} color={INK} strokeWidth={1.8} />
            {unread > 0 && (
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  top: 2,
                  right: 2,
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: "#E0322B",
                  border: "2px solid #ffffff",
                }}
              />
            )}
          </Link>
        )}
      </div>
    </div>
  );
};

export default HomeMasthead;
