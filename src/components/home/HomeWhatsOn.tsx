import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import HomeSectionHead from "./HomeSectionHead";
import { getEventDates } from "@/lib/eventDates";
import { getDisplayTitle, noTitleCaseProps } from "@/lib/displayTitle";

const HN = "'Helvetica Neue', Helvetica, Arial, sans-serif";
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
          .select("id, title, title_override, location, date, start_date, end_date, image_url, homepage_image_url")
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
        .select("id, title, title_override, location, date, start_date, end_date, image_url, homepage_image_url")
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
      <HomeSectionHead primary="All Upcoming Events" actionHref="/events" />
      <div className="scrollbar-hide" style={{ overflowX: "auto", paddingLeft: 20 }}>
        <div style={{ display: "flex", gap: 4, paddingRight: 20 }}>
          {events.map((e) => {
            const { start } = getEventDates(e);
            const dayNum = start?.getDate();
            const monLbl = start ? MONTHS_SHORT[start.getMonth()] : "";
            return (
              <Link
                key={e.id}
                to={`/events/${e.id}`}
                onPointerDown={(ev) => (ev.currentTarget.style.transform = "scale(0.98)")}
                onPointerUp={(ev) => (ev.currentTarget.style.transform = "scale(1)")}
                onPointerLeave={(ev) => (ev.currentTarget.style.transform = "scale(1)")}
                style={{
                  position: "relative",
                  width: 230,
                  height: 300,
                  flexShrink: 0,
                  background: "#F4EFE3",
                  borderRadius: 16,
                  overflow: "hidden",
                  textDecoration: "none",
                  transition: "transform 150ms ease-out",
                  display: "block",
                }}
              >
                {e.image_url && (
                  <img
                    src={e.image_url}
                    alt={e.title}
                    loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                )}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.65) 100%)",
                  }}
                />
                {dayNum != null && (
                  <div
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      width: 50,
                      height: 50,
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.92)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      lineHeight: 1,
                    }}
                  >
                    <span style={{ fontFamily: HN, fontSize: 9, letterSpacing: "0.08em", color: "#6B6A5E" }}>{monLbl}</span>
                    <span style={{ fontFamily: HN, fontSize: 17, color: "#020202", marginTop: 2 }}>{dayNum}</span>
                  </div>
                )}
                <div style={{ position: "absolute", left: 14, right: 14, bottom: 14 }}>
                  <div
                    {...noTitleCaseProps(e)}
                    style={{
                      fontFamily: HN,
                      fontSize: 17,
                      color: "#ffffff",
                      lineHeight: 1.2,
                      wordBreak: "break-word",
                    }}
                  >
                    {getDisplayTitle(e)}
                  </div>
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
