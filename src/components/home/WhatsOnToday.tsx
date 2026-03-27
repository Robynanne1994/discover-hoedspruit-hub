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

      // Sort by date proximity — try to parse dates and show soonest first
      const now = new Date();
      const sorted = data
        .map((e) => {
          // Try to extract a date from the date string
          const parsed = new Date(e.date);
          return { ...e, parsedDate: isNaN(parsed.getTime()) ? null : parsed };
        })
        // Show events with parseable future dates first, then others
        .sort((a, b) => {
          if (a.parsedDate && b.parsedDate) return a.parsedDate.getTime() - b.parsedDate.getTime();
          if (a.parsedDate) return -1;
          if (b.parsedDate) return 1;
          return 0;
        })
        // Filter to upcoming or undated
        .filter((e) => !e.parsedDate || e.parsedDate >= new Date(now.toDateString()))
        .slice(0, 3);

      return sorted;
    },
  });

  if (isLoading) {
    return (
      <section className="pb-4">
        <SectionHeader title="What's On in Hoedspruit" actionLabel="See all" actionHref="/events" />
        <div className="mx-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-6 w-full rounded" />
          ))}
        </div>
      </section>
    );
  }

  if (!events?.length) return null;

  const formatTime = (time: string | null) => {
    if (!time) return "";
    // Convert "07:30" to "7:30 AM"
    const [h, m] = time.split(":");
    const hour = parseInt(h);
    if (isNaN(hour)) return time;
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${m} ${ampm}`;
  };

  return (
    <section className="pb-4">
      <SectionHeader title="What's On in Hoedspruit" actionLabel="See all" actionHref="/events" />
      <div className="mx-4 divide-y divide-border">
        {events.map((event) => (
          <div key={event.id} className="flex items-baseline gap-4 py-3">
            <span className="text-sm font-semibold text-primary whitespace-nowrap w-[72px]">
              {formatTime(event.start_time) || event.date?.slice(0, 6) || "TBA"}
            </span>
            <span className="text-sm text-foreground">
              {event.title}{" "}
              {event.location && (
                <span className="text-muted-foreground">at {event.location}</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WhatsOnToday;
