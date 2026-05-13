import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User as UserIcon } from "lucide-react";
import { Search, Sun, Moon, Cloud, CloudSun, CloudRain, CloudDrizzle, CloudSnow, CloudLightning, CloudFog, Bell, MapPin, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import GlobalMenu, { GlobalMenuTrigger } from "@/components/GlobalMenu";
import NotificationsBell from "@/components/NotificationsDropdown";

const SANS = "'Pragmatica', 'Inter', 'Helvetica Neue', Helvetica, sans-serif";
const DISPLAY = "'Helvetica Neue', Helvetica, 'Pragmatica', sans-serif";
const SERIF = "'Playfair Display', 'Helvetica Neue', serif";

type WeatherIconKind = "sun" | "moon" | "cloud-sun" | "cloud-moon" | "cloud" | "fog" | "drizzle" | "rain" | "snow" | "thunder";

const getWeatherIconKind = (code: number | null, isNight: boolean): WeatherIconKind => {
  if (code === null) return isNight ? "moon" : "sun";
  if (code === 0) return isNight ? "moon" : "sun";
  if (code === 1 || code === 2) return isNight ? "cloud-moon" : "cloud-sun";
  if (code === 3) return "cloud";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return "snow";
  if (code >= 95 && code <= 99) return "thunder";
  return isNight ? "moon" : "sun";
};

const WeatherIcon = ({ kind }: { kind: WeatherIconKind }) => {
  const props = { size: 22, strokeWidth: 1.6 } as const;
  switch (kind) {
    case "sun":
      return <Sun {...props} color="#9B5A3C" />;
    case "moon":
      return <Moon {...props} color="#9B5A3C" />;
    case "cloud-moon":
      return <Cloud {...props} color="#9B5A3C" />;
    case "cloud-sun":
      return <CloudSun {...props} color="#9B5A3C" />;
    case "cloud":
      return <Cloud {...props} color="#9B5A3C" />;
    case "fog":
      return <CloudFog {...props} color="#9B5A3C" />;
    case "drizzle":
      return <CloudDrizzle {...props} color="#9B5A3C" />;
    case "rain":
      return <CloudRain {...props} color="#9B5A3C" />;
    case "snow":
      return <CloudSnow {...props} color="#9B5A3C" />;
    case "thunder":
      return <CloudLightning {...props} color="#9B5A3C" />;
  }
};

const HomeMasthead = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [temp, setTemp] = useState<number | null>(null);
  const [weatherCode, setWeatherCode] = useState<number | null>(null);
  const [isNight, setIsNight] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  const q = search.trim();
  const { data: searchResults } = useQuery({
    queryKey: ["home-search", q],
    queryFn: async () => {
      if (q.length < 2) return [];
      const { data, error } = await supabase
        .from("listings")
        .select("id, title, image_url, location")
        .ilike("title", `%${q}%`)
        .limit(8);
      if (error) throw error;
      return data || [];
    },
    enabled: q.length >= 2,
  });

  const { data: profile } = useQuery({
    queryKey: ["home-masthead-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("display_name, username, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const titleCase = (s?: string | null) =>
    (s || "").split(" ").filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  const greetingName = titleCase(profile?.display_name) || titleCase(profile?.username) || titleCase(user?.user_metadata?.first_name as string | undefined) || "there";

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    let cancelled = false;
    const load = async () => {
      const { count } = await supabase
        .from("business_notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      if (cancelled) return;
      setUnreadCount(count ?? 0);
    };
    load();
    const channel = supabase
      .channel("home-biz-notifs")
      .on("postgres_changes", { event: "*", schema: "public", table: "business_notifications", filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=-24.35&longitude=30.95&current=temperature_2m,weather_code,is_day&timezone=Africa%2FJohannesburg"
    )
      .then((r) => r.json())
      .then((d) => {
        if (d?.current) {
          setTemp(Math.round(d.current.temperature_2m));
          if (typeof d.current.weather_code === "number") setWeatherCode(d.current.weather_code);
          if (typeof d.current.is_day === "number") setIsNight(d.current.is_day === 0);
        }
      })
      .catch(() => {});
  }, []);

  const iconBtn: React.CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: 999,
    background: "#EEE8DA",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    cursor: "pointer",
    flexShrink: 0,
  };

  return (
    <div style={{ paddingTop: 32 }}>
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "0 24px" }}>
        {user && <NotificationsBell />}
        <GlobalMenuTrigger open={menuOpen} onClick={() => setMenuOpen((v) => !v)} />
        <GlobalMenu open={menuOpen} onOpenChange={setMenuOpen} />
      </div>

      {/* Masthead */}
      <div style={{ padding: "24px 24px 0" }}>
        <p
          style={{
            margin: 0,
            marginBottom: 14,
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: 400,
            fontSize: 12,
            lineHeight: 1,
            letterSpacing: "2.4px",
            color: "rgba(238, 232, 218, 0.7)",
            textTransform: "uppercase",
          }}
        >
          Your Lowveld Local
        </p>
        <h1
          style={{
            margin: 0,
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: 64,
            lineHeight: 0.92,
            letterSpacing: "-2px",
            color: "#EEE8DA",
          }}
        >
          <span style={{ fontWeight: 400, fontStyle: "normal" }}>Hello</span>
          <br />
          <span style={{ fontWeight: 300, fontStyle: "italic" }}>Hoedspruit</span>
        </h1>
      </div>

      {/* Search + weather */}
      <div style={{ padding: "28px 24px 0", display: "flex", gap: 8 }}>
        <div ref={searchWrapRef} style={{ flex: 1, position: "relative", minWidth: 0 }}>
          <div
            style={{
              height: 52,
              background: "rgba(238, 232, 218, 0.92)",
              borderRadius: 999,
              padding: "0 18px 0 22px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Search size={18} color="#6B6A5E" strokeWidth={1.6} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search the 'Hoed..."
              style={{
                flex: 1,
                minWidth: 0,
                background: "transparent",
                border: "none",
                outline: "none",
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontSize: 14,
                color: "#2A2A24",
              }}
              className="placeholder:text-[#6B6A5E]"
            />
            {search && (
              <button
                onClick={() => { setSearch(""); setSearchOpen(false); }}
                aria-label="Clear search"
                style={{ background: "transparent", border: "none", padding: 0, display: "flex", cursor: "pointer" }}
              >
                <X size={16} color="#6B6A5E" strokeWidth={1.8} />
              </button>
            )}
          </div>

          {searchOpen && q.length >= 2 && (
            <div
              style={{
                position: "absolute",
                top: 60,
                left: 0,
                right: 0,
                background: "#EEE8DA",
                borderRadius: 18,
                padding: 8,
                boxShadow: "0 12px 32px rgba(0,0,0,0.2)",
                zIndex: 50,
                maxHeight: 360,
                overflowY: "auto",
              }}
            >
              {(searchResults?.length ?? 0) === 0 ? (
                <div style={{ padding: "16px 12px", fontSize: 13, color: "#6B6A5E", textAlign: "center" }}>
                  No matches found
                </div>
              ) : (
                searchResults!.map((listing) => (
                  <Link
                    key={listing.id}
                    to={`/listing/${listing.id}`}
                    onClick={() => { setSearchOpen(false); setSearch(""); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: 8,
                      borderRadius: 12,
                      textDecoration: "none",
                    }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 10, overflow: "hidden", background: "#e6e0d2", flexShrink: 0 }}>
                      {listing.image_url && (
                        <img src={listing.image_url} alt={listing.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, color: "#2A2A24", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {listing.title}
                      </p>
                      {listing.location && (
                        <p style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#6B6A5E", margin: "2px 0 0" }}>
                          <MapPin size={11} strokeWidth={1.8} />
                          {listing.location}
                        </p>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
        <div
          style={{
            height: 52,
            background: "rgba(238, 232, 218, 0.92)",
            borderRadius: 999,
            padding: "0 18px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          <WeatherIcon kind={getWeatherIconKind(weatherCode, isNight)} />
          <span style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 15, color: "#2A2A24" }}>
            {temp !== null ? `${temp}°` : "—"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default HomeMasthead;
