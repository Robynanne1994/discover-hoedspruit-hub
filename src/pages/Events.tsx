import { Search, ChevronRight, Calendar, ArrowLeft } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
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
  const navigate = useNavigate();
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
    <div className="min-h-screen pb-20" style={{ background: "#ebebeb" }}>
      {/* Back button */}
      <div style={{ paddingTop: 16, paddingLeft: 24, paddingRight: 24, marginBottom: 28 }}>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center"
          style={{ gap: 6 }}
        >
          <ArrowLeft style={{ width: 18, height: 18, strokeWidth: 2, color: "rgba(18,18,20,0.4)" }} />
          <span style={{ fontSize: 15, fontWeight: 500, color: "rgba(18,18,20,0.4)", letterSpacing: "0.2px" }}>
            Back
          </span>
        </button>
      </div>

      {/* Heading */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 12 }}>
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 400,
            fontSize: 40,
            lineHeight: 0.95,
            letterSpacing: "0.01em",
            color: "#2b2420",
            textTransform: "uppercase",
          }}
        >
          WHAT'S<br />HAPPENING
        </h1>
      </div>

      {/* Subtitle */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 24 }}>
        <p
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontStyle: "italic",
            fontSize: 14,
            color: "rgba(18,18,20,0.4)",
            letterSpacing: "0.2px",
            lineHeight: 1.4,
          }}
        >
          Events, markets and things to do around Hoedspruit
        </p>
      </div>

      {/* Search bar */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 20 }}>
        <div
          className="flex items-center"
          style={{
            background: "rgba(18,18,20,0.04)",
            border: "1px solid rgba(18,18,20,0.08)",
            borderRadius: 9999,
            padding: "14px 16px",
            gap: 10,
          }}
        >
          <Search style={{ width: 18, height: 18, strokeWidth: 2, color: "rgba(18,18,20,0.3)", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none"
            style={{
              fontSize: 14,
              color: "#2b2420",
              letterSpacing: "0.2px",
            }}
          />
        </div>
      </div>

      {/* Filter pills */}
      <div className="overflow-x-auto scrollbar-hide" style={{ paddingLeft: 24, marginBottom: 32 }}>
        <div className="flex" style={{ gap: 8, paddingRight: 24 }}>
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className="whitespace-nowrap"
              style={{
                background: activeFilter === filter.value ? "#121214" : "rgba(18,18,20,0.05)",
                border: "none",
                borderRadius: 9999,
                padding: "7px 16px",
                fontSize: 12,
                fontWeight: 600,
                color: activeFilter === filter.value ? "#ffffff" : "rgba(18,18,20,0.55)",
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="px-6 space-y-4">
          <Skeleton className="h-3 w-12 rounded" />
          <Skeleton className="h-5 w-24 rounded" />
          <div className="flex gap-3">
            <Skeleton className="w-[280px] h-[320px] rounded-2xl flex-shrink-0" />
            <Skeleton className="w-[280px] h-[320px] rounded-2xl flex-shrink-0" />
          </div>
          <Skeleton className="h-3 w-12 rounded mt-10" />
          <Skeleton className="h-5 w-24 rounded" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[76px] w-full rounded-2xl" />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="px-6 py-24 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(18,18,20,0.04)" }}
          >
            <Calendar style={{ width: 28, height: 28, color: "rgba(18,18,20,0.2)" }} />
          </div>
          <p
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 400,
              fontSize: 24,
              color: "#2b2420",
              marginBottom: 10,
              letterSpacing: "0.01em",
            }}
          >
            {search ? "No matching events" : "No events right now"}
          </p>
          <p
            style={{
              fontSize: 13,
              color: "rgba(18,18,20,0.4)",
              lineHeight: 1.5,
              maxWidth: 240,
              margin: "0 auto",
            }}
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
            <section style={{ marginBottom: 0 }}>
              <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 18 }}>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "rgba(18,18,20,0.3)",
                    textTransform: "uppercase",
                    letterSpacing: 3,
                    marginBottom: 6,
                  }}
                >
                  Curated
                </p>
                <h2
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontWeight: 400,
                    fontSize: 22,
                    color: "#2b2420",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Featured
                </h2>
              </div>
              <div className="overflow-x-auto scrollbar-hide">
                <div className="inline-flex snap-x snap-mandatory" style={{ paddingLeft: 24, gap: 14, paddingBottom: 8, paddingRight: 24 }}>
                  {featuredEvents.map((event) => (
                    <Link
                      key={event.id}
                      to={`/events/${event.id}`}
                      className="snap-start flex-shrink-0 relative overflow-hidden active:scale-[0.98] transition-transform duration-200"
                      style={{ width: 280, height: 320, borderRadius: 16 }}
                    >
                      {event.image_url ? (
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full" style={{ background: "#f0f0f0" }} />
                      )}
                      <div
                        className="absolute inset-0"
                        style={{
                          background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.2) 40%, transparent 65%)",
                        }}
                      />
                      {event.tag && (
                        <div
                          className="absolute"
                          style={{ top: 14, left: 14 }}
                        >
                          <span
                            style={{
                              background: "rgba(255,255,255,0.9)",
                              borderRadius: 16,
                              padding: "5px 12px",
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#2b2420",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            {event.tag}
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0" style={{ padding: 16 }}>
                        <p
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "rgba(255,255,255,0.7)",
                            textTransform: "uppercase",
                            letterSpacing: 1,
                            marginBottom: 4,
                          }}
                        >
                          {formatEventDate(event.date)}
                          {event.start_time ? ` · ${formatTime(event.start_time)}` : ""}
                        </p>
                        <h3
                          className="line-clamp-2"
                          style={{
                            fontFamily: "var(--font-heading)",
                            fontSize: 18,
                            fontWeight: 700,
                            color: "#ffffff",
                            lineHeight: 1.2,
                            marginBottom: 4,
                          }}
                        >
                          {event.title}
                        </h3>
                        {event.location && (
                          <p
                            className="line-clamp-1"
                            style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}
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
            <section style={{ paddingTop: 36, paddingLeft: 24, paddingRight: 24, paddingBottom: 40 }}>
              <div style={{ marginBottom: 18 }}>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "rgba(18,18,20,0.3)",
                    textTransform: "uppercase",
                    letterSpacing: 3,
                    marginBottom: 6,
                  }}
                >
                  Coming up
                </p>
                <h2
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontWeight: 400,
                    fontSize: 22,
                    color: "#2b2420",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Upcoming
                </h2>
              </div>
              <div>
                {upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    to={`/events/${event.id}`}
                    className="flex items-center active:scale-[0.98] transition-transform duration-200"
                    style={{
                      gap: 14,
                      paddingTop: 14,
                      paddingBottom: 14,
                      borderBottom: "1px solid rgba(18,18,20,0.06)",
                    }}
                  >
                    <div
                      className="flex-shrink-0 overflow-hidden"
                      style={{ width: 60, height: 60, borderRadius: 16, background: "#f0f0f0" }}
                    >
                      {event.image_url ? (
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Calendar style={{ width: 20, height: 20, color: "rgba(18,18,20,0.2)" }} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "rgba(18,18,20,0.35)",
                          textTransform: "uppercase",
                          letterSpacing: 1,
                          marginBottom: 4,
                        }}
                      >
                        {formatEventDate(event.date)}
                        {event.start_time ? ` · ${formatTime(event.start_time)}` : ""}
                      </p>
                      <h4
                        style={{
                          fontSize: 15,
                          fontFamily: "var(--font-heading)", fontWeight: 700,
                          color: "#2b2420",
                          lineHeight: 1.2,
                          marginBottom: 3,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {event.title}
                      </h4>
                      {event.location && (
                        <p
                          className="line-clamp-1"
                          style={{ fontSize: 12, color: "rgba(18,18,20,0.4)" }}
                        >
                          {event.location.replace(/<[^>]*>/g, "")}
                        </p>
                      )}
                    </div>

                    <ChevronRight style={{ width: 16, height: 16, strokeWidth: 2, color: "rgba(18,18,20,0.2)", flexShrink: 0 }} />
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
