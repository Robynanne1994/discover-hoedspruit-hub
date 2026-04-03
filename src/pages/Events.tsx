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
    () => filteredEvents.filter((e) => e.image_url).slice(0, 4),
    [filteredEvents]
  );

  const upcomingEvents = useMemo(() => {
    const featuredIds = new Set(featuredEvents.map((e) => e.id));
    return filteredEvents.filter((e) => !featuredIds.has(e.id));
  }, [filteredEvents, featuredEvents]);

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Hero */}
      <section className="relative">
        <div className="relative h-[220px] overflow-hidden">
          <img
            src={heroBg}
            alt="Events in Hoedspruit"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to bottom, hsla(30, 20%, 12%, 0.2) 0%, hsla(30, 20%, 12%, 0.6) 100%)",
            }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
            <p
              className="text-white/50 text-[10px] font-medium tracking-[0.25em] uppercase mb-3"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Hello Hoedspruit
            </p>
            <h1
              className="text-[38px] tracking-tight leading-none text-white font-sans font-medium"
              style={{ fontFamily: "'Inter Tight', sans-serif" }}
            >
              Events
            </h1>
          </div>
        </div>

        {/* Search */}
        <div className="px-5 -mt-6 relative z-10">
          <div className="flex items-center bg-card backdrop-blur-sm rounded-2xl px-4 py-3.5 gap-3 border border-border/60 shadow-sm">
            <Search className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-[13px] flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground/50 placeholder:italic"
              style={{ fontFamily: "var(--font-body)" }}
            />
          </div>
        </div>
      </section>

      {/* Filter pills */}
      <div className="pt-5 pb-1">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide justify-center px-5 py-0.5">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`px-3.5 py-1.5 rounded-full text-[11px] font-medium tracking-wide transition-all duration-200 whitespace-nowrap ${
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
        <div className="px-5 pt-8 space-y-4">
          <Skeleton className="h-3 w-12 rounded" />
          <Skeleton className="h-5 w-24 rounded" />
          <div className="flex gap-4">
            <Skeleton className="w-[72%] aspect-[3/4] rounded-2xl flex-shrink-0" />
            <Skeleton className="w-[72%] aspect-[3/4] rounded-2xl flex-shrink-0" />
          </div>
          <Skeleton className="h-3 w-12 rounded mt-10" />
          <Skeleton className="h-5 w-24 rounded" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[76px] w-full rounded-2xl" />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="px-5 py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/60 flex items-center justify-center mx-auto mb-6">
            <Calendar className="h-7 w-7 text-muted-foreground/30" />
          </div>
          <p
            className="text-foreground font-semibold text-[24px] mb-2.5 tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {search ? "No matching events" : "No events right now"}
          </p>
          <p
            className="text-muted-foreground/70 text-[13px] leading-relaxed max-w-[240px] mx-auto"
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
            <section className="pt-8 mb-12">
              <div className="px-5 mb-5">
                <p
                  className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70 mb-1"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Curated
                </p>
                <h2
                  className="text-[26px] font-semibold text-foreground tracking-tight leading-none"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Featured
                </h2>
              </div>
              <div className="overflow-x-auto scrollbar-hide">
                <div className="inline-flex gap-4 px-5 snap-x snap-mandatory pb-2">
                  {featuredEvents.map((event) => (
                    <Link
                      key={event.id}
                      to={`/events/${event.id}`}
                      className="snap-start flex-shrink-0 w-[72vw] max-w-[300px] rounded-2xl overflow-hidden relative aspect-[3/4] group active:scale-[0.98] transition-transform duration-200"
                    >
                      <img
                        src={event.image_url!}
                        alt={event.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                        loading="lazy"
                      />
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(to top, hsla(25, 15%, 8%, 0.7) 0%, hsla(25, 15%, 8%, 0.25) 40%, hsla(25, 15%, 8%, 0.05) 65%, transparent 100%)",
                        }}
                      />
                      {event.tag && (
                        <div className="absolute top-3.5 left-3.5">
                          <span
                            className="text-[8px] font-bold uppercase tracking-[0.14em] text-white bg-white/15 backdrop-blur-md rounded-full px-2.5 py-1"
                            style={{ fontFamily: "var(--font-body)" }}
                          >
                            {event.tag}
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-4 pb-5">
                        <p
                          className="text-white/50 text-[9px] font-semibold uppercase tracking-[0.14em] mb-2"
                          style={{ fontFamily: "var(--font-body)" }}
                        >
                          {formatEventDate(event.date)}
                          {event.start_time ? `  ·  ${formatTime(event.start_time)}` : ""}
                        </p>
                        <h3
                          className="text-white font-semibold text-[19px] leading-[1.2] mb-1 tracking-tight line-clamp-2"
                          style={{ fontFamily: "var(--font-heading)" }}
                        >
                          {event.title}
                        </h3>
                        {event.location && (
                          <p
                            className="text-white/40 text-[10px] mt-1 line-clamp-1"
                            style={{ fontFamily: "var(--font-body)" }}
                          >
                            {event.location.replace(/<[^>]*>/g, "")}
                          </p>
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
            <section className="px-5 pb-10">
              <div className="mb-5">
                <p
                  className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70 mb-1"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Coming up
                </p>
                <h2
                  className="text-[26px] font-semibold text-foreground tracking-tight leading-none"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Upcoming
                </h2>
              </div>
              <div className="space-y-2.5">
                {upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    to={`/events/${event.id}`}
                    className="flex items-center gap-3.5 p-3 rounded-2xl bg-card border border-border/50 group transition-all duration-200 active:scale-[0.98]"
                  >
                    <div className="w-[52px] h-[52px] rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                      {event.image_url ? (
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-muted-foreground/20" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[9px] text-primary font-bold uppercase tracking-[0.12em] mb-0.5"
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        {formatEventDate(event.date)}
                        {event.start_time ? `  ·  ${formatTime(event.start_time)}` : ""}
                      </p>
                      <h4
                        className="text-[14px] font-semibold text-foreground leading-snug line-clamp-1 tracking-tight"
                        style={{ fontFamily: "var(--font-heading)" }}
                      >
                        {event.title}
                      </h4>
                      {event.location && (
                        <p
                          className="text-[10px] text-muted-foreground/70 line-clamp-1 mt-0.5"
                          style={{ fontFamily: "var(--font-body)" }}
                        >
                          {event.location.replace(/<[^>]*>/g, "")}
                        </p>
                      )}
                    </div>

                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/25 flex-shrink-0" />
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
