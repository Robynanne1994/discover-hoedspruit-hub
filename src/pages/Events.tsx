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
    () => filteredEvents.filter((e) => e.is_featured).slice(0, 8),
    [filteredEvents]
  );

  const upcomingEvents = useMemo(() => {
    const featuredIds = new Set(featuredEvents.map((e) => e.id));
    return filteredEvents.filter((e) => !featuredIds.has(e.id));
  }, [filteredEvents, featuredEvents]);

  const pressHandlers = {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(0.98)"; },
    onPointerUp: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(1)"; },
    onPointerLeave: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(1)"; },
  };

  return (
    <div className="min-h-screen" style={{ background: "#EBEBEB", paddingBottom: 84, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      {/* Back button */}
      <div style={{ paddingTop: 16, paddingLeft: 20, paddingRight: 20, marginBottom: 8 }}>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center"
          style={{ gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <ArrowLeft size={20} strokeWidth={1.8} style={{ color: "#2B2420" }} />
          <span style={{ fontSize: 15, fontWeight: 500, color: "#2B2420" }}>Back</span>
        </button>
      </div>

      {/* Heading */}
      <div style={{ paddingLeft: 20, paddingRight: 20, marginBottom: 4 }}>
        <h1 style={{
          fontFamily: "'Helvetica World', Helvetica, Arial, sans-serif",
          fontWeight: 400,
          fontSize: 40,
          lineHeight: 0.95,
          letterSpacing: "-0.01em",
          color: "#020202",
          textTransform: "capitalize",
          margin: 0,
        }}>
          What's Happening
        </h1>
      </div>

      {/* Subtitle */}
      <div style={{ paddingLeft: 20, paddingRight: 20, marginBottom: 24 }}>
        <p style={{ fontSize: 15, fontWeight: 400, lineHeight: 1.35, color: "rgba(18,18,20,0.55)", margin: 0 }}>
          Events, markets and things to do around Hoedspruit
        </p>
      </div>

      {/* Search bar */}
      <div style={{ paddingLeft: 20, paddingRight: 20, marginBottom: 16 }}>
        <div
          className="flex items-center"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(18,18,20,0.1)",
            borderRadius: 14,
            padding: "12px 16px",
            gap: 8,
          }}
        >
          <Search size={20} strokeWidth={1.8} style={{ color: "rgba(18,18,20,0.35)", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none placeholder:text-[rgba(18,18,20,0.35)]"
            style={{ fontSize: 15, fontWeight: 400, color: "#2B2420", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", border: "none" }}
          />
        </div>
      </div>

      {/* Filter chips */}
      <div className="overflow-x-auto scrollbar-hide" style={{ paddingLeft: 20, marginBottom: 24 }}>
        <div className="flex" style={{ gap: 8, paddingRight: 20 }}>
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className="whitespace-nowrap"
              style={{
                background: activeFilter === filter.value ? "#020202" : "rgba(18,18,20,0.06)",
                border: "none",
                borderRadius: 20,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 500,
                color: activeFilter === filter.value ? "#FFFFFF" : "#2B2420",
                cursor: "pointer",
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div style={{ paddingLeft: 20, paddingRight: 20 }}>
          <Skeleton className="h-3 w-12 rounded mb-2" />
          <Skeleton className="h-8 w-32 rounded mb-4" />
          <div className="flex gap-3 overflow-hidden">
            <Skeleton className="w-[300px] flex-shrink-0 rounded-2xl" style={{ aspectRatio: "4/5" }} />
            <Skeleton className="w-[300px] flex-shrink-0 rounded-2xl" style={{ aspectRatio: "4/5" }} />
          </div>
          <Skeleton className="h-3 w-12 rounded mt-10 mb-2" />
          <Skeleton className="h-8 w-32 rounded mb-4" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[76px] w-full rounded-xl mb-2" />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center" style={{ paddingTop: 80, paddingLeft: 20, paddingRight: 20 }}>
          <div
            className="flex items-center justify-center mx-auto"
            style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(18,18,20,0.04)", marginBottom: 24 }}
          >
            <Calendar size={28} strokeWidth={1.8} style={{ color: "rgba(18,18,20,0.2)" }} />
          </div>
          <p style={{ fontWeight: 400, fontSize: 24, color: "#020202", marginBottom: 8, letterSpacing: "0.01em" }}>
            {search ? "No matching events" : "No events right now"}
          </p>
          <p style={{ fontSize: 14, color: "rgba(18,18,20,0.55)", lineHeight: 1.5, maxWidth: 240, margin: "0 auto" }}>
            {search ? "Try another search or browse upcoming events" : "Check back soon for what's happening in Hoedspruit"}
          </p>
        </div>
      ) : (
        <>
          {/* Featured Events */}
          {featuredEvents.length > 0 && (
            <section style={{ marginBottom: 36 }}>
              <div style={{ paddingLeft: 20, paddingRight: 20, marginBottom: 16 }}>
                <p style={{
                  fontSize: 12, fontWeight: 500, color: "rgba(18,18,20,0.4)",
                  textTransform: "uppercase", letterSpacing: "0.06em", lineHeight: 1.3, marginBottom: 4,
                }}>
                  Curated
                </p>
                <h2 
                  style={{
                    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                    fontWeight: 400,
                    fontSize: 22,
                    color: "#020202",
                    textTransform: "none", letterSpacing: "0.01em", lineHeight: 1.1, margin: 0,
                  }}>
                  Featured
                </h2>
              </div>
              <div className="overflow-x-auto scrollbar-hide">
                <div className="inline-flex snap-x snap-mandatory" style={{ paddingLeft: 20, gap: 12, paddingRight: 20, paddingBottom: 4 }}>
                  {featuredEvents.map((event) => (
                    <Link
                      key={event.id}
                      to={`/events/${event.id}`}
                      className="snap-start flex-shrink-0 relative overflow-hidden"
                      style={{ width: 300, aspectRatio: "4/5", borderRadius: 16, transition: "transform 0.15s ease" }}
                      {...pressHandlers}
                    >
                      {event.image_url ? (
                        <img src={event.image_url} alt={event.title} className="w-full h-full object-cover object-center" loading="lazy" />
                      ) : (
                        <div className="w-full h-full" style={{ background: "#f0f0f0" }} />
                      )}
                      <div
                        className="absolute inset-0"
                        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.05) 100%)" }}
                      />
                      {event.tag && (
                        <div className="absolute" style={{ top: 12, left: 12 }}>
                          <span style={{
                            background: "#FFFFFF", borderRadius: 20, padding: "4px 10px",
                            fontSize: 11, fontWeight: 600, color: "#2B2420",
                            textTransform: "uppercase", letterSpacing: "0.04em",
                          }}>
                            {event.tag}
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0" style={{ padding: 16 }}>
                        <p style={{
                          fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.7)",
                          textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4,
                        }}>
                          {formatEventDate(event.date)}
                          {event.start_time ? ` · ${formatTime(event.start_time)}` : ""}
                        </p>
                        <h3 className="line-clamp-2" style={{
                          fontSize: 20, fontWeight: 500, color: "#FFFFFF",
                          textTransform: "uppercase", lineHeight: 1.15, letterSpacing: "0.01em", marginBottom: 4,
                        }}>
                          {event.title}
                        </h3>
                        {event.location && (
                          <p className="line-clamp-1" style={{ fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.6)" }}>
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
            <section style={{ paddingBottom: 36 }}>
              <div style={{ paddingLeft: 20, paddingRight: 20, marginBottom: 16 }}>
                <p style={{
                  fontSize: 12, fontWeight: 500, color: "rgba(18,18,20,0.4)",
                  textTransform: "uppercase", letterSpacing: "0.06em", lineHeight: 1.3, marginBottom: 4,
                }}>
                  Save the Date
                </p>
                <h2 style={{
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                  fontWeight: 400, fontSize: 34, color: "#020202",
                  textTransform: "none", letterSpacing: "0.01em", lineHeight: 1.1, margin: 0,
                }}>
                  Upcoming
                </h2>
              </div>
              <div>
                {upcomingEvents.map((event, idx) => (
                  <div key={event.id}>
                    <Link
                      to={`/events/${event.id}`}
                      className="flex items-center"
                      style={{ padding: "14px 20px", transition: "transform 0.15s ease" }}
                      {...pressHandlers}
                    >
                      <div
                        className="flex-shrink-0 overflow-hidden flex items-center justify-center"
                        style={{ width: 56, height: 56, borderRadius: 12, background: "rgba(18,18,20,0.06)", marginRight: 16 }}
                      >
                        {event.image_url ? (
                          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <Calendar size={24} strokeWidth={1.8} style={{ color: "rgba(18,18,20,0.2)" }} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p style={{
                          fontSize: 12, fontWeight: 500, color: "rgba(18,18,20,0.4)",
                          textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1.3, marginBottom: 3,
                        }}>
                          {formatEventDate(event.date)}
                          {event.start_time ? ` · ${formatTime(event.start_time)}` : ""}
                        </p>
                        <h4 style={{
                          fontSize: 16, fontWeight: 500, color: "#2B2420",
                          textTransform: "uppercase", lineHeight: 1.2, letterSpacing: "0.01em", marginBottom: 2,
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>
                          {event.title}
                        </h4>
                        {event.location && (
                          <p className="line-clamp-1" style={{ fontSize: 14, fontWeight: 400, color: "rgba(18,18,20,0.55)", lineHeight: 1.3 }}>
                            {event.location.replace(/<[^>]*>/g, "")}
                          </p>
                        )}
                      </div>

                      <ChevronRight size={20} strokeWidth={1.8} style={{ color: "rgba(18,18,20,0.2)", flexShrink: 0, marginLeft: "auto" }} />
                    </Link>
                    {idx < upcomingEvents.length - 1 && (
                      <div style={{ marginLeft: 92, height: 1, background: "rgba(18,18,20,0.08)" }} />
                    )}
                  </div>
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
