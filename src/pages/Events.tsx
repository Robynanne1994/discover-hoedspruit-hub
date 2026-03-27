import { Search, MapPin, ChevronRight, Calendar } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-homepage.jpg";
import { parse, isToday, isBefore, startOfToday, endOfWeek, isWithinInterval, startOfWeek, addDays } from "date-fns";

type FilterType = "all" | "today" | "this-week" | "upcoming";

function parseDateText(raw: string): Date | null {
  if (!raw) return null;
  const clean = raw.replace(/<[^>]*>/g, "").trim();
  const rangeMatch = clean.match(/(\d{1,2})\s*(?:to|-)\s*\d{1,2}\s+(\w+)\s+(\d{4})/i);
  if (rangeMatch) {
    const parsed = parse(`${rangeMatch[1]} ${rangeMatch[2]} ${rangeMatch[3]}`, "d MMMM yyyy", new Date());
    if (!isNaN(parsed.getTime())) return parsed;
  }
  const formats = ["d MMMM yyyy", "MMMM d, yyyy", "yyyy-MM-dd", "d/MM/yyyy"];
  for (const fmt of formats) {
    const d = parse(clean, fmt, new Date());
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function formatEventDate(raw: string): string {
  const d = parseDateText(raw);
  if (!d) return raw;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

function formatTime(time: string | null): string {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  if (isNaN(hour)) return time;
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${String(m).padStart(2, "0")} ${ampm}`;
}

const filters: { label: string; value: FilterType }[] = [
  { label: "All", value: "all" },
  { label: "Today", value: "today" },
  { label: "This Week", value: "this-week" },
  { label: "Upcoming", value: "upcoming" },
];

const Events = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");

  const { data: events, isLoading } = useQuery({
    queryKey: ["events-page"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const sortedEvents = useMemo(() => {
    if (!events) return [];
    const now = new Date();
    return [...events]
      .map((e) => ({ ...e, _parsed: parseDateText(e.date) }))
      .sort((a, b) => {
        if (a._parsed && b._parsed) return a._parsed.getTime() - b._parsed.getTime();
        if (a._parsed) return -1;
        if (b._parsed) return 1;
        return 0;
      });
  }, [events]);

  const filteredEvents = useMemo(() => {
    const today = startOfToday();
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

    let filtered = sortedEvents;

    // Apply date filter
    if (activeFilter !== "all") {
      filtered = filtered.filter((event) => {
        const date = event._parsed;
        if (!date) return activeFilter === "upcoming";
        switch (activeFilter) {
          case "today":
            return isToday(date);
          case "this-week":
            return isWithinInterval(date, { start: today, end: weekEnd });
          case "upcoming":
            return !isBefore(date, today);
          default:
            return true;
        }
      });
    }

    // Apply search
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.location && e.location.toLowerCase().includes(q)) ||
          (e.tag && e.tag.toLowerCase().includes(q))
      );
    }

    return filtered;
  }, [sortedEvents, activeFilter, search]);

  // Split into featured (first 2 with images) and upcoming
  const featuredEvents = useMemo(
    () => filteredEvents.filter((e) => e.image_url).slice(0, 2),
    [filteredEvents]
  );

  const upcomingEvents = useMemo(() => {
    const featuredIds = new Set(featuredEvents.map((e) => e.id));
    return filteredEvents.filter((e) => !featuredIds.has(e.id));
  }, [filteredEvents, featuredEvents]);

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Hero */}
      <div className="relative h-[180px] overflow-hidden">
        <img src={heroBg} alt="Events in Hoedspruit" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "var(--hero-overlay)" }} />
        <div className="absolute inset-0 flex items-end justify-center pb-6">
          <h1
            className="text-2xl font-bold text-white tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Events in Hoedspruit
          </h1>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 -mt-4 relative z-10 mb-3">
        <div className="flex items-center bg-card rounded-full shadow-card border border-border px-4 py-3 gap-3">
          <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>
      </div>

      {/* Filter pills */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                activeFilter === filter.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card text-foreground border border-border hover:shadow-card"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="px-4 space-y-4">
          <Skeleton className="h-6 w-40 rounded" />
          <div className="flex gap-3">
            <Skeleton className="w-[72%] aspect-[4/3] rounded-xl flex-shrink-0" />
            <Skeleton className="w-[72%] aspect-[4/3] rounded-xl flex-shrink-0" />
          </div>
          <Skeleton className="h-6 w-40 rounded mt-4" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="px-4 py-16 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-foreground font-semibold text-lg mb-1">
            {search ? "No matching events" : "No events found right now"}
          </p>
          <p className="text-muted-foreground text-sm">
            {search
              ? "Try another search or browse upcoming events"
              : "Check back soon for what's happening in Hoedspruit"}
          </p>
        </div>
      ) : (
        <>
          {/* Featured Events */}
          {featuredEvents.length > 0 && (
            <section className="mt-6 mb-4">
              <div className="flex items-center px-4 mb-3">
                <h2
                  className="text-lg font-bold text-foreground"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Featured Events
                </h2>
                <div className="flex-1 ml-3 h-px bg-border" />
              </div>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 snap-x snap-mandatory">
                {featuredEvents.map((event) => (
                  <Link
                    key={event.id}
                    to={`/listing/${event.id}`}
                    className="snap-start flex-shrink-0 w-[72%] rounded-xl overflow-hidden relative aspect-[4/3] group"
                  >
                    <img
                      src={event.image_url!}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-bold text-base mb-1 leading-tight">
                        {event.title}
                      </h3>
                      <p className="text-white/80 text-xs mb-0.5">
                        {formatEventDate(event.date)}
                        {event.start_time ? `, ${formatTime(event.start_time)}` : ""}
                      </p>
                      {event.location && (
                        <p className="text-white/70 text-xs flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </p>
                      )}
                      <Button
                        size="sm"
                        className="mt-2 bg-accent hover:bg-accent-hover text-accent-foreground text-xs px-4 py-1.5 rounded-lg h-auto"
                      >
                        View Details
                      </Button>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <section className="px-4 mt-6">
              <div className="flex items-center mb-3 mx-0 my-0">
                <h2
                  className="text-lg font-bold text-foreground"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Upcoming Events
                </h2>
                <div className="flex-1 ml-3 h-px bg-border" />
              </div>
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    to={`/listing/${event.id}`}
                    className="flex items-center gap-3 bg-card rounded-xl border border-border p-3 hover:shadow-card transition-shadow group"
                  >
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                      {event.image_url ? (
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-accent font-semibold">
                        {formatEventDate(event.date)}
                        {event.start_time ? ` | ${formatTime(event.start_time)}` : ""}
                      </p>
                      <h4 className="text-sm font-bold text-foreground leading-tight line-clamp-1">
                        {event.title}
                      </h4>
                      {event.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" />
                          <span className="line-clamp-1">{event.location}</span>
                        </p>
                      )}
                    </div>

                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default Events;
