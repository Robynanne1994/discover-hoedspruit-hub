import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import HomeSectionHead from "./HomeSectionHead";
import { getEventDates } from "@/lib/eventDates";

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

type ParsedDate =
  | { kind: "single"; day: number; monthIdx: number }
  | { kind: "range"; startDay: number; startMonthIdx: number; endDay: number; endMonthIdx: number; sameMonth: boolean }
  | { kind: "tba" };

const parseEventDate = (e: { date?: string | null; start_date?: string | null; end_date?: string | null }): ParsedDate => {
  const { start, end } = getEventDates(e);
  if (start) {
    const sameDay = !end || start.getTime() === end.getTime();
    if (sameDay) return { kind: "single", day: start.getDate(), monthIdx: start.getMonth() };
    const sameMonth = start.getMonth() === end!.getMonth() && start.getFullYear() === end!.getFullYear();
    return {
      kind: "range",
      startDay: start.getDate(),
      startMonthIdx: start.getMonth(),
      endDay: end!.getDate(),
      endMonthIdx: end!.getMonth(),
      sameMonth,
    };
  }
  const raw = e.date;
  if (!raw) return { kind: "tba" };
  const s = raw.trim().toLowerCase();
  if (!s || s === "tbd" || s === "tba") return { kind: "tba" };
  let monthIdx = -1;
  for (let i = 0; i < MONTH_NAMES.length; i++) {
    const m = MONTH_NAMES[i];
    if (s.includes(m) || s.includes(m.slice(0, 3))) { monthIdx = i; break; }
  }
  const rangeMatch = s.match(/(\d{1,2})\s*[-–]\s*(\d{1,2})/);
  if (rangeMatch && monthIdx >= 0) {
    return { kind: "range", startDay: parseInt(rangeMatch[1], 10), startMonthIdx: monthIdx, endDay: parseInt(rangeMatch[2], 10), endMonthIdx: monthIdx, sameMonth: true };
  }
  const singleMatch = s.match(/(\d{1,2})/);
  if (singleMatch && monthIdx >= 0) {
    return { kind: "single", day: parseInt(singleMatch[1], 10), monthIdx };
  }
  return { kind: "tba" };
};

const formatDateLabel = (p: ParsedDate): string => {
  if (p.kind === "single") return `${p.day} ${MONTHS_SHORT[p.monthIdx]}`;
  if (p.kind === "range") {
    if (p.sameMonth) return `${p.startDay} to ${p.endDay} ${MONTHS_SHORT[p.startMonthIdx]}`;
    return `${p.startDay} ${MONTHS_SHORT[p.startMonthIdx]} to ${p.endDay} ${MONTHS_SHORT[p.endMonthIdx]}`;
  }
  return "TBA";
};

const HomeWhatsOn = () => {
  const { data: events } = useQuery({
    queryKey: ["home-whats-on"],
    queryFn: async () => {
      const { data: siteContent } = await supabase
        .from("site_content")
        .select("content")
        .eq("section", "homepage-whats-on")
        .maybeSingle();

      if (siteContent?.content && Array.isArray(siteContent.content) && siteContent.content.length > 0) {
        const ids = siteContent.content as string[];
        const { data } = await supabase
          .from("events")
          .select("id, title, location, date, start_date, end_date, image_url")
          .in("id", ids);
        const map = new Map((data || []).map((e) => [e.id, e]));
        return ids
          .map((id) => map.get(id))
          .filter((e): e is NonNullable<typeof e> => Boolean(e))
          .map((e) => ({ ...e, parsed: parseEventDate(e) }))
          .slice(0, 4);
      }

      const { data } = await supabase
        .from("events")
        .select("id, title, location, date, start_date, end_date, image_url")
        .order("date", { ascending: true })
        .limit(20);
      return (data || [])
        .map((e) => ({ ...e, parsed: parseEventDate(e) }))
        .slice(0, 4);
    },
  });

  if (!events || events.length === 0) return null;

  return (
    <section>
      <HomeSectionHead primary="What's on" actionLabel="All events" actionHref="/events" />
      <div className="scrollbar-hide" style={{ overflowX: "auto", paddingLeft: 24 }}>
        <div style={{ display: "flex", gap: 14, paddingRight: 40 }}>
          {events.map((e) => (
            <Link
              key={e.id}
              to={`/events/${e.id}`}
              onPointerDown={(ev) => (ev.currentTarget.style.transform = "scale(0.98)")}
              onPointerUp={(ev) => (ev.currentTarget.style.transform = "scale(1)")}
              onPointerLeave={(ev) => (ev.currentTarget.style.transform = "scale(1)")}
              style={{
                width: 268,
                flexShrink: 0,
                background: "#EEE8DA",
                borderRadius: 24,
                overflow: "hidden",
                textDecoration: "none",
                transition: "transform 150ms ease-out",
                display: "block",
              }}
            >
              <div style={{ position: "relative", width: "100%", height: 180, background: "#F4EFE3" }}>
                {e.image_url && (
                  <img
                    src={e.image_url}
                    alt={e.title}
                    loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                )}
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    left: 12,
                    background: "#EEE8DA",
                    borderRadius: 999,
                    padding: "7px 14px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                      fontSize: 12,
                      lineHeight: 1.2,
                      color: "#2A2A24",
                    }}
                  >
                    {formatDateLabel(e.parsed)}
                  </span>
                </div>
              </div>
              <div style={{ padding: "18px 20px 20px" }}>
                <div
                  style={{
                    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                    fontSize: 17,
                    lineHeight: 1.25,
                    color: "#2A2A24",
                    marginBottom: 8,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {e.title}
                </div>
                {e.location && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                      fontSize: 13,
                      color: "#6B6A5E",
                    }}
                  >
                    <MapPin size={13} color="#6B6A5E" strokeWidth={1.6} fill="none" style={{ flexShrink: 0 }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {e.location}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeWhatsOn;
