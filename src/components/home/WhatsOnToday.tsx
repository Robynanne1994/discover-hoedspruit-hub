import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import HomeSectionHeader from "./HomeSectionHeader";

const WhatsOnToday = () => {
  const { data: events, isLoading } = useQuery({
    queryKey: ["homepage-events"],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("id, title, location, start_time, date")
        .order("date", { ascending: true })
        .limit(20);

      if (!data) return [];

      const now = new Date();
      return data
        .map((e) => {
          const parsed = new Date(e.date);
          return { ...e, parsedDate: isNaN(parsed.getTime()) ? null : parsed };
        })
        .sort((a, b) => {
          if (a.parsedDate && b.parsedDate) return a.parsedDate.getTime() - b.parsedDate.getTime();
          if (a.parsedDate) return -1;
          if (b.parsedDate) return 1;
          return 0;
        })
        .filter((e) => !e.parsedDate || e.parsedDate >= new Date(now.toDateString()))
        .slice(0, 3);
    },
  });

  if (isLoading) {
    return (
      <section style={{ padding: "0 24px" }}>
        <HomeSectionHeader title="What's On" actionLabel="See All" actionHref="/events" />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-5 w-full rounded" />
          ))}
        </div>
      </section>
    );
  }

  if (!events?.length) return null;

  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

  return (
    <section style={{ padding: "0 24px" }}>
      <HomeSectionHeader title="What's On" actionLabel="See All" actionHref="/events" />
      <div>
        {events.map((event, idx) => {
          const parsed = event.parsedDate;
          return (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 0",
                borderBottom: idx < events.length - 1 ? "1px solid rgba(18,18,20,0.08)" : "none",
                textDecoration: "none",
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                background: "#EBEBEB",
                borderRadius: "50%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                {parsed ? (
                  <>
                    <span style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 20, fontWeight: 500, color: "#020202", lineHeight: 1 }}>{parsed.getDate()}</span>
                    <span style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 12, fontWeight: 500, color: "rgba(18,18,20,0.55)", textTransform: "uppercase" }}>{months[parsed.getMonth()]}</span>
                  </>
                ) : (
                  <span style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 12, color: "rgba(18,18,20,0.55)", fontWeight: 500 }}>TBA</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 16, fontWeight: 400, color: "#2B2420", lineHeight: 1.2, marginBottom: 3 }}>{event.title}</div>
                {event.location && (
                  <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 14, fontWeight: 400, color: "rgba(18,18,20,0.55)" }}>{event.location}</div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default WhatsOnToday;
