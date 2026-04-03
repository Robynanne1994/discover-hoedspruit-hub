import { Link } from "react-router-dom";
import SectionHeader from "./SectionHeader";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

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
      const sorted = data
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

      return sorted;
    },
  });

  if (isLoading) {
    return (
      <section className="py-8">
        <SectionHeader title="What's On" actionLabel="See all" actionHref="/events" />
        <div className="mx-5 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-5 w-full rounded" />
          ))}
        </div>
      </section>
    );
  }

  if (!events?.length) return null;

  return (
    <section className="py-8">
      <SectionHeader title="What's On" actionLabel="See all" actionHref="/events" />
      <div className="mx-5 space-y-0">
        {events.map((event, idx) => (
          <Link
            key={event.id}
            to={`/events/${event.id}`}
            className={`flex items-baseline gap-5 py-4 ${idx < events.length - 1 ? "border-b border-border/60" : ""}`}
          >
            <div className="flex flex-col items-center justify-center bg-muted/60 rounded-xl min-w-[52px] w-[52px] h-[52px] shrink-0 border border-border/40">
              {(() => {
                if (!event.date) return <span className="text-[11px] text-muted-foreground font-medium">TBA</span>;
                const parsed = new Date(event.date);
                if (!isNaN(parsed.getTime())) {
                  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                  return (
                    <>
                      <span className="text-[18px] font-semibold text-foreground leading-none">{parsed.getDate()}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">{months[parsed.getMonth()]}</span>
                    </>
                  );
                }
                return <span className="text-[10px] text-muted-foreground font-medium">{event.date}</span>;
              })()}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[14px] text-foreground leading-snug">
                {event.title}
              </span>
              {event.location && (
                <span className="block text-[12px] mt-0.5 text-muted-foreground">{event.location}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default WhatsOnToday;
