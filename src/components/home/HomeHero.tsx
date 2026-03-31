import { useState, useEffect, useRef } from "react";
import { Search, Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, Cloudy, MapPin, CalendarDays, FolderOpen, Loader2 } from "lucide-react";
import { Calendar, UtensilsCrossed, Compass, Home, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import heroFallback from "@/assets/hero-homepage.jpg";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
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

  const WeatherIcon = getWeatherIcon(weatherCode);

  return (
    <>
      <section className="relative pb-5">
        <div className="relative h-[220px] overflow-hidden">
          <img
            src={heroBg}
            alt="Hoedspruit bushveld sunrise"
            className="w-full h-full object-cover"
            width={1080}
            height={720}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, hsla(35, 40%, 85%, 0.1), hsla(35, 40%, 92%, 0.3))",
            }}
          />
          <div className="absolute inset-0 flex flex-col items-center pt-10 pb-4 px-5">
            <p
              className="text-[22px] font-bold text-white leading-[1.1] text-center drop-shadow-sm"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              <span className="italic">Hello</span>
              <br />
              Hoedspruit
            </p>

            <div className="w-full mt-3">
              <p className="text-center text-[13px] font-medium mb-2.5 text-white/90 drop-shadow-sm">
                Discover what's happening in town today.
              </p>
              <div ref={containerRef} className="relative search-container">
                <div className="flex items-center w-full bg-white rounded-full shadow-sm border border-border/60 px-3.5 py-2.5 gap-2.5">
                  <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setFocused(true)}
                    placeholder="Search events, food, stays, activities..."
                    className="text-xs flex-1 font-normal text-left bg-transparent outline-none placeholder:text-muted-foreground text-foreground placeholder:italic"
                  />
                  {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground flex-shrink-0" />}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <WeatherIcon className="h-3.5 w-3.5 text-accent" />
                    <span className="text-[11px] font-semibold" style={{ color: "#2F241C" }}>
                      {temp !== null ? `${temp}°C` : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="-mt-4 relative z-10">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pl-4 pr-8">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.label}
                  to={cat.href}
                  className="flex items-center gap-1.5 px-3 py-2 bg-card rounded-full border shadow-sm whitespace-nowrap transition-all active:scale-95 border-primary-hover"
                >
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium text-foreground">{cat.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {showDropdown && (
        <div
          ref={dropdownRef}
          className="fixed left-0 right-0 z-[100] px-5"
          style={{ top: containerRef.current ? containerRef.current.getBoundingClientRect().bottom + 6 : 200 }}
        >
          <div className="bg-card rounded-xl shadow-lg border border-border/60 overflow-hidden max-h-[60vh] overflow-y-auto">
            {!isFetching && !hasResults && (
              <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                No results for "{query}"
              </div>
            )}

            {results?.categories && results.categories.length > 0 && (
              <div className="p-1.5">
                <p className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Categories</p>
                {results.categories.map((cat) => (
                  <button key={cat.id} onClick={() => goTo(`/category/${cat.id}`)} className="flex items-center gap-2.5 w-full text-left px-2.5 py-2 rounded-lg hover:bg-accent/50 transition-colors">
                    <FolderOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-xs text-foreground">{cat.title}</span>
                  </button>
                ))}
              </div>
            )}

            {results?.listings && results.listings.length > 0 && (
              <div className="p-1.5">
                <p className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Listings</p>
                {results.listings.map((listing) => (
                  <button key={listing.id} onClick={() => goTo(`/listing/${listing.id}`)} className="flex items-center gap-2.5 w-full text-left px-2.5 py-2 rounded-lg hover:bg-accent/50 transition-colors">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs text-foreground block truncate">{listing.title}</span>
                      {listing.location && <span className="text-[10px] text-muted-foreground truncate block">{listing.location}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {results?.events && results.events.length > 0 && (
              <div className="p-1.5">
                <p className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Events</p>
                {results.events.map((event) => (
                  <button key={event.id} onClick={() => goTo(`/events`)} className="flex items-center gap-2.5 w-full text-left px-2.5 py-2 rounded-lg hover:bg-accent/50 transition-colors">
                    <CalendarDays className="h-3.5 w-3.5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs text-foreground block truncate">{event.title}</span>
                      {event.location && <span className="text-[10px] text-muted-foreground truncate block">{event.location}</span>}
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
