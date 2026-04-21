import { Search, ArrowUpRight, Bookmark } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { parse, isToday, isBefore, startOfToday, endOfWeek, isWithinInterval } from "date-fns";

type FilterType = "all" | "today" | "this-week" | "upcoming" | "past";

const FONT = "'Helvetica Neue', 'Helvetica World', Helvetica, Arial, sans-serif";

const COLOR = {
  bg: "#EBEBEB",
  card: "#FFFFFF",
  warm: "#F2EFEC",
  text: "#0A0A0A",
  muted: "#8A8480",
  divider: "#E8E4DF",
};

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

/** Shorten verbose recurrence into editorial form. */
function shortenRecurrence(raw: string): string {
  if (!raw) return "";
  const clean = raw.replace(/<[^>]*>/g, "").trim();
  const lower = clean.toLowerCase();
  if (lower === "none" || lower === "n/a") return "";
  if (lower.includes("first") && lower.includes("sat")) {
    const t = clean.match(/(\d{1,2}[:.]?\d{0,2})\s*(am|pm)/i);
    return t ? `First Sat · ${t[1].replace(".", ":")} ${t[2].toLowerCase()}` : "First Sat";
  }
  if (lower.includes("last") && lower.includes("fri")) {
    const t = clean.match(/(\d{1,2}[:.]?\d{0,2})\s*(am|pm)/i);
    return t ? `Last Fri · ${t[1].replace(".", ":")} ${t[2].toLowerCase()}` : "Last Fri";
  }
  if (lower.includes("every")) {
    const dayMatch = clean.match(/every\s+(mon|tue|wed|thu|fri|sat|sun)\w*/i);
    const t = clean.match(/(\d{1,2}[:.]?\d{0,2})\s*(am|pm)/i);
    if (dayMatch) {
      const day = dayMatch[1].charAt(0).toUpperCase() + dayMatch[1].slice(1).toLowerCase();
      return t ? `Every ${day} · ${t[1].replace(".", ":")} ${t[2].toLowerCase()}` : `Every ${day}`;
    }
  }
  if (lower.includes("monthly")) return "Monthly";
  if (lower.includes("quarterly")) return "Quarterly";
  if (lower.includes("weekly")) return "Weekly";
  // Fallback: cut at first comma or slash, cap at 32 chars
  const cut = clean.split(/[,/]/)[0].trim();
  return cut.length > 32 ? cut.slice(0, 30).trim() + "…" : cut;
}

const filters: { label: string; value: FilterType }[] = [
  { label: "All", value: "all" },
  { label: "Today", value: "today" },
  { label: "This Week", value: "this-week" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Past", value: "past" },
];

const pressHandlers = {
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(0.98)"; },
  onPointerUp: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(1)"; },
  onPointerLeave: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(1)"; },
};

const SectionHead = ({ overline, heading }: { overline: string; heading: string }) => (
  <div style={{ padding: "0 24px 20px 24px" }}>
    <h2 style={{
      fontFamily: FONT,
      fontWeight: 700,
      fontSize: 44,
      lineHeight: "44px",
      letterSpacing: "-1.32px",
      color: COLOR.text,
      margin: 0,
    }}>
      {heading}
    </h2>
  </div>
);

const EventRow = ({
  event,
  showDivider,
  metaOverride,
}: {
  event: any;
  showDivider: boolean;
  metaOverride?: string;
}) => {
  const meta = metaOverride ?? buildDateMeta(event);
  const location = event.location ? event.location.replace(/<[^>]*>/g, "").trim() : "";
  return (
    <>
      <Link
        to={`/events/${event.id}`}
        style={{
          display: "grid",
          gridTemplateColumns: "56px 1fr 24px",
          gap: 14,
          alignItems: "center",
          padding: "18px 0",
          textDecoration: "none",
          transition: "background 0.15s ease",
          borderRadius: 12,
        }}
        onPointerDown={(e) => { (e.currentTarget as HTMLElement).style.background = COLOR.warm; }}
        onPointerUp={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        onPointerLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            overflow: "hidden",
            background: COLOR.warm,
            flexShrink: 0,
          }}
        >
          {event.image_url && (
            <img src={event.image_url} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
          )}
        </div>

        <div style={{ minWidth: 0 }}>
          {meta && (
            <p style={{
              fontFamily: FONT,
              fontSize: 11,
              fontWeight: 400,
              lineHeight: "13px",
              letterSpacing: "0.22px",
              textTransform: "uppercase",
              color: COLOR.muted,
              margin: 0,
              marginBottom: 4,
            }}>
              {meta}
            </p>
          )}
          <h4 style={{
            fontFamily: FONT,
            fontSize: 18,
            fontWeight: 400,
            lineHeight: "21.6px",
            letterSpacing: "-0.18px",
            color: COLOR.text,
            margin: 0,
            marginBottom: 4,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}>
            {event.title}
          </h4>
          {location && (
            <p style={{
              fontFamily: FONT,
              fontSize: 13,
              fontWeight: 400,
              lineHeight: "18.2px",
              color: COLOR.muted,
              margin: 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}>
              {location}
            </p>
          )}
        </div>

        <ArrowUpRight size={18} strokeWidth={1.5} style={{ color: COLOR.text, flexShrink: 0 }} />
      </Link>
      {showDivider && (
        <div style={{ height: 1, background: COLOR.divider }} />
      )}
    </>
  );
};

const Events = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

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

  const recurringEvents = useMemo(
    () => searched.filter((e) => e.recurrence && e.recurrence.trim() !== "" && e.recurrence.trim().toLowerCase() !== "none"),
    [searched]
  );

  const datedEvents = useMemo(() => {
    const today = startOfToday();
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const nonRecurring = searched.filter((e) => !e.recurrence || e.recurrence.trim() === "" || e.recurrence.trim().toLowerCase() === "none");
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
    <div className="min-h-screen" style={{ background: COLOR.bg, paddingBottom: 140, fontFamily: FONT }}>

      {/* Page header */}
      <div style={{ padding: "16px 24px 28px 24px" }}>
        <h1 style={{
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 52,
          lineHeight: "52px",
          letterSpacing: "-1.56px",
          color: COLOR.text,
          margin: 0,
        }}>
          What's happening
        </h1>
      </div>

      {/* Search pill */}
      <div style={{ padding: "0 24px 20px 24px" }}>
        <div
          style={{
            height: 48,
            background: searchFocused ? COLOR.card : COLOR.warm,
            border: searchFocused ? `1px solid ${COLOR.text}` : "1px solid transparent",
            borderRadius: 999,
            padding: "0 18px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            transition: "background 0.15s ease, border-color 0.15s ease",
          }}
        >
          <Search size={18} strokeWidth={1.5} style={{ color: COLOR.muted, flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search events"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              flex: 1,
              background: "transparent",
              outline: "none",
              border: "none",
              fontFamily: FONT,
              fontSize: 16,
              fontWeight: 400,
              lineHeight: "22.4px",
              color: COLOR.text,
            }}
          />
        </div>
      </div>

      {/* Filter chips */}
      <div className="overflow-x-auto scrollbar-hide" style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", gap: 8, padding: "0 24px" }}>
          {filters.map((filter) => {
            const active = activeFilter === filter.value;
            return (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                style={{
                  background: active ? COLOR.text : COLOR.card,
                  border: "none",
                  borderRadius: 999,
                  padding: "9px 16px",
                  fontFamily: FONT,
                  fontSize: 14,
                  fontWeight: 400,
                  lineHeight: "16.8px",
                  color: active ? "#FFFFFF" : COLOR.text,
                  boxShadow: active ? "none" : "0 1px 2px rgba(0,0,0,0.04)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  transition: "background 0.15s ease, color 0.15s ease",
                }}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: "0 24px" }}>
          <Skeleton className="h-3 w-16 rounded mb-3" />
          <Skeleton className="h-10 w-40 rounded mb-5" />
          <div className="flex gap-3 overflow-hidden">
            <Skeleton className="flex-shrink-0 rounded-3xl" style={{ width: 280, height: 380 }} />
            <Skeleton className="flex-shrink-0 rounded-3xl" style={{ width: 280, height: 380 }} />
          </div>
        </div>
      ) : !hasAnything ? (
        <div style={{ padding: "60px 24px 0", textAlign: "center" }}>
          <p style={{
            fontFamily: FONT,
            fontSize: 12,
            fontWeight: 400,
            lineHeight: "14.4px",
            letterSpacing: "0.24px",
            textTransform: "uppercase",
            color: COLOR.muted,
            margin: 0,
            marginBottom: 10,
          }}>
            Nothing This Week
          </p>
          <p style={{
            fontFamily: FONT,
            fontSize: 15,
            fontWeight: 400,
            lineHeight: "21.75px",
            color: COLOR.text,
            margin: 0,
            maxWidth: 280,
            marginInline: "auto",
          }}>
            Check back in a few days. New events are added all the time.
          </p>
        </div>
      ) : (
        <>
          {/* Featured */}
          {featuredEvents.length > 0 && (
            <section style={{ marginBottom: 8 }}>
              <SectionHead overline="Featured" heading="This Month" />
              <div className="overflow-x-auto scrollbar-hide" style={{ scrollSnapType: "x proximity" }}>
                <div style={{ display: "inline-flex", padding: "0 24px 40px 24px", gap: 14 }}>
                  {featuredEvents.map((event) => {
                    const meta = buildDateMeta(event);
                    const location = event.location ? event.location.replace(/<[^>]*>/g, "").trim() : "";
                    return (
                      <Link
                        key={event.id}
                        to={`/events/${event.id}`}
                        style={{
                          flexShrink: 0,
                          position: "relative",
                          overflow: "hidden",
                          width: 280,
                          height: 380,
                          borderRadius: 24,
                          transition: "transform 0.15s ease",
                          scrollSnapAlign: "start",
                          textDecoration: "none",
                          display: "block",
                        }}
                        {...pressHandlers}
                      >
                        {event.image_url ? (
                          <img
                            src={event.image_url}
                            alt={event.title}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            loading="lazy"
                          />
                        ) : (
                          <div style={{ width: "100%", height: "100%", background: COLOR.warm }} />
                        )}
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.7) 100%)",
                          }}
                        />

                        {/* Top row */}
                        <div style={{
                          position: "absolute",
                          top: 18,
                          left: 18,
                          right: 18,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}>
                          {event.tag ? (
                            <span style={{
                              background: "rgba(255,255,255,0.18)",
                              backdropFilter: "blur(8px)",
                              WebkitBackdropFilter: "blur(8px)",
                              color: "#FFFFFF",
                              padding: "6px 12px",
                              borderRadius: 999,
                              fontFamily: FONT,
                              fontSize: 11,
                              fontWeight: 400,
                              lineHeight: "13px",
                              letterSpacing: "0.22px",
                              textTransform: "uppercase",
                            }}>
                              {event.tag}
                            </span>
                          ) : <span />}
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: "rgba(255,255,255,0.2)",
                            backdropFilter: "blur(8px)",
                            WebkitBackdropFilter: "blur(8px)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}>
                            <ArrowUpRight size={14} strokeWidth={1.75} style={{ color: "#FFFFFF" }} />
                          </div>
                        </div>

                        {/* Bottom meta */}
                        <div style={{ position: "absolute", bottom: 20, left: 20, right: 20 }}>
                          {meta && (
                            <p style={{
                              fontFamily: FONT,
                              fontSize: 12,
                              fontWeight: 400,
                              lineHeight: "14.4px",
                              letterSpacing: "0.24px",
                              textTransform: "uppercase",
                              color: "rgba(255,255,255,0.78)",
                              margin: 0,
                              marginBottom: 8,
                            }}>
                              {meta}
                            </p>
                          )}
                          <h3 style={{
                            fontFamily: FONT,
                            fontWeight: 700,
                            fontSize: 28,
                            lineHeight: "30px",
                            letterSpacing: "-0.84px",
                            color: "#FFFFFF",
                            margin: 0,
                            marginBottom: 8,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}>
                            {event.title}
                          </h3>
                          {location && (
                            <p style={{
                              fontFamily: FONT,
                              fontSize: 13,
                              fontWeight: 400,
                              lineHeight: "18.2px",
                              letterSpacing: "0.13px",
                              color: "rgba(255,255,255,0.78)",
                              margin: 0,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
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
            <section>
              <SectionHead overline="Save The Date" heading={activeFilter === "past" ? "Past" : "Upcoming"} />
              <div style={{ padding: "0 24px 40px 24px" }}>
                <div style={{
                  background: COLOR.card,
                  borderRadius: 24,
                  padding: "8px 20px",
                }}>
                  {upcomingEvents.map((event, idx) => (
                    <EventRow
                      key={event.id}
                      event={event}
                      showDivider={idx < upcomingEvents.length - 1}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Recurring — grouped by cadence */}
          {activeFilter !== "past" && (() => {
            const groups: { heading: string; events: typeof recurringEvents }[] = [
              { heading: "Every Day", events: [] },
              { heading: "Every Week", events: [] },
              { heading: "Every Month", events: [] },
              { heading: "Every Quarter", events: [] },
              { heading: "Every Year", events: [] },
              { heading: "Other", events: [] },
            ];
            for (const e of recurringEvents) {
              const r = (e.recurrence || "").toLowerCase();
              if (r.includes("daily") || r.includes("every day")) groups[0].events.push(e);
              else if (r.includes("weekly") || r.includes("every week") || /every\s+(mon|tue|wed|thu|fri|sat|sun)/.test(r) || r.includes("first") || r.includes("last")) groups[1].events.push(e);
              else if (r.includes("monthly") || r.includes("every month")) groups[2].events.push(e);
              else if (r.includes("quarterly") || r.includes("quarter")) groups[3].events.push(e);
              else if (r.includes("yearly") || r.includes("annual") || r.includes("every year")) groups[4].events.push(e);
              else groups[5].events.push(e);
            }
            return groups
              .filter((g) => g.events.length > 0)
              .map((g) => (
                <section key={g.heading}>
                  <SectionHead overline="Happens Regularly" heading={g.heading} />
                  <div style={{ padding: "0 24px 40px 24px" }}>
                    <div style={{
                      background: COLOR.card,
                      borderRadius: 24,
                      padding: "8px 20px",
                    }}>
                      {g.events.map((event, idx) => (
                        <EventRow
                          key={event.id}
                          event={event}
                          showDivider={idx < g.events.length - 1}
                          metaOverride={shortenRecurrence(event.recurrence)}
                        />
                      ))}
                    </div>
                  </div>
                </section>
              ));
          })()}
        </>
      )}
    </div>
  );
};

export default Events;
