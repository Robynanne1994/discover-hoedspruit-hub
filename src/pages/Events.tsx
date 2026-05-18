import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Search, SlidersHorizontal, MapPin, ChevronLeft, ChevronRight, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RefineDrawer, RefineSection, RefineOption } from "@/components/RefineDrawer";
import { Skeleton } from "@/components/ui/skeleton";
import {
  isToday,
  isBefore,
  startOfToday,
  startOfWeek,
  endOfWeek,
  endOfMonth,
  isWithinInterval,
  isSameDay,
  addDays,
  format,
} from "date-fns";
import { getEventSortDate, getEventDates } from "@/lib/eventDates";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const C = {
  page: "#ebebeb",
  ivory: "#f5f0e8",
  white: "#ffffff",
  ink: "#020202",
  body: "#2b2420",
  muted: "#6b6a5e",
  dark: "#48484a",
  tag: "#e8e1d4",
};

type FilterType = "all" | "today" | "this-week" | "this-weekend" | "this-month" | "this-year" | "past";

const FILTERS: { label: string; value: FilterType }[] = [
  { label: "All", value: "all" },
  { label: "Today", value: "today" },
  { label: "This Week", value: "this-week" },
  { label: "This Weekend", value: "this-weekend" },
  { label: "This Month", value: "this-month" },
  { label: "This Year", value: "this-year" },
  { label: "Past", value: "past" },
];

// Weekend = Saturday + Sunday of the current ISO week (Mon-start).
// If today is Sat/Sun, weekend starts today; otherwise the upcoming Sat.
function getWeekendRange(today: Date): { start: Date; end: Date } {
  const day = today.getDay(); // 0 Sun .. 6 Sat
  let start: Date;
  if (day === 6) start = today; // Saturday
  else if (day === 0) start = addDays(today, -1); // Sunday → Sat
  else start = addDays(today, 6 - day); // upcoming Saturday
  const end = addDays(start, 1); // Sunday
  return { start, end };
}

const WEEKDAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function fmtTime(t: string | null | undefined): string {
  if (!t) return "";
  const m = String(t).match(/^(\d{1,2}):?(\d{0,2})/);
  if (!m) return "";
  const h = parseInt(m[1]);
  const min = m[2] ? parseInt(m[2]) : 0;
  if (isNaN(h)) return "";
  const ampm = h >= 12 ? "PM" : "AM";
  const dh = h === 0 ? 12 : h > 12 ? h - 12 : h;
  if (min === 0) return `${dh}:00 ${ampm}`;
  return `${dh}:${String(min).padStart(2, "0")} ${ampm}`;
}

function eventDateLine(e: any): string {
  const { start, end } = getEventDates(e);
  if (!start) return (e.date || "").replace(/<[^>]*>/g, "").trim();
  const sameDay = !end || start.getTime() === end.getTime();
  const dPart = sameDay
    ? format(start, "EEE, d MMM")
    : `${format(start, "d")} – ${format(end!, "d MMM")}`;
  const time = fmtTime(e.start_time);
  return time ? `${dPart} • ${time}` : dPart;
}

function formatPrice(p: string | number | null | undefined): string {
  if (p === null || p === undefined) return "Free";
  const s = String(p).trim();
  if (!s || /^(free|0|r0)$/i.test(s)) return "Free";
  // Match numbers including thousands separators (comma/space/dot) e.g. "1,000", "1 000", "1.000"
  const matches = s.match(/\d[\d.,\s]*\d|\d/g);
  const hasRange = /[-–—]|\bto\b/i.test(s);
  if (hasRange && matches && matches.length >= 2) {
    // Use first number verbatim (preserves "1,000" / "1 000" formatting)
    const firstRaw = matches[0].trim();
    return `From R${firstRaw}`;
  }
  if (/^\d/.test(s)) return `R${s}`;
  return s;
}

// Week strip --------------------------------------------------------
const WeekStrip = ({
  anchor,
  selectedDate,
  onSelect,
  onShift,
  onClear,
}: {
  anchor: Date;
  selectedDate: Date | null;
  onSelect: (d: Date) => void;
  onShift: (days: number) => void;
  onClear: () => void;
}) => {
  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  return (
    <div
      style={{
        background: C.white,
        borderRadius: 16,
        padding: "16px 18px 18px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h2
          style={{
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 18,
            color: C.ink,
            margin: 0,
            letterSpacing: "0.01em",
          }}
        >
          {format(anchor, "MMMM yyyy")}
        </h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            aria-label="Previous week"
            onClick={() => onShift(-7)}
            style={navBtn}
          >
            <ChevronLeft size={16} color={C.ink} strokeWidth={1.8} />
          </button>
          <button
            aria-label="Next week"
            onClick={() => onShift(7)}
            style={navBtn}
          >
            <ChevronRight size={16} color={C.ink} strokeWidth={1.8} />
          </button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {days.map((d, i) => {
          const selected = selectedDate && isSameDay(d, selectedDate);
          return (
            <button
              key={i}
              onClick={() => onSelect(d)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                padding: "8px 4px",
                borderRadius: 999,
                border: "none",
                background: selected ? C.dark : "transparent",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  fontFamily: SANS,
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  color: selected ? "#ebebeb" : C.muted,
                }}
              >
                {WEEKDAY_LABELS[i]}
              </span>
              <span
                style={{
                  fontFamily: SANS,
                  fontWeight: 700,
                  fontSize: 18,
                  color: selected ? "#fff" : C.ink,
                }}
              >
                {d.getDate()}
              </span>
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
        <button
          onClick={onClear}
          style={{
            background: "transparent",
            border: "none",
            padding: "4px 0",
            cursor: "pointer",
            fontFamily: SANS,
            fontSize: 12,
            fontWeight: 700,
            color: C.muted,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
};

const navBtn: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: "50%",
  background: C.white,
  border: `1px solid ${C.tag}`,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

// Event card --------------------------------------------------------
const EventCard = ({ event }: { event: any }) => {
  const location = event.location ? event.location.replace(/<[^>]*>/g, "").trim() : "";
  const price = formatPrice(event.price);
  const tag = event.tag?.trim();
  return (
    <Link
      to={`/events/${event.id}`}
      style={{
        display: "flex",
        alignItems: "stretch",
        gap: 14,
        background: C.white,
        borderRadius: 16,
        padding: 12,
        textDecoration: "none",
      }}
    >
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: 12,
          overflow: "hidden",
          background: C.ivory,
          flexShrink: 0,
        }}
      >
        {event.image_url && (
          <img
            src={event.image_url}
            alt={event.title}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <h3
          style={{
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 13.5,
            lineHeight: 1.25,
            color: C.ink,
            margin: 0,
            marginBottom: 6,
            wordBreak: "break-word",
            overflowWrap: "anywhere",
          }}
        >
          {event.title}
        </h3>
        <p
          style={{
            fontFamily: SANS,
            fontSize: 12.5,
            color: C.body,
            margin: 0,
            marginBottom: 4,
          }}
        >
          {eventDateLine(event)}
        </p>
        {location && (
          <p
            style={{
              fontFamily: SANS,
              fontSize: 12,
              color: C.muted,
              margin: 0,
              display: "flex",
              alignItems: "flex-start",
              gap: 4,
              wordBreak: "break-word",
              overflowWrap: "anywhere",
            }}
          >
            <MapPin size={11} strokeWidth={1.8} style={{ flexShrink: 0, marginTop: 3 }} />
            <span>{location}</span>
          </p>
        )}

      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexShrink: 0,
          gap: 8,
          paddingLeft: 4,
        }}
      >
        {price.startsWith("From ") ? (
          <span
            style={{
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: 14,
              color: C.ink,
              textAlign: "right",
              lineHeight: 1.15,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em" }}>From</span>
            <span>{price.slice(5)}</span>
          </span>
        ) : (
          <span
            style={{
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: 14,
              color: C.ink,
            }}
          >
            {price}
          </span>
        )}
        {tag && (
          <span
            style={{
              fontFamily: SANS,
              fontSize: 11,
              color: C.body,
              background: C.tag,
              borderRadius: 999,
              padding: "4px 10px",
              whiteSpace: "nowrap",
            }}
          >
            {tag}
          </span>
        )}
      </div>
    </Link>
  );
};

// Page --------------------------------------------------------------
const Events = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [weekAnchor, setWeekAnchor] = useState<Date>(startOfToday());
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [refineOpen, setRefineOpen] = useState(false);
  const [openSection, setOpenSection] = useState<"tag" | null>("tag");

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
      .map((e) => ({ ...e, _parsed: getEventSortDate(e) }))
      .sort((a, b) => {
        if (a._parsed && b._parsed) return a._parsed.getTime() - b._parsed.getTime();
        if (a._parsed) return -1;
        if (b._parsed) return 1;
        return 0;
      });
  }, [events]);

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    sortedEvents.forEach((e) => {
      [e.tag, e.sub_tag_1, e.sub_tag_2].forEach((t: string | null) => {
        if (t && t.trim()) set.add(t.trim());
      });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [sortedEvents]);

  const filtered = useMemo(() => {
    let list = sortedEvents;
    if (tagFilter) {
      const tf = tagFilter.toLowerCase();
      list = list.filter((e) =>
        [e.tag, e.sub_tag_1, e.sub_tag_2].some((t: string | null) => t && t.toLowerCase() === tf)
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.location && e.location.toLowerCase().includes(q)) ||
          (e.tag && e.tag.toLowerCase().includes(q))
      );
    }

    const today = startOfToday();

    // Specific date selected → show only events on that date
    if (selectedDate) {
      return list.filter((e) => e._parsed && isSameDay(e._parsed, selectedDate));
    }

    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const monthEnd = endOfMonth(today);
    const weekend = getWeekendRange(today);
    const yearEnd = new Date(today.getFullYear(), 11, 31);

    return list.filter((e) => {
      if (!e._parsed) return activeFilter === "all";
      const d = e._parsed;
      if (activeFilter === "all") return !isBefore(d, today);
      if (activeFilter === "today") return isToday(d);
      if (activeFilter === "this-week") return isWithinInterval(d, { start: today, end: weekEnd });
      if (activeFilter === "this-weekend") return isWithinInterval(d, { start: weekend.start, end: weekend.end });
      if (activeFilter === "this-month") return isWithinInterval(d, { start: today, end: monthEnd });
      if (activeFilter === "this-year") return isWithinInterval(d, { start: today, end: yearEnd });
      if (activeFilter === "past") return isBefore(d, today) && !isToday(d);
      return true;
    });
  }, [sortedEvents, search, tagFilter, activeFilter, selectedDate]);

  const sectionTitle = useMemo(() => {
    if (selectedDate) return format(selectedDate, "d MMM yyyy");
    const today = startOfToday();
    switch (activeFilter) {
      case "today":
        return format(today, "d MMM yyyy");
      case "this-week": {
        const end = endOfWeek(today, { weekStartsOn: 1 });
        const sameMonth = today.getMonth() === end.getMonth();
        return sameMonth
          ? `${format(today, "d")} – ${format(end, "d MMM")}`
          : `${format(today, "d MMM")} – ${format(end, "d MMM")}`;
      }
      case "this-weekend": {
        const { start, end } = getWeekendRange(today);
        const sameMonth = start.getMonth() === end.getMonth();
        return sameMonth
          ? `${format(start, "d")} – ${format(end, "d MMM")}`
          : `${format(start, "d MMM")} – ${format(end, "d MMM")}`;
      }
      case "this-month":
        return format(today, "MMMM yyyy");
      case "this-year":
        return format(today, "yyyy");
      case "past":
        return "Past Events";
      default:
        return "Upcoming Events";
    }
  }, [activeFilter, selectedDate]);

  const handleSelectDate = (d: Date) => {
    setSelectedDate(selectedDate && isSameDay(selectedDate, d) ? null : d);
    setWeekAnchor(d);
  };

  const handleFilterPill = (v: FilterType) => {
    setActiveFilter(v);
    setSelectedDate(null);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        paddingTop: 60,
        paddingBottom: 100,
        background: C.page,
        fontFamily: SANS,
        color: C.ink,
      }}
    >
      {/* Header — Specials-style: centered title, icons inline on right */}
      <div
        style={{
          paddingLeft: 20,
          paddingRight: 20,
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div />
        <h1
          style={{
            fontFamily: SANS,
            fontSize: 22,
            fontWeight: 700,
            color: C.ink,
            margin: 0,
            letterSpacing: "-0.3px",
            textAlign: "center",
          }}
        >
          Events
        </h1>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
          <button
            aria-label={searchOpen ? "Close search" : "Search"}
            onClick={() => {
              if (searchOpen) {
                setSearch("");
                setSearchOpen(false);
              } else {
                setSearchOpen(true);
              }
            }}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "transparent",
              border: "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: C.ink,
            }}
          >
            {searchOpen ? <X size={22} strokeWidth={2} /> : <Search size={22} strokeWidth={2} />}
          </button>
          <button
            aria-label="Filters"
            onClick={() => setRefineOpen(true)}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: tagFilter ? C.ink : "transparent",
              border: "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: tagFilter ? C.page : C.ink,
            }}
          >
            <SlidersHorizontal size={20} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Gap before content */}
      <div style={{ height: 24 }} />

      {/* Inline search input */}
      {searchOpen && (
        <div style={{ padding: "0 20px 12px 20px" }}>
          <input
            autoFocus
            type="text"
            placeholder="Search local happenings"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              height: 40,
              borderRadius: 999,
              border: "1px solid rgba(2,2,2,0.12)",
              padding: "0 16px",
              fontFamily: SANS,
              fontSize: 14,
              color: C.ink,
              background: "transparent",
              outline: "none",
            }}
          />
        </div>
      )}

      {/* Filter pills */}
      <div
        style={{
          padding: "16px 20px 32px",
          display: "flex",
          gap: 8,
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        {FILTERS.map((f) => {
          const active = !selectedDate && activeFilter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => handleFilterPill(f.value)}
              style={{
                fontFamily: SANS,
                fontWeight: 700,
                fontSize: 13,
                padding: "8px 18px",
                borderRadius: 999,
                border: active ? "none" : `1px solid ${C.tag}`,
                background: active ? C.dark : C.white,
                color: active ? C.ivory : C.ink,
                cursor: "pointer",
                whiteSpace: "nowrap",
                letterSpacing: "0.01em",
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div style={{ padding: "0 20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 10,
            marginTop: 4,
          }}
        >
          <h2
            style={{
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: 20,
              color: C.ink,
              margin: 0,
              letterSpacing: "0.01em",
            }}
          >
            {sectionTitle}
          </h2>
          {filtered.length > 5 && (
            <span style={{ fontFamily: SANS, fontSize: 12, color: C.muted }}>
              {filtered.length} total
            </span>
          )}
        </div>

        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} style={{ height: 112, borderRadius: 16 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              background: C.white,
              borderRadius: 16,
              padding: "32px 20px",
              textAlign: "center",
            }}
          >
            <p style={{ fontFamily: SANS, fontSize: 14, color: C.body, margin: 0 }}>
              No events match your filters.
            </p>
            {(tagFilter || selectedDate || activeFilter !== "all" || search) && (
              <button
                onClick={() => {
                  setTagFilter(null);
                  setSelectedDate(null);
                  setActiveFilter("all");
                  setSearch("");
                }}
                style={{
                  marginTop: 12,
                  background: "transparent",
                  border: "none",
                  fontFamily: SANS,
                  fontSize: 12,
                  color: C.ink,
                  textDecoration: "underline",
                  cursor: "pointer",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {filtered.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </div>

      <RefineDrawer
        open={refineOpen}
        onClose={() => setRefineOpen(false)}
        onClear={() => setTagFilter(null)}
        resultsCount={filtered.length}
        resultsLabel="events"
      >
        <RefineSection
          isFirst
          label="Tag"
          summary={tagFilter || undefined}
          open={openSection === "tag"}
          onToggle={() => setOpenSection(openSection === "tag" ? null : "tag")}
        >
          <RefineOption
            label="All tags"
            active={!tagFilter}
            onClick={() => setTagFilter(null)}
          />
          {availableTags.map((t) => (
            <RefineOption
              key={t}
              label={t}
              active={tagFilter === t}
              onClick={() => setTagFilter(t)}
            />
          ))}
          {availableTags.length === 0 && (
            <p style={{ fontSize: 13, color: "rgba(0,0,0,0.5)", margin: "4px 0 0 0" }}>
              No tags yet.
            </p>
          )}
        </RefineSection>
      </RefineDrawer>
    </div>
  );
};

const circleBtn: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: "50%",
  background: C.white,
  border: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  flexShrink: 0,
};

export default Events;
