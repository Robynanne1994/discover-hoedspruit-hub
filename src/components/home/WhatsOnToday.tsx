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
          <div
            key={event.id}
            className={`flex items-baseline gap-5 py-4 ${idx < events.length - 1 ? "border-b border-border/60" : ""}`}
          >
            <span
              className="text-[13px] font-semibold text-primary whitespace-nowrap min-w-[60px] uppercase tracking-wide"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {(() => {
                if (!event.date) return "TBA";
                const parsed = new Date(event.date);
                if (!isNaN(parsed.getTime())) {
                  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                  return `${parsed.getDate()} ${months[parsed.getMonth()]}`;
                }
                return event.date;
              })()}
            </span>
            <div className="flex-1 min-w-0">
              <span className="text-[14px] text-foreground leading-snug">
                {event.title}
              </span>
              {event.location && (
                <span className="block text-[12px] text-muted-foreground mt-0.5">{event.location}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WhatsOnToday;
