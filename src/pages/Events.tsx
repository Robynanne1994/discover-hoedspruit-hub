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
    <div className="min-h-screen pb-20 bg-background">
      {/* Hero */}
      <div className="relative h-[200px] overflow-hidden">
        <img
          src={heroBg}
          alt="Events in Hoedspruit"
          className="w-full h-full object-cover scale-105"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, hsla(30, 20%, 15%, 0.15), hsla(30, 20%, 15%, 0.55))",
          }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p
            className="text-white/60 text-[11px] font-medium uppercase tracking-[0.2em] mb-2"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Hello Hoedspruit
          </p>
          <h1
            className="text-[34px] font-semibold text-white tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Events
          </h1>
        </div>
      </div>

      {/* Search */}
      <div className="px-5 -mt-5 relative z-10 mb-4">
        <div className="flex items-center bg-card/95 backdrop-blur-sm rounded-full px-4 py-3 gap-3 border border-border shadow-sm">
          <Search className="h-4 w-4 text-muted-foreground/60 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/60 placeholder:italic outline-none"
            style={{ fontFamily: "var(--font-body)" }}
          />
        </div>
      </div>

      {/* Filter pills */}
      <div className="mb-8">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide justify-center px-5 py-0.5">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`px-3.5 py-1 rounded-full text-[11px] font-medium tracking-wide transition-all duration-200 whitespace-nowrap ${
                activeFilter === filter.value
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              style={{ fontFamily: "var(--font-body)" }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="px-5 space-y-4">
          <Skeleton className="h-5 w-24 rounded" />
          <div className="flex gap-4">
            <Skeleton className="w-[75%] aspect-[3/4] rounded-2xl flex-shrink-0" />
            <Skeleton className="w-[75%] aspect-[3/4] rounded-2xl flex-shrink-0" />
          </div>
          <Skeleton className="h-5 w-24 rounded mt-8" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="px-5 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-5">
            <Calendar className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <p
            className="text-foreground font-semibold text-[22px] mb-2 tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {search ? "No matching events" : "No events right now"}
          </p>
          <p
            className="text-muted-foreground text-[13px] leading-relaxed max-w-[260px] mx-auto"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {search
              ? "Try another search or browse upcoming events"
              : "Check back soon for what's happening in Hoedspruit"}
          </p>
        </div>
      ) : (
        <>
          {/* Featured Events */}
          {featuredEvents.length > 0 && (
            <section className="mb-10">
              <div className="px-5 mb-4">
                <p
                  className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground mb-1"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Curated
                </p>
                <h2
                  className="text-[24px] font-semibold text-foreground tracking-tight"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Featured
                </h2>
              </div>
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex gap-4 px-5 snap-x snap-mandatory pb-1">
                  {featuredEvents.map((event) => (
                    <Link
                      key={event.id}
                      to={`/events/${event.id}`}
                      className="snap-start flex-shrink-0 w-[75%] rounded-2xl overflow-hidden relative aspect-[3/4] group"
                    >
                      <img
                        src={event.image_url!}
                        alt={event.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(to top, hsla(0, 0%, 0%, 0.6) 0%, hsla(0, 0%, 0%, 0.2) 40%, transparent 70%)",
                        }}
                      />
                      {event.tag && (
                        <div className="absolute top-4 left-4">
                          <span
                            className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/90 bg-white/15 backdrop-blur-sm rounded-full px-2.5 py-1"
                            style={{ fontFamily: "var(--font-body)" }}
                          >
                            {event.tag}
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        <p
                          className="text-white/65 text-[11px] font-medium uppercase tracking-[0.1em] mb-2"
                          style={{ fontFamily: "var(--font-body)" }}
                        >
                          {formatEventDate(event.date)}
                          {event.start_time ? ` · ${formatTime(event.start_time)}` : ""}
                        </p>
                        <h3
                          className="text-white font-semibold text-[20px] leading-tight mb-1.5 tracking-tight"
                          style={{ fontFamily: "var(--font-heading)" }}
                        >
                          {event.title}
                        </h3>
                        {event.location && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 text-white/50" />
                            <p
                              className="text-white/55 text-[11px]"
                              style={{ fontFamily: "var(--font-body)" }}
                            >
                              {event.location.replace(/<[^>]*>/g, "")}
                            </p>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <section className="px-5 pb-8">
              <div className="mb-5">
                <p
                  className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground mb-1"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Coming up
                </p>
                <h2
                  className="text-[24px] font-semibold text-foreground tracking-tight"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Upcoming
                </h2>
              </div>
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    to={`/events/${event.id}`}
                    className="flex items-center gap-3.5 p-3 rounded-xl bg-card border border-border/40 group transition-all duration-200 hover:border-border"
                  >
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                      {event.image_url ? (
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-muted-foreground/25" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[10px] text-primary font-semibold uppercase tracking-[0.1em] mb-0.5"
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        {formatEventDate(event.date)}
                        {event.start_time ? ` · ${formatTime(event.start_time)}` : ""}
                      </p>
                      <h4
                        className="text-[14px] font-medium text-foreground leading-snug line-clamp-1 tracking-tight"
                        style={{ fontFamily: "var(--font-heading)" }}
                      >
                        {event.title}
                      </h4>
                      {event.location && (
                        <p
                          className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5"
                          style={{ fontFamily: "var(--font-body)" }}
                        >
                          <MapPin className="h-2.5 w-2.5 flex-shrink-0 text-muted-foreground/50" />
                          <span className="line-clamp-1">
                            {event.location.replace(/<[^>]*>/g, "")}
                          </span>
                        </p>
                      )}
                    </div>

                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 flex-shrink-0" />
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
