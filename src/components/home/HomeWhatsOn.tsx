import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import HomeSectionHead from "./HomeSectionHead";
import { getEventDates } from "@/lib/eventDates";
import { mergeFeaturedFirst } from "@/lib/featuredFirst";
import { getDisplayTitle, noTitleCaseProps } from "@/lib/displayTitle";
import { INK, type } from "@/lib/type";

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

const COLUMNS =
  "id, title, title_override, location, date, start_time, start_date, end_date, image_url, homepage_image_url, is_featured";
const TARGET = 6;

const HomeWhatsOn = () => {
  const { data: events } = useQuery({
    queryKey: ["home-whats-on"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayIso = today.toISOString().slice(0, 10);
      const stillOn = (rows: any[] | null) =>
        (rows || []).filter((e) => {
          const { start, end } = getEventDates(e);
          const effectiveEnd = end ?? start;
          return effectiveEnd ? effectiveEnd >= today : true;
        });

      // Featured events headline the row, ahead of the admin's curated picks.
      const { data: featuredRows } = await supabase
        .from("events")
        .select(COLUMNS)
        .eq("is_featured", true)
        .or(`end_date.gte.${todayIso},start_date.gte.${todayIso}`)
        .order("start_date", { ascending: true, nullsFirst: false })
        .limit(TARGET);
      const featured = stillOn(featuredRows);

      const { data: siteContent } = await supabase
        .from("site_content")
        .select("content")
        .eq("section", "homepage-whats-on")
        .maybeSingle();

      if (siteContent?.content && Array.isArray(siteContent.content) && siteContent.content.length > 0) {
        const ids = siteContent.content as string[];
        const { data } = await supabase
          .from("events")
          .select(COLUMNS)
          .in("id", ids);
        const map = new Map((data || []).map((e) => [e.id, e]));
        const curated = stillOn(
          ids
            .map((id) => map.get(id))
            .filter((e): e is NonNullable<typeof e> => Boolean(e))
        );
        return mergeFeaturedFirst([featured, curated], TARGET);
      }

      const { data } = await supabase
        .from("events")
        .select(COLUMNS)
        .or(`end_date.gte.${todayIso},start_date.gte.${todayIso}`)
        .order("start_date", { ascending: true, nullsFirst: false })
        .limit(20);
      return mergeFeaturedFirst([featured, stillOn(data)], TARGET);
    },
  });

  if (!events || events.length === 0) return null;

  return (
    <section>
      <HomeSectionHead primary="Upcoming Events" actionHref="/events" />
      <div className="scrollbar-hide" style={{ overflowX: "auto", paddingLeft: 20 }}>
        <div style={{ display: "flex", gap: 8, paddingRight: 20 }}>
          {events.map((e) => {
            const { start, end } = getEventDates(e);
            const isMultiDay = !!start && !!end && start.getTime() !== end.getTime();
            const dateLbl = formatEventDateShort(e);
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
                {dateLbl && (
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      left: 8,
                      maxWidth: isMultiDay ? "calc(100% - 16px)" : undefined,
                      padding: "4px 9px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.94)",
                      ...type.label,
                      color: INK,
                      lineHeight: 1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {dateLbl}
                  </div>
                )}
                <div style={{ position: "absolute", left: 10, right: 10, bottom: 10 }}>
                  <div
                    {...noTitleCaseProps(e)}
                    style={{
                      ...type.cardTitleS,
                      color: "#ffffff",
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
                        ...type.meta,
                        marginTop: 4,
                        color: "rgba(255,255,255,0.88)",
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
