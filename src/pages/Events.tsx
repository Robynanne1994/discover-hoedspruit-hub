import { Search, MapPin, ChevronRight, Calendar } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import heroBg from "@/assets/hero-homepage.jpg";
import { parse, isToday, isBefore, startOfToday, endOfWeek, isWithinInterval } from "date-fns";

type FilterType = "all" | "today" | "this-week" | "upcoming" | "past";

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
  { label: "Past", value: "past" },
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
          case "past":
            return isBefore(date, today) && !isToday(date);
          default:
            return true;
        }
      });
    }

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

  const featuredEvents = useMemo(
    () => filteredEvents.filter((e) => e.image_url).slice(0, 2),
    [filteredEvents]
  );

  const upcomingEvents = useMemo(() => {
    const featuredIds = new Set(featuredEvents.map((e) => e.id));
    return filteredEvents.filter((e) => !featuredIds.has(e.id));
  }, [filteredEvents, featuredEvents]);

  return (
    <div className="min-h-screen pb-16 bg-background">
      {/* Hero */}
      <div className="relative h-[180px] overflow-hidden">
        <img src={heroBg} alt="Events in Hoedspruit" className="w-full h-full object-cover" />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, hsla(30, 20%, 20%, 0.1), hsla(30, 20%, 20%, 0.45))" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1
            className="text-[32px] font-semibold text-white tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Events
          </h1>
        </div>
      </div>

      {/* Search */}
      <div className="px-5 -mt-5 relative z-10 mb-5">
        <div className="flex items-center bg-card/95 backdrop-blur-sm rounded-full px-4 py-3 gap-3 border border-border/40">
          <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground placeholder:italic outline-none"
            style={{ fontFamily: "var(--font-body)" }}
          />
        </div>
      </div>

      {/* Filter pills */}
      <div className="px-5 mb-6">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide justify-center">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors whitespace-nowrap ${
                activeFilter === filter.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground border border-border/60"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="px-5 space-y-4">
          <Skeleton className="h-5 w-32 rounded" />
          <div className="flex gap-3.5">
            <Skeleton className="w-[78%] aspect-[3/4] rounded-xl flex-shrink-0" />
            <Skeleton className="w-[78%] aspect-[3/4] rounded-xl flex-shrink-0" />
          </div>
          <Skeleton className="h-5 w-32 rounded mt-6" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="px-5 py-20 text-center">
          <Calendar className="h-10 w-10 text-primary/15 mx-auto mb-5" />
          <p
            className="text-foreground font-semibold text-[20px] mb-2 tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {search ? "No matching events" : "No events right now"}
          </p>
          <p className="text-muted-foreground text-[13px] leading-relaxed">
            {search
              ? "Try another search or browse upcoming events"
              : "Check back soon for what's happening in Hoedspruit"}
          </p>
        </div>
      ) : (
        <>
          {/* Featured Events */}
          {featuredEvents.length > 0 && (
            <section className="mb-2">
              <div className="flex items-baseline justify-between px-5 mb-5">
                <h2
                  className="text-[22px] font-semibold text-foreground tracking-tight"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Featured
                </h2>
              </div>
              <div className="flex gap-3.5 overflow-x-auto scrollbar-hide px-5 snap-x snap-mandatory">
                {featuredEvents.map((event, index) => (
                  <Link
                    key={event.id}
                    to={`/listing/${event.id}`}
                    className={`snap-start flex-shrink-0 w-[78%] rounded-xl overflow-hidden relative aspect-[3/4] group ${index === featuredEvents.length - 1 ? "mr-5" : ""}`}
                  >
                    <img
                      src={event.image_url!}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <p className="text-white/70 text-[12px] font-medium uppercase tracking-wide mb-1.5">
                        {formatEventDate(event.date)}
                        {event.start_time ? ` · ${formatTime(event.start_time)}` : ""}
                      </p>
                      <h3
                        className="text-white font-semibold text-lg leading-snug mb-1"
                        style={{ fontFamily: "var(--font-heading)" }}
                      >
                        {event.title}
                      </h3>
                      {event.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-white/60" />
                          <p className="text-white/60 text-[12px]">{event.location}</p>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <section className="px-5 py-8">
              <div className="flex items-baseline justify-between mb-5">
                <h2
                  className="text-[22px] font-semibold text-foreground tracking-tight"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Upcoming
                </h2>
              </div>
              <div className="space-y-0">
                {upcomingEvents.map((event, idx) => (
                  <Link
                    key={event.id}
                    to={`/listing/${event.id}`}
                    className={`flex items-center gap-4 py-4 group ${idx < upcomingEvents.length - 1 ? "border-b border-border/60" : ""}`}
                  >
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                      {event.image_url ? (
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-primary font-semibold uppercase tracking-wide mb-0.5">
                        {formatEventDate(event.date)}
                        {event.start_time ? ` · ${formatTime(event.start_time)}` : ""}
                      </p>
                      <h4 className="text-[14px] font-medium text-foreground leading-snug line-clamp-1">
                        {event.title}
                      </h4>
                      {event.location && (
                        <p className="text-[12px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="line-clamp-1">{event.location}</span>
                        </p>
                      )}
                    </div>

                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
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
