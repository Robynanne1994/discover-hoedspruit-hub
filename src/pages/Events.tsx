import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, MapPin, X, ArrowLeft, Calendar, Clock } from "lucide-react";
import SearchBar from "@/components/ui/SearchBar";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { RefineDrawer, RefineSection, RefineOption, RefineRectOption } from "@/components/RefineDrawer";
import { Skeleton } from "@/components/ui/skeleton";
import {
  isToday,
  isBefore,
  startOfToday,
  endOfWeek,
  endOfMonth,
  isWithinInterval,
  addDays,
  format,
  parse,
} from "date-fns";
import { getEventSortDate, getEventDates } from "@/lib/eventDates";
import { getNextOccurrence, getUpcomingPerformancesCount, hasPerformances, parseRecurrenceRule } from "@/lib/eventSchedule";
import { getDisplayTitle, noTitleCaseProps } from "@/lib/displayTitle";
import { pinFeatured } from "@/lib/featuredFirst";
import Seo from "@/components/Seo";
import { MUTED, tab as tabStyle, type } from "@/lib/type";


const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const HEAD = "'Nohemi', 'Helvetica Neue', Helvetica, Arial, sans-serif";

const C = {
  page: "#E6E0CC",
  ivory: "#f5f0e8",
  white: "#ffffff",
  ink: "#1A1A1A",
  body: "#2b2420",
  muted: MUTED,
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

function getFilterCount(
  filter: FilterType,
  events: any[]
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

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const NTH_NAMES: Record<number, string> = { 1: "First", 2: "Second", 3: "Third", 4: "Fourth", 5: "Last" };

function recurrenceLabel(rule: any): string | null {
  if (!rule) return null;
  if (rule.kind === "daily") return "Every Day";
  if (rule.kind === "weekly") return `Every ${WEEKDAY_NAMES[rule.weekday] ?? ""}`.trim();
  if (rule.kind === "monthly-day") return `Monthly On The ${rule.day}${rule.day === 1 ? "st" : rule.day === 2 ? "nd" : rule.day === 3 ? "rd" : "th"}`;
  if (rule.kind === "monthly-nth") return `Every ${NTH_NAMES[rule.n] ?? ""} ${WEEKDAY_NAMES[rule.weekday] ?? ""}`.replace(/\s+/g, " ").trim();
  return null;
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
  const rule = parseRecurrenceRule(e.recurrence);
  if (rule) {
    const next = getNextOccurrence(e);
    const time = next?.startTime ? fmtTime(next.startTime) : fmtTime(e.start_time);
    const datePart = recurrenceLabel(rule) ?? (next ? `Next: ${format(next.date, "d MMM")}` : "");
    if (datePart) return time ? `${datePart} • ${time}` : datePart;
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

// Event card --------------------------------------------------------
const EventCard = ({ event }: { event: any }) => {
  const navigate = useNavigate();
  const loc = event.location ? event.location.replace(/<[^>]*>/g, "").trim() : "";
  const price = formatPrice(event.price);
  const dateLine = eventDateLine(event);
  const image = event.image_url || null;

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => navigate(`/events/${event.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(`/events/${event.id}`);
        }
      }}
      onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
      onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "stretch",
        gap: 14,
        height: 188,
        background: C.white,
        borderRadius: 16,
        overflow: "hidden",
        cursor: "pointer",
        boxShadow: "0 1px 4px -1px rgba(0,0,0,0.04)",
        transition: "transform 150ms ease-out",
      }}
    >
      <div style={{ width: 140, flexShrink: 0, alignSelf: "stretch", background: C.ivory, overflow: "hidden" }}>
        {image && (
          <img
            src={image}
            alt={event.title}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        )}
      </div>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          padding: "12px 12px 12px 0",
          overflow: "hidden",
        }}
      >
        {event.tag && (
          <div style={{ marginBottom: 10 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: 24,
                padding: "0 8px",
                borderRadius: 999,
                background: "#423324",
                color: "#FFFFFF",
                fontFamily: SANS,
                fontWeight: 700,
                fontSize: 8.5,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {event.tag}
            </span>
          </div>
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
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {getDisplayTitle(event)}
        </h3>
        {dateLine && (
          <p
            style={{
              fontFamily: SANS,
              fontWeight: 400,
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
            <span
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {dateLine}
            </span>
          </p>
        )}
        {loc && (
          <p
            style={{
              fontFamily: SANS,
              fontWeight: 400,
              fontSize: 12,
              lineHeight: 1.35,
              color: C.muted,
              margin: 0,
              marginTop: 4,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <MapPin size={12} strokeWidth={1.8} style={{ flexShrink: 0, color: C.muted }} />
            <span
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {loc}
            </span>
          </p>
        )}
      </div>
      {price && (
        <span
          style={{
            position: "absolute",
            right: 10,
            bottom: 10,
            borderRadius: 999,
            background: C.tag,
            color: C.body,
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 13,
            lineHeight: 1.2,
            padding: "5px 14px",
            whiteSpace: "nowrap",
          }}
        >
          {price}
        </span>
      )}
    </div>
  );
};

// Happening Soon poster card ---------------------------------------
const PosterCard = ({ event }: { event: any }) => {
  const navigate = useNavigate();
  const d: Date | null = event._parsed ?? null;

  const month = d ? format(d, "MMM").toUpperCase() : "";
  const day = d ? format(d, "d") : "";
  const weekday = d ? format(d, "EEE").toUpperCase() : "";
  let timeLabel = "";
  const st = event.start_time && String(event.start_time).trim() ? String(event.start_time).slice(0, 5) : null;
  if (d && st) {
    try {
      timeLabel = format(parse(st, "HH:mm", d), "h:mm a");
    } catch {
      timeLabel = st;
    }
  }
  const eyebrow = [weekday, day, month].filter(Boolean).join(" ") + (timeLabel ? `  \u2022  ${timeLabel}` : "");

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => navigate(`/events/${event.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(`/events/${event.id}`);
        }
      }}
      onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
      onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      style={{
        flexShrink: 0,
        width: 196,
        height: 270,
        display: "flex",
        flexDirection: "column",
        background: "#FFFFFF",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 1px 4px -1px rgba(0,0,0,0.04)",
        cursor: "pointer",
        transition: "transform 150ms ease-out",
      }}
    >
      <div style={{ position: "relative", height: 164, flexShrink: 0, background: "#F4EFE3" }}>
        {event.image_url && (
          <img
            src={event.image_url}
            alt={getDisplayTitle(event)}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        )}
        {d && (
          <div
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              width: 46,
              height: 46,
              borderRadius: 999,
              background: "rgba(255,255,255,0.94)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
          >
            <span
              style={{
                fontFamily: SANS,
                fontSize: 8.5,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#6B6A5E",
                lineHeight: 1,
              }}
            >
              {month}
            </span>
            <span
              style={{
                fontFamily: HEAD,
                fontSize: 17,
                fontWeight: 550,
                color: "#1A1A1A",
                lineHeight: 1,
                marginTop: 2,
              }}
            >
              {day}
            </span>
          </div>
        )}
      </div>
      <div style={{ padding: "11px 13px 13px", flex: 1, display: "flex", flexDirection: "column" }}>
        <h3
          {...noTitleCaseProps(event)}
          style={{
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 15.5,
            lineHeight: 1.25,
            color: "#1A1A1A",
            margin: 0,
            marginBottom: 8,
            flex: 1,
            minHeight: 0,
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
        {event.location && (
          <div
            style={{
              marginTop: "auto",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontFamily: SANS,
              fontSize: 11.5,
              color: "#6B6A5E",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            <MapPin size={12} strokeWidth={1.8} style={{ flexShrink: 0, color: "#6B6A5E" }} />
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {event.location}
            </span>
          </div>
        )}
      </div>
    </div>
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
  }, [activeFilter]);
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
  
  const setSearch = (q: string) => updateParams({ q: q || null });
  const setTagFilter = (t: string | null) => updateParams({ t: t || null });
  const setSortBy = (s: SortType) => updateParams({ s: s === "date-asc" ? null : s });
  
  const [searchOpen, setSearchOpen] = useState(!!search);
  const [refineOpen, setRefineOpen] = useState(false);
  const [openSection, setOpenSection] = useState<"tag" | "sort" | "price" | "time" | null>("tag");
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



  const { data: events, isLoading, isError, refetch, isFetching } = useQuery({
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
      const t = (e.tag || "").trim();
      if (t) map.set(t, (map.get(t) || 0) + 1);
    });
    return map;
  }, [sortedEvents, search, activeFilter]);




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
    // Featured events always pin to the top, keeping the chosen sort within groups
    return pinFeatured(sorted);

  }, [sortedEvents, search, tagFilter, activeFilter, sortBy, priceFilter]);

  // Month groups (recurring events collected into "Every Week")
  const groupedEvents = useMemo(() => {
    const groups: { key: string; label: string; events: any[] }[] = [];
    const recurring: any[] = [];
    filtered.forEach((e) => {
      if (parseRecurrenceRule(e.recurrence) && !hasPerformances(e)) {
        recurring.push(e);
        return;
      }
      const label = e._parsed ? format(e._parsed, "MMMM").toUpperCase() : "DATE TO BE CONFIRMED";
      const key = e._parsed ? format(e._parsed, "yyyy-MM") : "tbc";
      const existing = groups.find((g) => g.key === key);
      if (existing) existing.events.push(e);
      else groups.push({ key, label, events: [e] });
    });
    if (recurring.length) groups.push({ key: "recurring", label: "Recurring", events: recurring });
    return groups;
  }, [filtered]);

  // Happening Soon — soonest dated events, excluding recurring ones
  const happeningSoon = useMemo(() => {
    const today = startOfToday();
    return sortedEvents
      .filter((e) => e._parsed && !isBefore(e._parsed, today) && !parseRecurrenceRule(e.recurrence))
      .slice(0, 3);
  }, [sortedEvents]);





  const handleFilterPill = (v: FilterType) => {
    updateParams({ f: activeFilter === v || v === "all" ? null : v });
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
                background: (tagFilter || activeFilter !== "all" || priceFilter !== "any") ? "#423324" : "#FFFFFF",
                border: "1px solid rgba(0,0,0,0.06)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: (tagFilter || activeFilter !== "all" || priceFilter !== "any") ? "#FFFFFF" : "#1A1A1A",
              }}
            >
              <SlidersHorizontal size={18} strokeWidth={1.8} />
            </button>
          </>
        }
      />

      {/* Inline search input */}
      {searchOpen && (
        <div style={{ padding: "16px 20px 12px 20px" }}>
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
            marginTop: 16,
            paddingLeft: 20,
            paddingRight: 20,
            display: "flex",
            gap: 8,
            alignItems: "center",
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
          className="scrollbar-hide"
        >
          {FILTERS.map((f) => {
            const active = activeFilter === f.value;
            const count = getFilterCount(f.value, sortedEvents);
            return (
              <button
                key={f.value}
                ref={active ? activePillRef : undefined}
                onClick={() => handleFilterPill(f.value)}
                style={{
                  background: active ? "#423324" : "#FFFFFF",
                  border: `1px solid ${active ? "#423324" : "rgba(26,26,26,0.08)"}`,
                  borderRadius: 999,
                  padding: "7px 14px",
                  cursor: "pointer",
                  ...tabStyle(active),
                  lineHeight: 1,
                  color: active ? "#FFFFFF" : "#1A1A1A",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {f.label} ({count})

              </button>
            );
          })}
        </div>
      )}
      {search.trim() && <div style={{ height: 20 }} />}

      {/* Happening Soon */}
      {!search.trim() && activeFilter === "all" && !tagFilter && happeningSoon.length >= 2 && (
        <div>
          <h2
            style={{
              margin: "26px 20px 0",
              fontFamily: HEAD,
              fontSize: 24,
              fontWeight: 550,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              color: C.ink,
            }}
          >
            Happening Soon
          </h2>
          <div
            className="no-scrollbar"
            style={{
              display: "flex",
              gap: 10,
              padding: "0 20px",
              overflowX: "auto",
              scrollbarWidth: "none",
              alignItems: "flex-start",
              marginTop: 12,
            }}
          >
            {happeningSoon.map((e) => (
              <PosterCard key={e.id} event={e} />
            ))}
          </div>
        </div>
      )}




      {/* List */}
      <div style={{ padding: "20px 20px 0 20px" }}>

        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} style={{ height: 112, borderRadius: 16 }} />
            ))}
          </div>
        ) : isError ? (
          <div style={{ background: C.white, borderRadius: 16, padding: "32px 20px", textAlign: "center" }}>
            <p style={{ ...type.body, margin: "0 0 14px" }}>
              Something went wrong loading events. Please check your connection and try again.
            </p>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              style={{ background: "#423324", color: "#fff", border: "none", borderRadius: 999, height: 44, padding: "0 24px", ...type.button, cursor: isFetching ? "default" : "pointer", opacity: isFetching ? 0.6 : 1 }}
            >
              {isFetching ? "Trying…" : "Try again"}
            </button>
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
            <p style={{ ...type.body, margin: 0 }}>
              No events match your filters.
            </p>
            {(tagFilter || activeFilter !== "all" || search) && (
              <button
                onClick={() => updateParams({ t: null, f: null, q: null })}
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
            {groupedEvents.map((group) => (
              <div key={group.key} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginTop: 18,
                    marginBottom: 2,
                  }}
                >
                  <span
                    style={{
                      fontFamily: SANS,
                      fontWeight: 700,
                      fontSize: 12,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: C.muted,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {group.label}
                  </span>
                  <span
                    style={{
                      fontFamily: SANS,
                      fontWeight: 400,
                      fontSize: 12,
                      color: C.muted,
                    }}
                  >
                    {group.events.length}
                  </span>
                  <span style={{ flex: 1, height: 1, background: "rgba(26,26,26,0.10)" }} />
                </div>
                {group.events.map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
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
          label="Time Frame"
          summary={activeFilter === "all" ? undefined : FILTERS.find((f) => f.value === activeFilter)?.label}
          open={openSection === "time"}
          onToggle={() => setOpenSection(openSection === "time" ? null : "time")}
        >
          <div>
            {FILTERS.map((f) => (
              <RefineRectOption
                key={f.value}
                label={`${f.label} (${getFilterCount(f.value, sortedEvents)})`}
                active={activeFilter === f.value}
                onClick={() => setActiveFilter(f.value)}
              />
            ))}
          </div>
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
              return <p style={{ ...type.meta, margin: 0 }}>No categories yet.</p>;
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
