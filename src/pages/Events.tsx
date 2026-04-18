import { Search, ArrowUpRight, Calendar } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { parse, isToday, isBefore, startOfToday, endOfWeek, isWithinInterval } from "date-fns";

type FilterType = "all" | "today" | "this-week" | "upcoming" | "past";

const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

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
  if (!d) return raw.replace(/<[^>]*>/g, "").trim();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

function formatTime(time: string | null): string {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  if (isNaN(hour)) return time;
  const ampm = hour >= 12 ? "pm" : "am";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${String(m).padStart(2, "0")} ${ampm}`;
}

function buildDateMeta(event: { date: string; start_time: string | null }): string {
  const date = formatEventDate(event.date);
  const time = formatTime(event.start_time);
  if (date && time) return `${date} · ${time}`;
  return date || time || "";
}

const filters: { label: string; value: FilterType }[] = [
  { label: "All", value: "all" },
  { label: "Today", value: "today" },
  { label: "This week", value: "this-week" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Past", value: "past" },
];

const pressHandlers = {
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(0.98)"; },
  onPointerUp: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(1)"; },
  onPointerLeave: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(1)"; },
};

const SectionHeader = ({ overline, heading }: { overline: string; heading: string }) => (
  <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 16 }}>
    <p style={{
      fontFamily: FONT,
      fontSize: 12,
      fontWeight: 500,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: "rgba(18,18,20,0.55)",
      lineHeight: 1,
      margin: 0,
      marginBottom: 4,
    }}>
      {overline}
    </p>
    <h2 style={{
      fontFamily: FONT,
      fontWeight: 400,
      fontSize: 34,
      lineHeight: 1.1,
      letterSpacing: "0.01em",
      color: "#020202",
      margin: 0,
    }}>
      {heading}
    </h2>
  </div>
);

const EventRow = ({ event, showDivider }: { event: any; showDivider: boolean }) => {
  const meta = buildDateMeta(event);
  const location = event.location ? event.location.replace(/<[^>]*>/g, "").trim() : "";
  return (
    <div>
      <Link
        to={`/events/${event.id}`}
        className="flex items-center"
        style={{ padding: "16px 24px", transition: "transform 0.15s ease", textDecoration: "none" }}
        {...pressHandlers}
      >
        <div
          className="flex-shrink-0 overflow-hidden"
          style={{ width: 64, height: 64, borderRadius: "50%", background: "#EBEBEB", marginRight: 16 }}
        >
          {event.image_url && (
            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" loading="lazy" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {meta && (
            <p style={{
              fontFamily: FONT,
              fontSize: 12, fontWeight: 500, color: "rgba(18,18,20,0.55)",
              textTransform: "uppercase", letterSpacing: "0.06em", lineHeight: 1, margin: 0, marginBottom: 4,
            }}>
              {meta}
            </p>
          )}
          <h4 className="line-clamp-1" style={{
            fontFamily: FONT,
            fontSize: 20, fontWeight: 500, color: "#020202",
            lineHeight: 1.2, letterSpacing: "0.01em", margin: 0, marginBottom: 2,
          }}>
            {event.title}
          </h4>
          {location && (
            <p className="line-clamp-1" style={{
              fontFamily: FONT,
              fontSize: 14, fontWeight: 400, color: "rgba(18,18,20,0.55)", margin: 0,
            }}>
              {location}
            </p>
          )}
        </div>

        <ArrowUpRight size={22} strokeWidth={2.5} style={{ color: "rgba(18,18,20,0.3)", flexShrink: 0, marginLeft: 12 }} />
      </Link>
      {showDivider && (
        <div style={{ marginLeft: 24, marginRight: 24, height: 1, background: "rgba(18,18,20,0.08)" }} />
      )}
    </div>
  );
};

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

  const searched = useMemo(() => {
    if (!search.trim()) return sortedEvents;
    const q = search.toLowerCase();
    return sortedEvents.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.location && e.location.toLowerCase().includes(q)) ||
        (e.tag && e.tag.toLowerCase().includes(q))
    );
  }, [sortedEvents, search]);

  // Recurring events bypass the date filter (they happen every week)
  const recurringEvents = useMemo(
    () => searched.filter((e) => e.recurrence && e.recurrence.trim() !== ""),
    [searched]
  );

  const datedEvents = useMemo(() => {
    const today = startOfToday();
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const nonRecurring = searched.filter((e) => !e.recurrence || e.recurrence.trim() === "");
    if (activeFilter === "all") return nonRecurring;
    return nonRecurring.filter((event) => {
      const date = event._parsed;
      if (!date) return activeFilter === "upcoming";
      switch (activeFilter) {
        case "today": return isToday(date);
        case "this-week": return isWithinInterval(date, { start: today, end: weekEnd });
        case "upcoming": return !isBefore(date, today);
        case "past": return isBefore(date, today) && !isToday(date);
        default: return true;
      }
    });
  }, [searched, activeFilter]);

  const featuredEvents = useMemo(
    () => datedEvents.filter((e) => e.is_featured).slice(0, 8),
    [datedEvents]
  );

  const upcomingEvents = useMemo(() => {
    const featuredIds = new Set(featuredEvents.map((e) => e.id));
    return datedEvents.filter((e) => !featuredIds.has(e.id));
  }, [datedEvents, featuredEvents]);

  const hasAnything = featuredEvents.length > 0 || upcomingEvents.length > 0 || recurringEvents.length > 0;

  return (
    <div className="min-h-screen" style={{ background: "#EBEBEB", paddingBottom: 120, fontFamily: FONT }}>
      {/* Page title */}
      <div style={{ paddingTop: "calc(env(safe-area-inset-top) + 16px)", paddingLeft: 24, paddingRight: 24, marginBottom: 36 }}>
        <h1 style={{
          fontFamily: FONT,
          fontWeight: 400,
          fontSize: 53,
          lineHeight: 1,
          letterSpacing: "0.01em",
          color: "#020202",
          margin: 0,
        }}>
          What's<br />happening
        </h1>
      </div>

      {/* Search bar */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 16 }}>
        <div
          className="flex items-center"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(18,18,20,0.1)",
            borderRadius: 14,
            padding: "12px 16px",
            gap: 10,
          }}
        >
          <Search size={20} strokeWidth={2} style={{ color: "rgba(18,18,20,0.35)", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search events"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none"
            style={{
              fontSize: 15,
              fontWeight: 400,
              color: "#2B2420",
              fontFamily: FONT,
              border: "none",
            }}
          />
        </div>
      </div>

      {/* Filter chips */}
      <div className="overflow-x-auto scrollbar-hide" style={{ marginBottom: 24 }}>
        <div className="flex" style={{ gap: 8, paddingLeft: 24, paddingRight: 24 }}>
          {filters.map((filter) => {
            const active = activeFilter === filter.value;
            return (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className="whitespace-nowrap"
                style={{
                  background: active ? "#020202" : "rgba(18,18,20,0.06)",
                  border: "none",
                  borderRadius: 20,
                  padding: "6px 14px",
                  fontSize: 13,
                  fontWeight: 500,
                  color: active ? "#FFFFFF" : "#2B2420",
                  cursor: "pointer",
                  fontFamily: FONT,
                  flexShrink: 0,
                }}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div style={{ paddingLeft: 24, paddingRight: 24 }}>
          <Skeleton className="h-3 w-16 rounded mb-2" />
          <Skeleton className="h-8 w-32 rounded mb-4" />
          <div className="flex gap-3 overflow-hidden">
            <Skeleton className="flex-shrink-0 rounded-2xl" style={{ width: 280, height: 380 }} />
            <Skeleton className="flex-shrink-0 rounded-2xl" style={{ width: 280, height: 380 }} />
          </div>
        </div>
      ) : !hasAnything ? (
        <div className="text-center" style={{ paddingTop: 80, paddingLeft: 24, paddingRight: 24 }}>
          <div
            className="flex items-center justify-center mx-auto"
            style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(18,18,20,0.04)", marginBottom: 24 }}
          >
            <Calendar size={28} strokeWidth={1.8} style={{ color: "rgba(18,18,20,0.2)" }} />
          </div>
          <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 24, color: "#020202", marginBottom: 8, letterSpacing: "0.01em" }}>
            {search ? "No matching events" : "No events right now"}
          </p>
          <p style={{ fontFamily: FONT, fontSize: 14, color: "rgba(18,18,20,0.55)", lineHeight: 1.5, maxWidth: 240, margin: "0 auto" }}>
            {search ? "Try another search or browse upcoming events" : "Check back soon for what's happening in Hoedspruit"}
          </p>
        </div>
      ) : (
        <>
          {/* Featured */}
          {featuredEvents.length > 0 && (
            <section style={{ marginBottom: 48 }}>
              <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 16 }}>
                <p style={{
                  fontFamily: FONT,
                  fontSize: 12, fontWeight: 500, color: "rgba(18,18,20,0.55)",
                  textTransform: "uppercase", letterSpacing: "0.06em", lineHeight: 1, margin: 0,
                }}>
                  Featured
                </p>
              </div>
              <div className="overflow-x-auto scrollbar-hide" style={{ scrollSnapType: "x proximity" }}>
                <div className="inline-flex" style={{ paddingLeft: 24, paddingRight: 24, gap: 12 }}>
                  {featuredEvents.map((event) => {
                    const meta = buildDateMeta(event);
                    const location = event.location ? event.location.replace(/<[^>]*>/g, "").trim() : "";
                    return (
                      <Link
                        key={event.id}
                        to={`/events/${event.id}`}
                        className="flex-shrink-0 relative overflow-hidden"
                        style={{
                          width: 280,
                          height: 380,
                          borderRadius: 16,
                          transition: "transform 0.15s ease",
                          scrollSnapAlign: "start",
                          textDecoration: "none",
                        }}
                        {...pressHandlers}
                      >
                        {event.image_url ? (
                          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover object-center" loading="lazy" />
                        ) : (
                          <div className="w-full h-full" style={{ background: "#EBEBEB" }} />
                        )}
                        <div
                          className="absolute inset-0"
                          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.05) 100%)" }}
                        />

                        {/* Top-left category */}
                        {event.tag && (
                          <p style={{
                            position: "absolute", top: 16, left: 16,
                            fontFamily: FONT,
                            fontSize: 12, fontWeight: 500, color: "#FFFFFF",
                            textTransform: "uppercase", letterSpacing: "0.06em", margin: 0, lineHeight: 1,
                          }}>
                            {event.tag}
                          </p>
                        )}

                        {/* Top-right arrow */}
                        <ArrowUpRight
                          size={22}
                          strokeWidth={2.5}
                          style={{ position: "absolute", top: 14, right: 14, color: "rgba(255,255,255,0.65)" }}
                        />

                        {/* Bottom stack */}
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 16 }}>
                          {meta && (
                            <p style={{
                              fontFamily: FONT,
                              fontSize: 15, fontWeight: 400, color: "rgba(255,255,255,0.7)",
                              margin: 0, marginBottom: 6, lineHeight: 1,
                            }}>
                              {meta}
                            </p>
                          )}
                          <h3 className="line-clamp-2" style={{
                            fontFamily: FONT,
                            fontSize: 26, fontWeight: 400, color: "#FFFFFF",
                            textTransform: "uppercase", lineHeight: 1, letterSpacing: "0.01em",
                            margin: 0, marginBottom: 6,
                          }}>
                            {event.title}
                          </h3>
                          {location && (
                            <p className="line-clamp-1" style={{
                              fontFamily: FONT,
                              fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.7)", margin: 0,
                            }}>
                              {location}
                            </p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* Upcoming */}
          {upcomingEvents.length > 0 && (
            <section style={{ marginBottom: 48 }}>
              <SectionHeader overline="Save the date" heading="Upcoming" />
              <div>
                {upcomingEvents.map((event, idx) => (
                  <EventRow key={event.id} event={event} showDivider={idx < upcomingEvents.length - 1} />
                ))}
              </div>
            </section>
          )}

          {/* Recurring */}
          {recurringEvents.length > 0 && (
            <section>
              <SectionHeader overline="Happens regularly" heading="Every week" />
              <div>
                {recurringEvents.map((event, idx) => (
                  <EventRow key={event.id} event={event} showDivider={idx < recurringEvents.length - 1} />
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
