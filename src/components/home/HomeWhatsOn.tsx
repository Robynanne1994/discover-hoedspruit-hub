import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ChevronRight, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import HomeSectionHead from "./HomeSectionHead";

const SANS = "'Pragmatica', 'Inter', 'Helvetica Neue', Helvetica, sans-serif";
const SERIF = "'Playfair Display', 'Helvetica Neue', serif";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

type ParsedDate =
  | { kind: "single"; day: number; monthIdx: number }
  | { kind: "range"; startDay: number; endDay: number; monthIdx: number }
  | { kind: "tba" };

const parseEventDate = (raw: string): ParsedDate => {
  if (!raw) return { kind: "tba" };
  const s = raw.trim().toLowerCase();
  if (!s || s === "tbd" || s === "tba") return { kind: "tba" };

  // Find month
  let monthIdx = -1;
  for (let i = 0; i < MONTH_NAMES.length; i++) {
    const m = MONTH_NAMES[i];
    if (s.includes(m) || s.includes(m.slice(0, 3))) {
      monthIdx = i;
      break;
    }
  }

  // Range: "21 - 25 May 2026" or "8 - 11 May 2026"
  const rangeMatch = s.match(/(\d{1,2})\s*[-–]\s*(\d{1,2})/);
  if (rangeMatch && monthIdx >= 0) {
    return {
      kind: "range",
      startDay: parseInt(rangeMatch[1], 10),
      endDay: parseInt(rangeMatch[2], 10),
      monthIdx,
    };
  }

  // Single: "8 May 2026"
  const singleMatch = s.match(/(\d{1,2})/);
  if (singleMatch && monthIdx >= 0) {
    return { kind: "single", day: parseInt(singleMatch[1], 10), monthIdx };
  }

  // Fallback Date parse
  const d = new Date(raw);
  if (!isNaN(d.getTime())) {
    return { kind: "single", day: d.getDate(), monthIdx: d.getMonth() };
  }
  return { kind: "tba" };
};

const HomeWhatsOn = () => {
  const { data: events } = useQuery({
    queryKey: ["home-whats-on"],
    queryFn: async () => {
      // 1. Check curated picks
      const { data: siteContent } = await supabase
        .from("site_content")
        .select("content")
        .eq("section", "homepage-whats-on")
        .maybeSingle();

      if (siteContent?.content && Array.isArray(siteContent.content) && siteContent.content.length > 0) {
        const ids = siteContent.content as string[];
        const { data } = await supabase
          .from("events")
          .select("id, title, location, date")
          .in("id", ids);
        const map = new Map((data || []).map((e) => [e.id, e]));
        return ids
          .map((id) => map.get(id))
          .filter(Boolean)
          .map((e: any) => {
            const d = new Date(e.date);
            return { ...e, parsed: isNaN(d.getTime()) ? null : d };
          })
          .slice(0, 6);
      }

      // 2. Fallback: upcoming events
      const { data } = await supabase
        .from("events")
        .select("id, title, location, date")
        .order("date", { ascending: true })
        .limit(20);
      const now = new Date();
      const today = new Date(now.toDateString());
      return (data || [])
        .map((e) => {
          const d = new Date(e.date);
          return { ...e, parsed: isNaN(d.getTime()) ? null : d };
        })
        .filter((e) => !e.parsed || e.parsed >= today)
        .slice(0, 4);
    },
  });

  if (!events || events.length === 0) return null;

  return (
    <section>
      <HomeSectionHead primary="What's on" actionLabel="All events" actionHref="/events" />
      <div style={{ padding: "0 24px" }}>
        <div style={{ background: "#FFFFFF", borderRadius: 24, padding: "4px 20px" }}>
          {events.map((e, idx) => (
            <Link
              key={e.id}
              to={`/events/${e.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                padding: "18px 0",
                borderBottom: idx < events.length - 1 ? "1px solid #F2EFEC" : "none",
                textDecoration: "none",
              }}
            >
              <div style={{ width: 44, flexShrink: 0, textAlign: "left" }}>
                {e.parsed ? (
                  <>
                    <div
                      style={{
                        fontFamily: SERIF,
                        fontWeight: 300,
                        fontSize: 36,
                        lineHeight: 0.9,
                        color: "#0A0A0A",
                      }}
                    >
                      {e.parsed.getDate()}
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        fontFamily: SANS,
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: "#8A8480",
                      }}
                    >
                      {MONTHS[e.parsed.getMonth()]}
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      fontFamily: SANS,
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "#8A8480",
                    }}
                  >
                    TBA
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "'Helvetica World', Helvetica, Arial, sans-serif",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#0A0A0A",
                    lineHeight: 1.25,
                    marginBottom: 6,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    wordBreak: "break-word",
                  }}
                >
                  {e.title}
                </div>
                {e.location && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                      fontSize: 12,
                      color: "#8A8480",
                      overflow: "hidden",
                    }}
                  >
                    <MapPin size={12} color="#B8A89A" strokeWidth={2} style={{ flexShrink: 0 }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {e.location}
                    </span>
                  </div>
                )}
              </div>
              <ChevronRight size={16} color="#8A8480" strokeWidth={2} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeWhatsOn;
