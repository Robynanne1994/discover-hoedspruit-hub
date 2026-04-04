import { useState, useEffect, useRef } from "react";
import { Search, Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, Cloudy, MapPin, CalendarDays, FolderOpen, Loader2 } from "lucide-react";
import { Calendar, UtensilsCrossed, Compass, Home, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const categories = [
  { label: "Events", icon: Calendar, href: "/events" },
  { label: "Restaurants", icon: UtensilsCrossed, href: "/categories" },
  { label: "Activities", icon: Compass, href: "/categories" },
  { label: "Lodges", icon: Home, href: "/categories" },
  { label: "Specials", icon: Sparkles, href: "/categories" },
];

const getWeatherIcon = (code: number) => {
  if (code <= 1) return Sun;
  if (code <= 3) return Cloudy;
  if (code <= 48) return Cloud;
  if (code <= 57) return CloudDrizzle;
  if (code <= 67) return CloudRain;
  if (code <= 77) return CloudSnow;
  if (code <= 82) return CloudRain;
  if (code <= 99) return CloudLightning;
  return Sun;
};

const HomeHero = () => {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [temp, setTemp] = useState<number | null>(null);
  const [weatherCode, setWeatherCode] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=-24.35&longitude=30.95&current=temperature_2m,weather_code&timezone=Africa%2FJohannesburg"
    )
      .then((r) => r.json())
      .then((data) => {
        if (data?.current) {
          setTemp(Math.round(data.current.temperature_2m));
          setWeatherCode(data.current.weather_code ?? 0);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { data: results, isFetching } = useQuery({
    queryKey: ["hero-search", query],
    queryFn: async () => {
      if (!query.trim()) return { listings: [], categories: [], events: [] };
      const term = `%${query.trim()}%`;
      const [listingsRes, categoriesRes, eventsRes] = await Promise.all([
        supabase.from("listings").select("id, title, location").ilike("title", term).limit(5),
        supabase.from("categories").select("id, title").ilike("title", term).limit(3),
        supabase.from("events").select("id, title, location").ilike("title", term).limit(3),
      ]);
      return {
        listings: listingsRes.data ?? [],
        categories: categoriesRes.data ?? [],
        events: eventsRes.data ?? [],
      };
    },
    enabled: query.trim().length > 0,
    staleTime: 1000,
  });

  const hasResults =
    (results?.listings?.length ?? 0) + (results?.categories?.length ?? 0) + (results?.events?.length ?? 0) > 0;

  const goTo = (path: string) => {
    setFocused(false);
    setQuery("");
    navigate(path);
  };

  const showDropdown = focused && query.trim().length > 0;

  return (
    <>
      {/* Hero area */}
      <div style={{ background: "#f5f3ef", padding: "48px 24px 28px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(18,18,20,0.3)", textTransform: "uppercase", letterSpacing: 3, marginBottom: 14 }}>
          WELCOME TO
        </div>
        <h1 style={{ fontWeight: 900, fontSize: 44, lineHeight: 0.95, letterSpacing: -0.5, color: "#121214", textTransform: "uppercase", marginBottom: 12 }}>
          HELLO<br />HOEDSPRUIT
        </h1>
        <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", fontSize: 14, color: "rgba(18,18,20,0.4)", letterSpacing: 0.2, lineHeight: 1.4, marginBottom: 20 }}>
          Your local guide to the bushveld
        </p>

        {/* Search bar */}
        <div ref={containerRef}>
          <div style={{
            background: "#ffffff",
            border: "1px solid rgba(18,18,20,0.1)",
            borderRadius: 12,
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <Search size={16} strokeWidth={2} color="rgba(18,18,20,0.3)" style={{ flexShrink: 0 }} />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              placeholder="Search places, events, activities..."
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 13,
                color: "#121214",
                letterSpacing: 0.2,
              }}
            />
            {isFetching && <Loader2 size={16} className="animate-spin" color="rgba(18,18,20,0.3)" style={{ flexShrink: 0 }} />}
            <div style={{ borderLeft: "1px solid rgba(18,18,20,0.08)", paddingLeft: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(18,18,20,0.45)" }}>
                {temp !== null ? `${temp}°C` : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Category pills */}
      <div style={{ paddingTop: 18, paddingLeft: 24, overflowX: "auto" }} className="scrollbar-hide">
        <div style={{ display: "flex", gap: 10 }}>
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.label}
                to={cat.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 16px",
                  background: "rgba(18,18,20,0.04)",
                  border: "1px solid rgba(18,18,20,0.08)",
                  borderRadius: 10,
                  whiteSpace: "nowrap",
                  textDecoration: "none",
                }}
              >
                <Icon size={15} strokeWidth={1.5} color="rgba(18,18,20,0.4)" />
                <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(18,18,20,0.6)" }}>{cat.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Search dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="fixed left-0 right-0 z-[100] px-5"
          style={{ top: containerRef.current ? containerRef.current.getBoundingClientRect().bottom + 8 : 200 }}
        >
          <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid rgba(18,18,20,0.08)", overflow: "hidden", maxHeight: "60vh", overflowY: "auto", boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}>
            {!isFetching && !hasResults && (
              <div style={{ padding: "32px 16px", textAlign: "center", fontSize: 13, color: "rgba(18,18,20,0.4)" }}>
                No results for "{query}"
              </div>
            )}

            {results?.categories && results.categories.length > 0 && (
              <div style={{ padding: 8 }}>
                <p style={{ padding: "6px 8px", fontSize: 10, fontWeight: 600, color: "rgba(18,18,20,0.35)", textTransform: "uppercase", letterSpacing: 2 }}>Categories</p>
                {results.categories.map((cat) => (
                  <button key={cat.id} onClick={() => goTo(`/category/${cat.id}`)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer" }}>
                    <FolderOpen size={16} color="rgba(18,18,20,0.3)" />
                    <span style={{ fontSize: 13, color: "#121214" }}>{cat.title}</span>
                  </button>
                ))}
              </div>
            )}

            {results?.listings && results.listings.length > 0 && (
              <div style={{ padding: 8 }}>
                <p style={{ padding: "6px 8px", fontSize: 10, fontWeight: 600, color: "rgba(18,18,20,0.35)", textTransform: "uppercase", letterSpacing: 2 }}>Listings</p>
                {results.listings.map((listing) => (
                  <button key={listing.id} onClick={() => goTo(`/listing/${listing.id}`)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer" }}>
                    <MapPin size={16} color="rgba(18,18,20,0.3)" />
                    <div>
                      <span style={{ fontSize: 13, color: "#121214", display: "block" }}>{listing.title}</span>
                      {listing.location && <span style={{ fontSize: 11, color: "rgba(18,18,20,0.35)", display: "block" }}>{listing.location}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {results?.events && results.events.length > 0 && (
              <div style={{ padding: 8 }}>
                <p style={{ padding: "6px 8px", fontSize: 10, fontWeight: 600, color: "rgba(18,18,20,0.35)", textTransform: "uppercase", letterSpacing: 2 }}>Events</p>
                {results.events.map((event) => (
                  <button key={event.id} onClick={() => goTo(`/events`)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer" }}>
                    <CalendarDays size={16} color="rgba(18,18,20,0.3)" />
                    <div>
                      <span style={{ fontSize: 13, color: "#121214", display: "block" }}>{event.title}</span>
                      {event.location && <span style={{ fontSize: 11, color: "rgba(18,18,20,0.35)", display: "block" }}>{event.location}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default HomeHero;
