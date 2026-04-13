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
      <section style={{ padding: "32px 24px 0" }}>
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
    <section style={{ padding: "32px 24px 24px" }}>
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
                borderBottom: idx < events.length - 1 ? "1px solid rgba(18,18,20,0.06)" : "none",
                textDecoration: "none",
              }}
            >
              <div style={{
                width: 50,
                height: 50,
                background: "rgba(18,18,20,0.04)",
                borderRadius: 10,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                {parsed ? (
                  <>
                    <span style={{ fontSize: 20, fontWeight: 800, color: "#121214", lineHeight: 1 }}>{parsed.getDate()}</span>
                    <span style={{ fontSize: 10, color: "rgba(18,18,20,0.35)", textTransform: "uppercase", letterSpacing: 0.5 }}>{months[parsed.getMonth()]}</span>
                  </>
                ) : (
                  <span style={{ fontSize: 10, color: "rgba(18,18,20,0.35)", fontWeight: 500 }}>TBA</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#121214", lineHeight: 1.2, marginBottom: 3 }}>{event.title}</div>
                {event.location && (
                  <div style={{ fontSize: 12, color: "rgba(18,18,20,0.4)" }}>{event.location}</div>
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
