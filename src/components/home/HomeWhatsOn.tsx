import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import HomeSectionHead from "./HomeSectionHead";
import { getEventDates } from "@/lib/eventDates";
import { getDisplayTitle, noTitleCaseProps } from "@/lib/displayTitle";

const HN = "'Helvetica Neue', Helvetica, Arial, sans-serif";
function formatTime(t?: string | null) {
  if (!t) return "";
  const m = /^(\d{1,2}):(\d{2})/.exec(t);
  if (!m) return t;
  let h = parseInt(m[1], 10);
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m[2]} ${suffix}`;
}

const MONTHS_SHORT = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

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
          .select("id, title, title_override, location, date, start_time, start_date, end_date, image_url, homepage_image_url")
          .in("id", ids);
        const map = new Map((data || []).map((e) => [e.id, e]));
        return ids
          .map((id) => map.get(id))
          .filter((e): e is NonNullable<typeof e> => Boolean(e))
          .slice(0, 6);
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayIso = today.toISOString().slice(0, 10);
      const { data } = await supabase
        .from("events")
        .select("id, title, title_override, location, date, start_time, start_date, end_date, image_url, homepage_image_url")
        .or(`end_date.gte.${todayIso},start_date.gte.${todayIso}`)
        .order("start_date", { ascending: true, nullsFirst: false })
        .limit(20);
      return (data || [])
        .filter((e) => {
          const { start, end } = getEventDates(e);
          const effectiveEnd = end ?? start;
          return effectiveEnd ? effectiveEnd >= today : true;
        })
        .slice(0, 6);
    },
  });

  if (!events || events.length === 0) return null;

  return (
    <section>
      <HomeSectionHead primary="Upcoming Events" actionHref="/events" />
      <div className="scrollbar-hide" style={{ overflowX: "auto", paddingLeft: 20 }}>
        <div style={{ display: "flex", gap: 8, paddingRight: 20 }}>
          {events.map((e) => {
            const { start } = getEventDates(e);
            const dayNum = start?.getDate();
            const monLbl = start ? MONTHS_SHORT[start.getMonth()] : "";
            const timeLbl = formatTime((e as any).start_time);
            const metaLine = [timeLbl, e.location].filter(Boolean).join(" \u00b7 ");
            return (
              <Link
                key={e.id}
                to={`/events/${e.id}`}
                onPointerDown={(ev) => (ev.currentTarget.style.transform = "scale(0.98)")}
                onPointerUp={(ev) => (ev.currentTarget.style.transform = "scale(1)")}
                onPointerLeave={(ev) => (ev.currentTarget.style.transform = "scale(1)")}
                style={{
                  position: "relative",
                  width: 144,
                  height: 192,
                  flexShrink: 0,
                  background: "#F4EFE3",
                  borderRadius: 14,
                  overflow: "hidden",
                  textDecoration: "none",
                  transition: "transform 150ms ease-out",
                  display: "block",
                }}
              >
                {(e.homepage_image_url || e.image_url) && (
                  <img
                    src={e.homepage_image_url || e.image_url}
                    alt={e.title}
                    loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                )}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0) 38%, rgba(0,0,0,0.72) 100%)",
                  }}
                />
                {dayNum != null && (
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      left: 8,
                      padding: "4px 9px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.94)",
                      fontFamily: HN,
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      color: "#1A1A1A",
                      lineHeight: 1,
                    }}
                  >
                    {dayNum} {monLbl}
                  </div>
                )}
                <div style={{ position: "absolute", left: 10, right: 10, bottom: 10 }}>
                  <div
                    {...noTitleCaseProps(e)}
                    style={{
                      fontFamily: HN,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#ffffff",
                      lineHeight: 1.2,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {getDisplayTitle(e)}
                  </div>
                  {metaLine && (
                    <div
                      style={{
                        marginTop: 4,
                        fontFamily: HN,
                        fontSize: 10.5,
                        color: "rgba(255,255,255,0.88)",
                        lineHeight: 1.2,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {metaLine}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HomeWhatsOn;
