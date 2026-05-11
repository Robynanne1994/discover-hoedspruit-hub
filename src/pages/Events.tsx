import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import GlobalMenu, { GlobalMenuTrigger } from "@/components/GlobalMenu";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  isToday,
  isBefore,
  startOfToday,
  startOfWeek,
  endOfWeek,
  endOfMonth,
  isWithinInterval,
  format,
  isSameMonth,
} from "date-fns";
import { getEventSortDate, getEventDates } from "@/lib/eventDates";

const SERIF = "'Playfair Display', Georgia, serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const COLOR = {
  olive: "#5C6446",
  cream: "#EEE8DA",
  softCream: "#F4EFE3",
  ink: "#2A2A24",
  mutedInk: "#6B6A5E",
  line: "#D9D2C0",
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

type FilterType = "all" | "today" | "this-week" | "this-month" | "past";

const FILTERS: { label: string; value: FilterType }[] = [
  { label: "All", value: "all" },
  { label: "Today", value: "today" },
  { label: "This Week", value: "this-week" },
  { label: "This Month", value: "this-month" },
  { label: "Past", value: "past" },
];

const THIN = "\u2009";
const MID = `${THIN}·${THIN}`;

function formatTimeShort(t: string | null | undefined): string {
  if (!t) return "";
  const m = String(t).match(/^(\d{1,2}):?(\d{0,2})/);
  if (!m) return "";
  const h = parseInt(m[1]);
  const min = m[2] ? parseInt(m[2]) : 0;
  if (isNaN(h)) return "";
  const ampm = h >= 12 ? "pm" : "am";
  const dh = h === 0 ? 12 : h > 12 ? h - 12 : h;
  if (min === 0) return `${dh}${ampm}`;
  return `${dh}:${String(min).padStart(2, "0")}${ampm}`;
}

function formatDatePart(e: any): string {
  const { start, end } = getEventDates(e);
  if (!start) return (e.date || "").replace(/<[^>]*>/g, "").trim();
  const sameDay = !end || start.getTime() === end.getTime();
  if (sameDay) return `${start.getDate()} ${MONTHS[start.getMonth()]}`;
  const sameMonth = start.getMonth() === end!.getMonth() && start.getFullYear() === end!.getFullYear();
  if (sameMonth) return `${start.getDate()} to ${end!.getDate()} ${MONTHS[start.getMonth()]}`;
  return `${start.getDate()} ${MONTHS[start.getMonth()]} to ${end!.getDate()} ${MONTHS[end!.getMonth()]}`;
}

function buildDateLine(e: any): string {
  const date = formatDatePart(e);
  const time = formatTimeShort(e.start_time);
  if (date && time) return `${date}${MID}${time}`;
  return date || time || "";
}

function buildRecurrenceLine(e: any): string {
  const raw = (e.recurrence || "").replace(/<[^>]*>/g, "").trim();
  if (!raw) return "";
  const time = formatTimeShort(e.start_time);
  if (time) return `${raw}${MID}${time}`;
  return raw;
}

function recurrenceCadence(raw: string): "monthly" | "yearly" | "other" {
  const r = (raw || "").toLowerCase();
  if (r.includes("year") || r.includes("annual")) return "yearly";
  if (r.includes("month") || r.includes("first") || r.includes("last")) return "monthly";
  return "other";
}

const EventRow = ({
  event,
  showDivider,
  metaOverride,
}: {
  event: any;
  showDivider: boolean;
  metaOverride?: string;
}) => {
  const meta = metaOverride ?? buildDateLine(event);
  const location = event.location ? event.location.replace(/<[^>]*>/g, "").trim() : "";
  return (
    <Link
      to={`/events/${event.id}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 0",
        textDecoration: "none",
        borderTop: showDivider ? `1px solid ${COLOR.line}` : "none",
      }}
    >
      <div
        style={{
          width: 54,
          height: 54,
          borderRadius: "50%",
          overflow: "hidden",
          background: COLOR.softCream,
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
      <div style={{ flex: 1, minWidth: 0 }}>
        {meta && (
          <p
            style={{
              fontFamily: SANS,
              fontSize: 11.5,
              letterSpacing: "1.6px",
              textTransform: "uppercase",
              color: COLOR.mutedInk,
              margin: 0,
              marginBottom: 3,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {meta}
          </p>
        )}
        <h4
          style={{
            fontFamily: SANS,
            fontSize: 15,
            fontWeight: 400,
            lineHeight: 1.25,
            letterSpacing: "-0.1px",
            color: COLOR.ink,
            margin: 0,
            marginBottom: 2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {event.title}
        </h4>
        {location && (
          <p
            style={{
              fontFamily: SANS,
              fontSize: 12.5,
              color: COLOR.mutedInk,
              margin: 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {location}
          </p>
        )}
      </div>
      <span
        style={{
          fontSize: 14,
          color: COLOR.ink,
          opacity: 0.7,
          flexShrink: 0,
          lineHeight: 1,
        }}
      >
        ↗
      </span>
    </Link>
  );
};

const SingleEventCard = ({ event }: { event: any }) => {
  const meta = buildRecurrenceLine(event) || buildDateLine(event);
  const location = event.location ? event.location.replace(/<[^>]*>/g, "").trim() : "";
  return (
    <Link
      to={`/events/${event.id}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        background: COLOR.cream,
        borderRadius: 24,
        padding: "20px 22px",
        textDecoration: "none",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          overflow: "hidden",
          background: COLOR.softCream,
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
      <div style={{ flex: 1, minWidth: 0 }}>
        {meta && (
          <p
            style={{
              fontFamily: SANS,
              fontSize: 11.5,
              letterSpacing: "1.6px",
              textTransform: "uppercase",
              color: COLOR.mutedInk,
              margin: 0,
              marginBottom: 4,
              lineHeight: 1.35,
            }}
          >
            {meta}
          </p>
        )}
        <h3
          style={{
            fontFamily: SANS,
            fontSize: 17,
            fontWeight: 400,
            lineHeight: 1.2,
            letterSpacing: "-0.2px",
            color: COLOR.ink,
            margin: 0,
            marginBottom: 3,
          }}
        >
          {event.title}
        </h3>
        {location && (
          <p style={{ fontFamily: SANS, fontSize: 12.5, color: COLOR.mutedInk, margin: 0 }}>
            {location}
          </p>
        )}
      </div>
      <span style={{ fontSize: 14, color: COLOR.ink, opacity: 0.7, flexShrink: 0, lineHeight: 1 }}>↗</span>
    </Link>
  );
};

const SectionHead = ({
  eyebrow,
  heading,
  trailing,
}: {
  eyebrow?: string;
  heading: string;
  trailing?: React.ReactNode;
}) => (
  <div
    style={{
      padding: "0 24px",
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 14,
    }}
  >
    <div style={{ minWidth: 0 }}>
      {eyebrow && (
        <p
          style={{
            fontFamily: SANS,
            fontSize: 11,
            letterSpacing: "2.2px",
            textTransform: "uppercase",
            color: "rgba(238,232,218,0.65)",
            margin: 0,
            marginBottom: 4,
          }}
        >
          {eyebrow}
        </p>
      )}
      <h2
        style={{
          fontFamily: SERIF,
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: 32,
          lineHeight: 1,
          letterSpacing: "-0.5px",
          color: COLOR.cream,
          margin: 0,
          textTransform: "none",
        }}
      >
        {heading}
      </h2>
    </div>
    {trailing && <div style={{ flexShrink: 0 }}>{trailing}</div>}
  </div>
);

const Events = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [tagMenuOpen, setTagMenuOpen] = useState(false);

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

  const searched = useMemo(() => {
    let list = sortedEvents;
    if (tagFilter) {
      const tf = tagFilter.toLowerCase();
      list = list.filter((e) =>
        [e.tag, e.sub_tag_1, e.sub_tag_2].some(
          (t: string | null) => t && t.toLowerCase() === tf
        )
      );
    }
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.location && e.location.toLowerCase().includes(q)) ||
        (e.tag && e.tag.toLowerCase().includes(q))
    );
  }, [sortedEvents, search, tagFilter]);

  const recurringAll = useMemo(
    () =>
      searched.filter(
        (e) =>
          e.recurrence &&
          e.recurrence.trim() !== "" &&
          e.recurrence.trim().toLowerCase() !== "none"
      ),
    [searched]
  );

  const datedAll = useMemo(() => {
    const today = startOfToday();
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const monthEnd = endOfMonth(today);
    const nonRecurring = searched.filter(
      (e) =>
        !e.recurrence ||
        e.recurrence.trim() === "" ||
        e.recurrence.trim().toLowerCase() === "none"
    );
    if (activeFilter === "all")
      return nonRecurring.filter((e) => !e._parsed || !isBefore(e._parsed, today));
    return nonRecurring.filter((event) => {
      const date = event._parsed;
      if (!date) return false;
      switch (activeFilter) {
        case "today":
          return isToday(date);
        case "this-week":
          return isWithinInterval(date, { start: today, end: weekEnd });
        case "this-month":
          return isWithinInterval(date, { start: today, end: monthEnd });
        case "past":
          return isBefore(date, today) && !isToday(date);
        default:
          return true;
      }
    });
  }, [searched, activeFilter]);

  const monthlyRecurring = useMemo(
    () => recurringAll.filter((e) => recurrenceCadence(e.recurrence) === "monthly"),
    [recurringAll]
  );
  const yearlyRecurring = useMemo(
    () => recurringAll.filter((e) => recurrenceCadence(e.recurrence) === "yearly"),
    [recurringAll]
  );

  const showRecurring = activeFilter !== "past" && activeFilter !== "today";
  const totalCount = events?.length || 0;
  const subline = totalCount > 0
    ? `All local happenings, refreshed daily.`
    : "Refreshed daily.";

  const iconBtn: React.CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: COLOR.cream,
    border: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  };

  const filterIconBtn = (
    <div style={{ position: "relative" }}>
      <button
        aria-label="Filter by tag"
        onClick={() => setTagMenuOpen((v) => !v)}
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: tagFilter ? COLOR.ink : COLOR.cream,
          color: tagFilter ? COLOR.cream : COLOR.ink,
          border: "none",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <SlidersHorizontal size={14} strokeWidth={1.8} color={tagFilter ? COLOR.cream : COLOR.ink} />
      </button>
      {tagMenuOpen && (
        <>
          <div
            onClick={() => setTagMenuOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 40 }}
          />
          <div
            style={{
              position: "absolute",
              top: 44,
              right: 0,
              zIndex: 50,
              background: COLOR.cream,
              borderRadius: 16,
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
              minWidth: 200,
              maxHeight: 320,
              overflowY: "auto",
              padding: 6,
            }}
          >
            <button
              onClick={() => { setTagFilter(null); setTagMenuOpen(false); }}
              style={{
                width: "100%",
                textAlign: "left",
                background: !tagFilter ? "rgba(42,42,36,0.08)" : "transparent",
                border: "none",
                borderRadius: 10,
                padding: "10px 14px",
                fontFamily: SANS,
                fontSize: 13.5,
                color: COLOR.ink,
                cursor: "pointer",
              }}
            >
              All tags
            </button>
            {availableTags.map((t) => (
              <button
                key={t}
                onClick={() => { setTagFilter(t); setTagMenuOpen(false); }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: tagFilter === t ? "rgba(42,42,36,0.08)" : "transparent",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontFamily: SANS,
                  fontSize: 13.5,
                  color: COLOR.ink,
                  cursor: "pointer",
                }}
              >
                {t}
              </button>
            ))}
            {availableTags.length === 0 && (
              <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 13, color: COLOR.mutedInk, padding: "10px 14px", margin: 0 }}>
                No tags yet.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        paddingBottom: 140,
        background: COLOR.olive,
        fontFamily: SANS,
        color: COLOR.cream,
      }}
    >
      {/* Top bar */}
      <div
        style={{
          padding: "32px 24px 0 24px",
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
        }}
      >
        <GlobalMenuTrigger open={menuOpen} onClick={() => setMenuOpen((v) => !v)} />
        <GlobalMenu open={menuOpen} onOpenChange={setMenuOpen} />
      </div>

      {/* Hero */}
      <div style={{ padding: "24px 24px 0 24px" }}>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 12,
            letterSpacing: "2.4px",
            textTransform: "uppercase",
            color: "rgba(238,232,218,0.7)",
            marginBottom: 14,
          }}
        >
          EVERY DAY IN THE 'HOED
        </div>
        <h1
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 72,
            lineHeight: 0.92,
            letterSpacing: "-2.5px",
            color: COLOR.cream,
            margin: 0,
            marginBottom: 14,
            textTransform: "none",
          }}
        >
          what's on.
        </h1>
        <p
          style={{
            fontFamily: SANS,
            fontWeight: 400,
            fontSize: 15,
            lineHeight: 1.65,
            color: "rgba(238,232,218,0.9)",
            margin: 0,
            marginBottom: 22,
          }}
        >
          {subline}
        </p>
      </div>

      {/* Search */}
      <div style={{ padding: "0 24px", marginBottom: 22 }}>
        <div
          style={{
            height: 52,
            background: "rgba(238, 232, 218, 0.92)",
            borderRadius: 999,
            padding: "0 22px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Search size={18} strokeWidth={1.6} color={COLOR.mutedInk} style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search events"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              background: "transparent",
              outline: "none",
              border: "none",
              fontFamily: SANS,
              fontSize: 14,
              color: COLOR.ink,
            }}
          />
        </div>
      </div>

      {/* Time period pills */}
      <div className="overflow-x-auto scrollbar-hide" style={{ marginBottom: 32 }}>
        <div style={{ display: "inline-flex", gap: 8, padding: "0 24px" }}>
          {FILTERS.map((f) => {
            const active = activeFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                style={{
                  background: active ? COLOR.ink : COLOR.cream,
                  color: active ? COLOR.cream : COLOR.ink,
                  border: "none",
                  borderRadius: 999,
                  height: 38,
                  padding: "0 20px",
                  fontFamily: SANS,
                  fontSize: 13.5,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: "0 24px" }}>
          <Skeleton style={{ height: 320, borderRadius: 24, background: "rgba(238,232,218,0.15)" }} />
        </div>
      ) : (
        <>
          {/* Upcoming */}
          {datedAll.length > 0 && (
            <section style={{ marginBottom: 28 }}>
              <SectionHead heading={(() => {
                const today = startOfToday();
                if (activeFilter === "today") return format(today, "d MMM").toLowerCase();
                if (activeFilter === "this-week") {
                  const ws = startOfWeek(today, { weekStartsOn: 1 });
                  const we = endOfWeek(today, { weekStartsOn: 1 });
                  return isSameMonth(ws, we)
                    ? `${format(ws, "d")}–${format(we, "d MMM")}`.toLowerCase()
                    : `${format(ws, "d MMM")} – ${format(we, "d MMM")}`.toLowerCase();
                }
                if (activeFilter === "this-month") return format(today, "MMMM yyyy").toLowerCase();
                if (activeFilter === "past") return "past events";
                return "upcoming";
              })()} trailing={filterIconBtn} />
              <div style={{ padding: "0 24px" }}>
                <div
                  style={{
                    background: COLOR.cream,
                    borderRadius: 24,
                    padding: "6px 20px",
                    overflow: "hidden",
                  }}
                >
                  {datedAll.map((event, idx) => (
                    <EventRow key={event.id} event={event} showDivider={idx > 0} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Monthly recurring */}
          {showRecurring && monthlyRecurring.length > 0 && (
            <section style={{ marginBottom: 28 }}>
              <SectionHead eyebrow="RECURRING" heading="monthly" />
              <div style={{ padding: "0 24px" }}>
                {monthlyRecurring.length === 1 ? (
                  <SingleEventCard event={monthlyRecurring[0]} />
                ) : (
                  <div
                    style={{
                      background: COLOR.cream,
                      borderRadius: 24,
                      padding: "6px 20px",
                      overflow: "hidden",
                    }}
                  >
                    {monthlyRecurring.map((event, idx) => (
                      <EventRow
                        key={event.id}
                        event={event}
                        showDivider={idx > 0}
                        metaOverride={buildRecurrenceLine(event)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Yearly recurring */}
          {showRecurring && yearlyRecurring.length > 0 && (
            <section style={{ marginBottom: 28 }}>
              <SectionHead eyebrow="RECURRING" heading="yearly" />
              <div style={{ padding: "0 24px" }}>
                <div
                  style={{
                    background: COLOR.cream,
                    borderRadius: 24,
                    padding: "6px 20px",
                    overflow: "hidden",
                  }}
                >
                  {yearlyRecurring.map((event, idx) => (
                    <EventRow
                      key={event.id}
                      event={event}
                      showDivider={idx > 0}
                      metaOverride={buildRecurrenceLine(event)}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}

          {datedAll.length === 0 && (!showRecurring || (monthlyRecurring.length === 0 && yearlyRecurring.length === 0)) && (
            <div style={{ textAlign: "center", padding: "60px 24px" }}>
              <p
                style={{
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontSize: 18,
                  color: "rgba(238,232,218,0.85)",
                  margin: 0,
                  marginBottom: tagFilter ? 14 : 0,
                }}
              >
                {tagFilter
                  ? `Nothing on for this view with the "${tagFilter}" filter. Try another time period or remove filters to see what else is on.`
                  : "Nothing on for this view. Try another time period."}
              </p>
              {tagFilter && (
                <button
                  onClick={() => setTagFilter(null)}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    fontFamily: SANS,
                    fontSize: 13,
                    fontWeight: 400,
                    letterSpacing: "1.6px",
                    textTransform: "uppercase",
                    color: COLOR.cream,
                    textDecoration: "underline",
                    textUnderlineOffset: 4,
                    cursor: "pointer",
                  }}
                >
                  Remove filters
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Events;
