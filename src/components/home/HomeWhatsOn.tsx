import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import HomeSectionHead from "./HomeSectionHead";

const SANS = "'Pragmatica', 'Inter', 'Helvetica Neue', Helvetica, sans-serif";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

type ParsedDate =
  | { kind: "single"; day: number; monthIdx: number }
  | { kind: "range"; startDay: number; endDay: number; monthIdx: number }
  | { kind: "tba" };

const parseEventDate = (raw: string | null | undefined): ParsedDate => {
  if (!raw) return { kind: "tba" };
  const s = raw.trim().toLowerCase();
  if (!s || s === "tbd" || s === "tba") return { kind: "tba" };

  let monthIdx = -1;
  for (let i = 0; i < MONTH_NAMES.length; i++) {
    const m = MONTH_NAMES[i];
    if (s.includes(m) || s.includes(m.slice(0, 3))) {
      monthIdx = i;
      break;
    }
  }

  const rangeMatch = s.match(/(\d{1,2})\s*[-–]\s*(\d{1,2})/);
  if (rangeMatch && monthIdx >= 0) {
    return {
      kind: "range",
      startDay: parseInt(rangeMatch[1], 10),
      endDay: parseInt(rangeMatch[2], 10),
      monthIdx,
    };
  }

  const singleMatch = s.match(/(\d{1,2})/);
  if (singleMatch && monthIdx >= 0) {
    return { kind: "single", day: parseInt(singleMatch[1], 10), monthIdx };
  }

  const d = new Date(raw);
  if (!isNaN(d.getTime())) {
    return { kind: "single", day: d.getDate(), monthIdx: d.getMonth() };
  }
  return { kind: "tba" };
};

const formatDateLabel = (p: ParsedDate): string => {
  if (p.kind === "single") return `${p.day} ${MONTHS[p.monthIdx]}`;
  if (p.kind === "range") return `${p.startDay}–${p.endDay} ${MONTHS[p.monthIdx]}`;
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
          .select("id, title, location, date, image_url")
          .in("id", ids);
        const map = new Map((data || []).map((e) => [e.id, e]));
        return ids
          .map((id) => map.get(id))
          .filter((e): e is NonNullable<typeof e> => Boolean(e))
          .map((e) => ({ ...e, parsed: parseEventDate(e.date) }))
          .slice(0, 4);
      }

      const { data } = await supabase
        .from("events")
        .select("id, title, location, date, image_url")
        .order("date", { ascending: true })
        .limit(20);
      return (data || [])
        .map((e) => ({ ...e, parsed: parseEventDate(e.date) }))
        .slice(0, 4);
    },
  });

  if (!events || events.length === 0) return null;

  const cardWidth = typeof window !== "undefined" ? Math.round(window.innerWidth * 0.72) : 262;

  return (
    <section>
      <HomeSectionHead primary="What's on" actionLabel="All events" actionHref="/events" />
      <div className="scrollbar-hide" style={{ overflowX: "auto", paddingLeft: 24, scrollSnapType: "x mandatory" }}>
        <div style={{ display: "flex", gap: 12, paddingRight: 24 }}>
          {events.map((e) => (
            <Link
              key={e.id}
              to={`/events/${e.id}`}
              onPointerDown={(ev) => (ev.currentTarget.style.transform = "scale(0.98)")}
              onPointerUp={(ev) => (ev.currentTarget.style.transform = "scale(1)")}
              onPointerLeave={(ev) => (ev.currentTarget.style.transform = "scale(1)")}
              style={{
                width: cardWidth,
                flexShrink: 0,
                background: "#FFFFFF",
                borderRadius: 24,
                overflow: "hidden",
                textDecoration: "none",
                transition: "transform 150ms ease-out",
                display: "block",
                scrollSnapAlign: "start",
              }}
            >
              <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 10", background: "#F2EFEC" }}>
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
                    background: "#FFFFFF",
                    borderRadius: 999,
                    padding: "8px 14px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                      fontWeight: 400,
                      fontSize: 12,
                      lineHeight: "14.4px",
                      letterSpacing: "0.24px",
                      color: "#0A0A0A",
                      textTransform: "capitalize",
                    }}
                  >
                    {formatDateLabel(e.parsed).toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                </div>
              </div>
              <div style={{ padding: 16 }}>
                <div
                  style={{
                    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                    fontWeight: 400,
                    fontSize: 18,
                    lineHeight: "21.6px",
                    letterSpacing: "-0.18px",
                    color: "#0A0A0A",
                    marginBottom: 6,
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
                      fontWeight: 400,
                      fontSize: 12,
                      lineHeight: "15.6px",
                      letterSpacing: "0.12px",
                      color: "#8A8480",
                    }}
                  >
                    <MapPin size={12} color="#8A8480" strokeWidth={1.5} fill="none" style={{ flexShrink: 0 }} />
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
