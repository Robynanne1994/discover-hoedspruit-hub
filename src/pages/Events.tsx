import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, MapPin, ChevronLeft, ChevronRight, X, ArrowLeft, Calendar } from "lucide-react";
import SearchBar from "@/components/ui/SearchBar";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { RefineDrawer, RefineSection, RefineOption, RefineRectOption } from "@/components/RefineDrawer";
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
import { getNextOccurrence, getUpcomingPerformancesCount, hasPerformances, parseRecurrenceRule, getEventOccurrences } from "@/lib/eventSchedule";
import { getDisplayTitle, noTitleCaseProps } from "@/lib/displayTitle";
import Seo from "@/components/Seo";


const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const HEAD = "'Bricolage Grotesque', 'Helvetica Neue', Helvetica, Arial, sans-serif";

const C = {
  page: "#E6E0CC",
  ivory: "#f5f0e8",
  white: "#ffffff",
  ink: "#1A1A1A",
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

function getFilterCount(
  filter: FilterType,
  events: any[],
  selectedDate: Date | null
): number {
  if (!events) return 1;
  const today = startOfToday();
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const monthEnd = endOfMonth(today);
  const weekend = getWeekendRange(today);
  const yearEnd = new Date(today.getFullYear(), 11, 31);

  return events.filter((e) => {
    if (!e._parsed) return filter === "all";
    const d = e._parsed;
    if (filter === "all") return !isBefore(d, today);
    if (filter === "today") return isToday(d);
    if (filter === "this-week") return isWithinInterval(d, { start: today, end: weekEnd });
    if (filter === "this-weekend") return isWithinInterval(d, { start: weekend.start, end: weekend.end });
    if (filter === "this-month") return isWithinInterval(d, { start: today, end: monthEnd });
    if (filter === "this-year") return isWithinInterval(d, { start: today, end: yearEnd });
    if (filter === "past") return isBefore(d, today) && !isToday(d);
    return true;
  }).length;
}

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
  if (hasPerformances(e)) {
    const next = getNextOccurrence(e);
    if (next) {
      const time = next.startTime ? fmtTime(next.startTime) : "";
      const datePart = format(next.date, "d MMM");
      return time ? `${datePart} • ${time}` : datePart;
    }
  }
  if (parseRecurrenceRule(e.recurrence)) {
    const next = getNextOccurrence(e);
    if (next) {
      const time = next.startTime ? fmtTime(next.startTime) : "";
      const datePart = `Next: ${format(next.date, "d MMM")}`;
      return time ? `${datePart} • ${time}` : datePart;
    }
  }
  const { start, end } = getEventDates(e);
  if (!start) return (e.date || "").replace(/<[^>]*>/g, "").trim();
  const sameDay = !end || start.getTime() === end.getTime();
  const dPart = sameDay
    ? format(start, "d MMM")
    : `${format(start, "d")} – ${format(end!, "d MMM")}`;
  const time = sameDay ? fmtTime(e.start_time) : "";
  return time ? `${dPart} • ${time}` : dPart;
}

function eventMoreDatesLine(e: any): string | null {
  if (hasPerformances(e)) {
    const next = getNextOccurrence(e);
    if (next) {
      const more = getUpcomingPerformancesCount(e);
      if (more > 0) {
        return `+${more} more date${more === 1 ? "" : "s"}`;
      }
    }
  }
  return null;
}

function formatPrice(p: string | number | null | undefined): string | null {
  if (p === null || p === undefined) return null;
  const s = String(p).trim();
  if (!s) return null;
  if (/^(free|0|r0)$/i.test(s)) return "Free";
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
            fontFamily: HEAD,
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
                  color: selected ? "#E6E0CC" : C.muted,
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
  const moreDates = eventMoreDatesLine(event);
  return (
    <Link
      to={`/events/${event.id}`}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "stretch",
        gap: 14,
        background: C.white,
        borderRadius: 16,
        padding: 0,
        textDecoration: "none",
        overflow: "hidden",
        height: 188,
      }}
    >
      <div
        style={{
          width: 140,
          alignSelf: "stretch",
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
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "12px 12px 12px 0", overflow: "hidden" }}>
        {event.tag && (
          <span
            style={{
              alignSelf: "flex-start",
              display: "inline-flex",
              alignItems: "center",
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: 10,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#fff",
              background: "#423324",
              borderRadius: 999,
              padding: "5px 11px",
              marginBottom: 10,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "100%",
            }}
          >
            {event.tag}
          </span>
        )}
        <h3
          {...noTitleCaseProps(event)}
          style={{
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 15.5,
            lineHeight: 1.25,
            color: C.ink,
            margin: 0,
            marginBottom: 10,
            wordBreak: "break-word",
            overflowWrap: "anywhere",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {getDisplayTitle(event)}
        </h3>
        <div style={{ marginBottom: 6 }}>
          <p
            style={{
              fontFamily: SANS,
              fontSize: 13,
              lineHeight: 1.35,
              color: C.body,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Calendar size={12} strokeWidth={1.8} style={{ flexShrink: 0, color: C.muted }} />
            <span style={{
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}>{eventDateLine(event)}</span>
          </p>
          {moreDates && (
            <p
              style={{
                fontFamily: SANS,
                fontSize: 12,
                lineHeight: 1.35,
                color: C.muted,
                margin: 0,
                marginTop: 2,
                paddingLeft: 18,
              }}
            >
              {moreDates}
            </p>
          )}
        </div>
        {location && (
          <p
            style={{
              fontFamily: SANS,
              fontSize: 12,
              lineHeight: 1.35,
              color: C.muted,
              margin: 0,
              display: "flex",
              alignItems: "flex-start",
              gap: 6,
              wordBreak: "break-word",
              overflowWrap: "anywhere",
              overflow: "hidden",
            }}
          >
            <MapPin size={12} strokeWidth={1.8} style={{ flexShrink: 0, marginTop: 3 }} />
            <span style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}>{location}</span>
          </p>
        )}

      </div>
      {price && (
        <span
          style={{
            position: "absolute",
            bottom: 10,
            right: 10,
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 13,
            color: C.body,
            background: C.tag,
            borderRadius: 999,
            padding: "5px 14px",
            whiteSpace: "nowrap",
          }}
        >
          {price}
        </span>
      )}
    </Link>
  );
};

// Page --------------------------------------------------------------
const Events = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const fromSearch = !!(location.state as { fromSearch?: boolean } | null)?.fromSearch;
  const [searchParams, setSearchParams] = useSearchParams();
  const validFilters: FilterType[] = ["all", "today", "this-week", "this-weekend", "this-month", "this-year", "past"];
  const urlFilter = searchParams.get("f") as FilterType | null;
  const activeFilter: FilterType = urlFilter && validFilters.includes(urlFilter) ? urlFilter : "all";
  const urlDate = searchParams.get("d");
  const selectedDate: Date | null = urlDate && /^\d{4}-\d{2}-\d{2}$/.test(urlDate) ? new Date(urlDate + "T00:00:00") : null;
  const search = searchParams.get("q") ?? "";
  const tagFilter = searchParams.get("t");
  const validSorts = ["date-asc", "date-desc", "title-asc", "title-desc"] as const;
  type SortType = typeof validSorts[number];
  const urlSort = searchParams.get("s") as SortType | null;
  const sortBy: SortType = urlSort && (validSorts as readonly string[]).includes(urlSort) ? urlSort : "date-asc";
  const filterBarRef = useRef<HTMLDivElement | null>(null);
  const activePillRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    const bar = filterBarRef.current;
    const pill = activePillRef.current;
    if (!bar || !pill) return;
    const target = pill.offsetLeft - (bar.clientWidth - pill.clientWidth) / 2;
    bar.scrollTo({ left: Math.max(0, target), behavior: "auto" });
  }, [activeFilter, selectedDate]);
  const updateParams = (patch: Record<string, string | null>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(patch).forEach(([k, v]) => {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      });
      return next;
    }, { replace: true });
  };
  const setActiveFilter = (f: FilterType) => updateParams({ f: f === "all" ? null : f });
  const setSelectedDate = (d: Date | null) => updateParams({ d: d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : null });
  const setSearch = (q: string) => updateParams({ q: q || null });
  const setTagFilter = (t: string | null) => updateParams({ t: t || null });
  const setSortBy = (s: SortType) => updateParams({ s: s === "date-asc" ? null : s });
  const [weekAnchor, setWeekAnchor] = useState<Date>(selectedDate ?? startOfToday());
  const [searchOpen, setSearchOpen] = useState(!!search);
  const [refineOpen, setRefineOpen] = useState(false);
  const [openSection, setOpenSection] = useState<"tag" | "sort" | "price" | null>("tag");
  const persistedFilters = (location.state as { filters?: { priceFilter?: "any" | "free" | "paid" } } | null)?.filters ?? null;
  const [priceFilter, setPriceFilter] = useState<"any" | "free" | "paid">(persistedFilters?.priceFilter ?? "any");

  useEffect(() => {
    navigate(location.pathname + location.search, {
      replace: true,
      state: {
        ...(location.state as object | null),
        filters: { priceFilter },
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceFilter]);



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
      .map((e) => {
        const next = getNextOccurrence(e, now);
        // _parsed = the date used for filtering pills / week strip / "is in the future?"
        // Prefer the next upcoming occurrence (handles performances + recurrence);
        // fall back to the legacy start date so "Past" filter still works for old events.
        return { ...e, _parsed: next ? next.date : getEventSortDate(e) };
      })
      .sort((a, b) => {
        if (a._parsed && b._parsed) return a._parsed.getTime() - b._parsed.getTime();
        if (a._parsed) return -1;
        if (b._parsed) return 1;
        return 0;
      });
  }, [events]);

  const availableTags = useMemo(() => {
    const today = startOfToday();
    const set = new Set<string>();
    // Only collect the primary tag/category from upcoming events.
    sortedEvents.forEach((e) => {
      if (!e._parsed || isBefore(e._parsed, today)) return;
      if (e.tag && e.tag.trim()) set.add(e.tag.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [sortedEvents]);

  // Counts per tag respecting all other active filters (not the tag filter itself).
  const tagCounts = useMemo(() => {
    const today = startOfToday();
    const map = new Map<string, number>();
    const q = search.trim().toLowerCase();
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const monthEnd = endOfMonth(today);
    const weekend = getWeekendRange(today);
    const yearEnd = new Date(today.getFullYear(), 11, 31);

    sortedEvents.forEach((e) => {
      if (q) {
        const hit =
          e.title.toLowerCase().includes(q) ||
          (e.location && e.location.toLowerCase().includes(q)) ||
          (e.tag && e.tag.toLowerCase().includes(q));
        if (!hit) return;
      }
      if (selectedDate) {
        const dayStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        const occs = getEventOccurrences(e, { from: dayStart, to: dayEnd, now: dayStart });
        if (!(occs.length > 0 || (e._parsed && isSameDay(e._parsed, selectedDate)))) return;
      } else {
        if (!e._parsed) {
          if (activeFilter !== "all") return;
        } else {
          const d = e._parsed;
          if (activeFilter === "all" && isBefore(d, today)) return;
          else if (activeFilter === "today" && !isToday(d)) return;
          else if (activeFilter === "this-week" && !isWithinInterval(d, { start: today, end: weekEnd })) return;
          else if (activeFilter === "this-weekend" && !isWithinInterval(d, { start: weekend.start, end: weekend.end })) return;
          else if (activeFilter === "this-month" && !isWithinInterval(d, { start: today, end: monthEnd })) return;
          else if (activeFilter === "this-year" && !isWithinInterval(d, { start: today, end: yearEnd })) return;
          else if (activeFilter === "past" && !(isBefore(d, today) && !isToday(d))) return;
        }
      }
      const t = (e.tag || "").trim();
      if (t) map.set(t, (map.get(t) || 0) + 1);
    });
    return map;
  }, [sortedEvents, search, activeFilter, selectedDate]);




  const filtered = useMemo(() => {
    let list = sortedEvents;
    if (tagFilter) {
      const tf = tagFilter.toLowerCase();
      list = list.filter((e) => e.tag && e.tag.toLowerCase() === tf);
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

    // Specific date selected → show only events on that date.
    // For multi-performance / recurring events, match if ANY occurrence falls on that day.
    if (selectedDate) {
      const dayStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      list = list.filter((e) => {
        const occs = getEventOccurrences(e, { from: dayStart, to: dayEnd, now: dayStart });
        if (occs.length > 0) return true;
        return e._parsed && isSameDay(e._parsed, selectedDate);
      });
    } else {
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
      const monthEnd = endOfMonth(today);
      const weekend = getWeekendRange(today);
      const yearEnd = new Date(today.getFullYear(), 11, 31);

      list = list.filter((e) => {
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
    }


    // Price filter
    if (priceFilter !== "any") {
      list = list.filter((e) => {
        const raw = e.price == null ? "" : String(e.price).trim();
        const isFree = /^(free|0|r0|r\s*0)$/i.test(raw);
        const hasNum = /\d/.test(raw) && !isFree;
        if (priceFilter === "free") return isFree;
        if (priceFilter === "paid") return hasNum;
        return true;
      });
    }

    const sorted = [...list];
    if (sortBy === "date-desc") {
      sorted.sort((a, b) => {
        const at = a._parsed ? a._parsed.getTime() : 0;
        const bt = b._parsed ? b._parsed.getTime() : 0;
        return bt - at;
      });
    } else if (sortBy === "title-asc") {
      sorted.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else if (sortBy === "title-desc") {
      sorted.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
    }
    // date-asc is already the default order from sortedEvents
    return sorted;
  }, [sortedEvents, search, tagFilter, activeFilter, selectedDate, sortBy, priceFilter]);


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
    updateParams({ f: v === "all" ? null : v, d: null });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        paddingBottom: 100,
        background: C.page,
        fontFamily: SANS,
        color: C.ink,
      }}
    >
      <Seo
        title="What's On in Hoedspruit — Events"
        description="Browse upcoming events, markets, festivals and things to do in Hoedspruit and the surrounding Lowveld."
        path="/events"
      />

      {/* Header — centered title, icons inline on right */}
      <PageHeader
        title="Events"
        left={
          fromSearch ? (
            <button
              onClick={() => navigate("/search")}
              aria-label="Back to search"
              style={{
                width: 40,
                height: 40,
                borderRadius: 999,
                background: "#FFFFFF",
                border: "1px solid rgba(0,0,0,0.06)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#1A1A1A",
              }}
            >
              <ArrowLeft size={18} strokeWidth={1.8} />
            </button>
          ) : null
        }
        right={
          <>
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
                width: 40,
                height: 40,
                borderRadius: 999,
                background: "#FFFFFF",
                border: "1px solid rgba(0,0,0,0.06)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#1A1A1A",
              }}
            >
              {searchOpen ? <X size={18} strokeWidth={1.8} /> : <Search size={18} strokeWidth={1.8} />}
            </button>
            <button
              aria-label="FILTER & SORT"
              onClick={() => setRefineOpen(true)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 999,
                background: tagFilter ? C.ink : "#FFFFFF",
                border: "1px solid rgba(0,0,0,0.06)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: tagFilter ? C.page : "#1A1A1A",
              }}
            >
              <SlidersHorizontal size={18} strokeWidth={1.8} />
            </button>
          </>
        }
      />

      {/* Gap before content */}
      <div style={{ height: 10 }} />



      {/* Inline search input */}
      {searchOpen && (
        <div style={{ padding: "0 20px 12px 20px" }}>
          <SearchBar
            variant="light"
            value={search}
            onChange={setSearch}
            placeholder="Search local happenings"
            autoFocus
          />
        </div>
      )}

      {/* Filter pills — hidden while a search term is active */}
      {!search.trim() && (
        <div
          ref={filterBarRef}
          style={{
            padding: "16px 20px 32px",
            display: "flex",
            gap: 10,
            alignItems: "center",
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          {FILTERS.map((f) => {
            const active = !selectedDate && activeFilter === f.value;
            const count = getFilterCount(f.value, sortedEvents, selectedDate);
            return (
              <button
                key={f.value}
                ref={active ? activePillRef : undefined}
                onClick={() => handleFilterPill(f.value)}
                style={{
                  background: active ? "#423324" : "#FFFFFF",
                  border: `1px solid ${active ? "#423324" : "#E2DAC6"}`,
                  borderRadius: 999,
                  padding: "8px 18px",
                  cursor: "pointer",
                  fontFamily: SANS,
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.01em",
                  color: active ? "#FFFFFF" : C.ink,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {f.label} <span style={{ opacity: 1 }}>({count})</span>
              </button>
            );
          })}
        </div>
      )}
      {search.trim() && <div style={{ height: 20 }} />}



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
              fontFamily: HEAD,
              fontWeight: 700,
              fontSize: 20,
              color: C.ink,
              margin: 0,
              letterSpacing: "0.01em",
            }}
          >
            {sectionTitle}
          </h2>
          <span
            style={{
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: 15,
              color: C.ink,
            }}
          >
          </span>
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
                onClick={() => updateParams({ t: null, d: null, f: null, q: null })}
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
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </div>

      <RefineDrawer
        open={refineOpen}
        onClose={() => setRefineOpen(false)}
        onClear={() => {
          setTagFilter(null);
          setSortBy("date-asc");
          setPriceFilter("any");
          setActiveFilter("all");
          setSelectedDate(null);
          setSearch("");
          setOpenSection(null);
        }}
        resultsCount={filtered.length}
        resultsLabel="events"
      >
        <RefineSection
          isFirst
          label="Sort by"
          summary={
            sortBy === "date-asc" ? "Date (Soonest First)" :
            sortBy === "date-desc" ? "Date (Latest First)" :
            sortBy === "title-asc" ? "Alphabetically (A-Z)" :
            "Alphabetically (Z-A)"
          }
          open={openSection === "sort"}
          onToggle={() => setOpenSection(openSection === "sort" ? null : "sort")}
        >
          <RefineOption label="Date (Soonest First)" active={sortBy === "date-asc"} onClick={() => setSortBy("date-asc")} />
          <RefineOption label="Date (Latest First)" active={sortBy === "date-desc"} onClick={() => setSortBy("date-desc")} />
          <RefineOption label="Alphabetically (A-Z)" active={sortBy === "title-asc"} onClick={() => setSortBy("title-asc")} />
          <RefineOption label="Alphabetically (Z-A)" active={sortBy === "title-desc"} onClick={() => setSortBy("title-desc")} />
        </RefineSection>

        <RefineSection
          label="Category"
          summary={tagFilter || undefined}
          open={openSection === "tag"}
          onToggle={() => setOpenSection(openSection === "tag" ? null : "tag")}
        >
          {(() => {
            const visibleTags = availableTags.filter((t) => (tagCounts.get(t) || 0) > 0);
            const totalVisible = Array.from(tagCounts.values()).reduce((a, b) => a + b, 0);
            if (visibleTags.length === 0) {
              return <p style={{ fontSize: 13, color: "rgba(0,0,0,0.5)", margin: 0 }}>No categories yet.</p>;
            }
            return (
              <div>
                <RefineRectOption
                  label={`All (${totalVisible})`}
                  active={!tagFilter}
                  onClick={() => setTagFilter(null)}
                />
                {visibleTags.map((t) => (
                  <RefineRectOption
                    key={t}
                    label={`${t} (${tagCounts.get(t)})`}
                    active={tagFilter === t}
                    onClick={() => setTagFilter(t)}
                  />
                ))}
              </div>
            );
          })()}

        </RefineSection>


        <RefineSection
          label="Price"
          summary={priceFilter === "any" ? undefined : priceFilter === "free" ? "Free" : "Paid"}
          open={openSection === "price"}
          onToggle={() => setOpenSection(openSection === "price" ? null : "price")}
        >
          <div>
            <RefineRectOption label="Any" active={priceFilter === "any"} onClick={() => setPriceFilter("any")} />
            <RefineRectOption label="Free" active={priceFilter === "free"} onClick={() => setPriceFilter("free")} />
            <RefineRectOption label="Paid" active={priceFilter === "paid"} onClick={() => setPriceFilter("paid")} />
          </div>
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
