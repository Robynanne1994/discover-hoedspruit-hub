import { Search, ArrowUpRight, Bookmark, SlidersHorizontal, Check } from "lucide-react";
import { useState, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { parse, isToday, isBefore, startOfToday, startOfWeek, endOfWeek, endOfMonth, isWithinInterval } from "date-fns";

type FilterType = "all" | "today" | "this-week" | "this-month" | "upcoming" | "past";

const FONT = "'Helvetica Neue', 'Helvetica World', Helvetica, Arial, sans-serif";

const COLOR = {
  bg: "#EBEBEB",
  card: "#FFFFFF",
  warm: "#F2EFEC",
  text: "#0A0A0A",
  muted: "#8A8480",
  divider: "#E8E4DF",
};

import { getEventSortDate, formatEventDateShort } from "@/lib/eventDates";

function parseDateText(_raw: string, event?: any): Date | null {
  // Legacy signature kept for callers that only have raw text.
  if (event) return getEventSortDate(event);
  return null;
}

function formatEventDate(_raw: string, event?: any): string {
  if (event) return formatEventDateShort(event);
  return (_raw || "").replace(/<[^>]*>/g, "").trim();
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

function buildDateMeta(event: any): string {
  const date = formatEventDate(event.date, event);
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
  if (lower.includes("year") || lower.includes("annual")) return "Yearly";
  if (lower.includes("month")) return "Monthly";
  if (lower.includes("quarter")) return "Quarterly";
  if (lower.includes("weekly")) return "Weekly";
  // Fallback: cut at first comma or slash, cap at 32 chars
  const cut = clean.split(/[,/]/)[0].trim();
  return cut.length > 32 ? cut.slice(0, 30).trim() + "…" : cut;
}

const filters: { label: string; value: FilterType }[] = [
  { label: "All", value: "all" },
  { label: "Today", value: "today" },
  { label: "This week", value: "this-week" },
  { label: "This month", value: "this-month" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Past", value: "past" },
];

const pressHandlers = {
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(0.98)"; },
  onPointerUp: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(1)"; },
  onPointerLeave: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(1)"; },
};

const SectionHead = ({ overline, heading, subheading, trailing }: { overline: string; heading: string; subheading?: string; trailing?: React.ReactNode }) => {
  const isRecurring = overline === "Recurring";
  return (
  <div style={{ padding: "0 24px 20px 24px" }}>
    {overline && (
      <p style={{
        fontFamily: FONT,
        fontSize: 12,
        fontWeight: 500,
        lineHeight: "14px",
        letterSpacing: "0.24px",
        textTransform: "uppercase",
        color: "#0a0a0a",
        margin: 0,
        marginBottom: isRecurring ? 2 : 8,
      }}>
        {overline}
      </p>
    )}
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
      <h2 style={{
        fontFamily: "'Helvetica World', 'Helvetica Neue', Helvetica, Arial, sans-serif",
        fontWeight: 500,
        fontSize: 35,
        lineHeight: "38px",
        letterSpacing: "-1px",
        color: COLOR.text,
        margin: 0,
        flex: 1,
        minWidth: 0,
        textTransform: "none",
      }}>
        {heading}
      </h2>
      {trailing && <div style={{ flexShrink: 0 }}>{trailing}</div>}
    </div>
    {subheading && (
      <p style={{
        fontFamily: FONT,
        fontSize: 12,
        fontWeight: 400,
        lineHeight: "14.4px",
        letterSpacing: "0.24px",
        textTransform: "uppercase",
        color: COLOR.muted,
        margin: 0,
        marginTop: 10,
      }}>
        {subheading}
      </p>
    )}
  </div>
  );
};

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
              fontSize: 12,
              fontWeight: 400,
              lineHeight: "14px",
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
            fontSize: 14,
            fontWeight: 400,
            lineHeight: "16.8px",
            letterSpacing: "-0.14px",
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
              fontSize: 12,
              fontWeight: 400,
              lineHeight: "16px",
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
  const [activeTag, setActiveTag] = useState<string | null>(null);
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
      .map((e) => ({ ...e, _parsed: parseDateText(e.date, e) }))
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

  const recurringEventsAll = useMemo(
    () => searched.filter((e) => e.recurrence && e.recurrence.trim() !== "" && e.recurrence.trim().toLowerCase() !== "none"),
    [searched]
  );

  const datedEventsAll = useMemo(() => {
    const today = startOfToday();
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const monthEnd = endOfMonth(today);
    const nonRecurring = searched.filter((e) => !e.recurrence || e.recurrence.trim() === "" || e.recurrence.trim().toLowerCase() === "none");
    if (activeFilter === "all") return nonRecurring.filter((e) => !e._parsed || !isBefore(e._parsed, today));
    return nonRecurring.filter((event) => {
      const date = event._parsed;
      if (!date) return activeFilter === "upcoming";
      switch (activeFilter) {
        case "today": return isToday(date);
        case "this-week": return isWithinInterval(date, { start: today, end: weekEnd });
        case "this-month": return isWithinInterval(date, { start: today, end: monthEnd });
        case "upcoming": return !isBefore(date, today);
        case "past": return isBefore(date, today) && !isToday(date);
        default: return true;
      }
    });
  }, [searched, activeFilter]);

  // Tags available within current pill-filter scope
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    [...datedEventsAll, ...recurringEventsAll].forEach((e) => {
      if (e.tag && e.tag.trim()) set.add(e.tag.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [datedEventsAll, recurringEventsAll]);

  // Reset tag if no longer available
  useMemo(() => {
    if (activeTag && !availableTags.includes(activeTag)) setActiveTag(null);
  }, [availableTags, activeTag]);

  const matchesTag = (e: any) => !activeTag || (e.tag && e.tag.trim() === activeTag);
  const recurringEvents = useMemo(() => recurringEventsAll.filter(matchesTag), [recurringEventsAll, activeTag]);
  const datedEvents = useMemo(() => datedEventsAll.filter(matchesTag), [datedEventsAll, activeTag]);

  const featuredEvents = useMemo(
    () => datedEvents.filter((e) => e.is_featured).slice(0, 8),
    [datedEvents]
  );

  const upcomingEvents = useMemo(() => {
    const featuredIds = new Set(featuredEvents.map((e) => e.id));
    return datedEvents.filter((e) => !featuredIds.has(e.id));
  }, [datedEvents, featuredEvents]);

  const hasAnything = featuredEvents.length > 0 || upcomingEvents.length > 0 || recurringEvents.length > 0;

  const tagFilterButton = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Filter by tag"
          disabled={availableTags.length === 0}
          style={{
            flexShrink: 0,
            height: 36,
            paddingInline: activeTag ? 14 : 0,
            width: activeTag ? "auto" : 36,
            background: activeTag ? COLOR.text : COLOR.card,
            color: activeTag ? "#FFFFFF" : COLOR.text,
            border: "none",
            borderRadius: 999,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            cursor: availableTags.length === 0 ? "not-allowed" : "pointer",
            opacity: availableTags.length === 0 ? 0.4 : 1,
            boxShadow: activeTag ? "none" : "0 1px 2px rgba(0,0,0,0.04)",
            fontFamily: FONT,
            fontSize: 13,
            fontWeight: 400,
            whiteSpace: "nowrap",
            transition: "background 0.15s ease, color 0.15s ease",
          }}
        >
          <SlidersHorizontal size={15} strokeWidth={1.75} />
          {activeTag && <span>{activeTag}</span>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" style={{ maxHeight: 320, overflowY: "auto" }}>
        <DropdownMenuItem onClick={() => setActiveTag(null)}>
          <span style={{ flex: 1 }}>All tags</span>
          {!activeTag && <Check size={14} />}
        </DropdownMenuItem>
        {availableTags.map((tag) => (
          <DropdownMenuItem key={tag} onClick={() => setActiveTag(tag)}>
            <span style={{ flex: 1, textTransform: "capitalize" }}>{tag}</span>
            {activeTag === tag && <Check size={14} />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Decide which section heading shows the tag filter (the first visible one)
  const filterSlot: "featured" | "upcoming" | "recurring" =
    featuredEvents.length > 0 ? "featured" : upcomingEvents.length > 0 ? "upcoming" : "recurring";

  return (
    <div className="min-h-screen" style={{ background: "transparent", paddingBottom: 140, fontFamily: FONT }}>

      {/* Page header */}
      <div style={{ padding: "16px 24px 28px 24px" }}>
        <h1 style={{
          fontFamily: "'Helvetica World', Helvetica, Arial, sans-serif",
          fontWeight: 500,
          fontSize: 40,
          lineHeight: 1,
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
      <div style={{ marginBottom: 32 }}>
        <div className="overflow-x-auto scrollbar-hide">
          <div style={{ display: "inline-flex", gap: 8, padding: "0 56px 0 24px" }}>
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
        (() => {
          const emptyHeading =
            activeFilter === "today"
              ? "Today"
              : activeFilter === "past"
                ? "Past"
                : activeFilter === "this-month"
                  ? new Date().toLocaleString("en-US", { month: "long", year: "numeric" })
                  : activeFilter === "this-week"
                    ? "This week"
                    : "Upcoming";
          const emptyOverline =
            activeFilter === "today"
              ? (() => {
                  const d = new Date();
                  return `${d.getDate()} ${d.toLocaleString("en-US", { month: "long" })} ${d.getFullYear()}`;
                })()
              : "";
          return (
            <>
              <SectionHead overline={emptyOverline} heading={emptyHeading} trailing={tagFilterButton} />
              <div style={{ padding: "20px 24px 0", textAlign: "center" }}>
                <p style={{
                  fontFamily: FONT,
                  fontSize: 15,
                  fontWeight: 400,
                  lineHeight: "21.75px",
                  color: COLOR.text,
                  margin: 0,
                  marginBottom: 16,
                  maxWidth: 320,
                  marginInline: "auto",
                }}>
                  No events found.
                </p>
                <button
                  onClick={() => {
                    setActiveTag(null);
                    setActiveFilter("all");
                  }}
                  style={{
                    background: COLOR.text,
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 999,
                    padding: "10px 20px",
                    fontFamily: FONT,
                    fontSize: 14,
                    fontWeight: 400,
                    lineHeight: "16.8px",
                    cursor: "pointer",
                  }}
                >
                  Remove filters
                </button>
              </div>
            </>
          );
        })()
      ) : (
        <>
          {/* Featured */}
          {featuredEvents.length > 0 && (
            <section style={{ marginBottom: 8 }}>
              <SectionHead overline="Featured" heading="Monthly" trailing={filterSlot === "featured" ? tagFilterButton : undefined} />
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
                            fontWeight: 400,
                            fontSize: 14,
                            lineHeight: "16.8px",
                            letterSpacing: "-0.14px",
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
              <SectionHead
                overline={
                  activeFilter === "today"
                    ? (() => {
                        const d = new Date();
                        return `${d.getDate()} ${d.toLocaleString("en-US", { month: "long" })} ${d.getFullYear()}`;
                      })()
                    : activeFilter === "this-week"
                      ? (() => {
                          const ws = startOfWeek(new Date(), { weekStartsOn: 1 });
                          const we = endOfWeek(new Date(), { weekStartsOn: 1 });
                          const fmt = (d: Date) => `${d.getDate()} ${d.toLocaleString("en-US", { month: "short" })}`;
                          return `${fmt(ws)} – ${fmt(we)} ${we.getFullYear()}`;
                        })()
                      : ""
                }
                heading={
                  activeFilter === "today"
                    ? "Today"
                    : activeFilter === "past"
                      ? "Past"
                      : activeFilter === "this-month"
                        ? new Date().toLocaleString("en-US", { month: "long", year: "numeric" })
                        : activeFilter === "this-week"
                          ? "This week"
                          : "Upcoming"
                }
                trailing={filterSlot === "upcoming" ? tagFilterButton : undefined}
              />
              <div style={{ padding: "0 24px 40px 24px" }}>
                <div style={{
                  background: COLOR.card,
                  borderRadius: 24,
                  padding: "8px 12px",
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
          {activeFilter !== "past" && activeFilter !== "today" && (() => {
            const groups: { heading: string; events: typeof recurringEvents }[] = [
              { heading: "Daily", events: [] },
              { heading: "Weekly", events: [] },
              { heading: "Monthly", events: [] },
              { heading: "Quarterly", events: [] },
              { heading: "Yearly", events: [] },
              { heading: "Other", events: [] },
            ];
            const now = startOfToday();
            for (const e of recurringEvents) {
              const r = (e.recurrence || "").toLowerCase();
              if (r.includes("daily") || r.includes("every day")) groups[0].events.push(e);
              else if (r.includes("weekly") || r.includes("every week") || /every\s+(mon|tue|wed|thu|fri|sat|sun)/.test(r) || r.includes("first") || r.includes("last")) groups[1].events.push(e);
              else if (r.includes("monthly") || r.includes("every month")) groups[2].events.push(e);
              else if (r.includes("quarterly") || r.includes("quarter")) groups[3].events.push(e);
              else if (r.includes("yearly") || r.includes("annual") || r.includes("every year")) groups[4].events.push(e);
              else groups[5].events.push(e);
            }
            // For "This Month", hide quarterly/yearly/other unless their date falls within current month
            if (activeFilter === "this-month") {
              const inMonth = (e: typeof recurringEvents[number]) => {
                const d = e._parsed;
                return !!d && d.getMonth() === now.getMonth();
              };
              groups[3].events = groups[3].events.filter(inMonth);
              groups[4].events = groups[4].events.filter(inMonth);
              groups[5].events = groups[5].events.filter(inMonth);
            }
            // For "This Week", hide monthly/quarterly/yearly/other unless their date falls within current week
            if (activeFilter === "this-week") {
              const ws = startOfWeek(now, { weekStartsOn: 1 });
              const we = endOfWeek(now, { weekStartsOn: 1 });
              const inWeek = (e: typeof recurringEvents[number]) => {
                const d = e._parsed;
                return !!d && isWithinInterval(d, { start: ws, end: we });
              };
              groups[2].events = groups[2].events.filter(inWeek);
              groups[3].events = groups[3].events.filter(inWeek);
              groups[4].events = groups[4].events.filter(inWeek);
              groups[5].events = groups[5].events.filter(inWeek);
            }
            return groups
              .filter((g) => g.events.length > 0)
              .map((g, gIdx) => (
                <section key={g.heading}>
                  <SectionHead overline="Recurring" heading={g.heading} trailing={filterSlot === "recurring" && gIdx === 0 ? tagFilterButton : undefined} />
                  <div style={{ padding: "0 24px 40px 24px" }}>
                    <div style={{
                      background: COLOR.card,
                      borderRadius: 24,
                      padding: "8px 12px",
                    }}>
                      {g.events.map((event, idx) => (
                        <EventRow
                          key={event.id}
                          event={event}
                          showDivider={idx < g.events.length - 1}
                          metaOverride={buildDateMeta(event) || shortenRecurrence(event.recurrence)}
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
