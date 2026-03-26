import { useState, useMemo } from "react";
import { Calendar, CalendarDays } from "lucide-react";
import EventCard from "@/components/events/EventCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import BackButton from "@/components/BackButton";
import { parse, isToday, isTomorrow, isWeekend, isBefore, isAfter, startOfToday, format } from "date-fns";

type FilterType = "upcoming" | "today" | "tomorrow" | "weekend" | "past";

/** Try to extract a Date from the free-text date string */
function parseDateText(raw: string): Date | null {
  if (!raw) return null;
  const clean = raw.replace(/<[^>]*>/g, "").trim();

  // Range – use first date
  const rangeMatch = clean.match(/(\d{1,2})\s*(?:to|-)\s*\d{1,2}\s+(\w+)\s+(\d{4})/i);
  if (rangeMatch) {
    const parsed = parse(`${rangeMatch[1]} ${rangeMatch[2]} ${rangeMatch[3]}`, "d MMMM yyyy", new Date());
    if (!isNaN(parsed.getTime())) return parsed;
  }

  const formats = ["d MMMM yyyy", "MMMM d, yyyy", "yyyy-MM-dd", "d/MM/yyyy"];
  for (const fmt of formats) {
    const d = parse(clean, fmt, new Date());
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

const filters: { label: string; value: FilterType }[] = [
  { label: "Upcoming", value: "upcoming" },
  { label: "Today", value: "today" },
  { label: "Tomorrow", value: "tomorrow" },
  { label: "Weekend", value: "weekend" },
  { label: "Past", value: "past" },
];

const Events = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>("upcoming");

  const { data: events, isLoading } = useQuery({
    queryKey: ["events-page"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    const today = startOfToday();

    return events.filter((event) => {
      const date = parseDateText(event.date);
      if (!date) {
        // Events with unparseable dates show in upcoming only
        return activeFilter === "upcoming";
      }

      switch (activeFilter) {
        case "upcoming":
          return !isBefore(date, today);
        case "today":
          return isToday(date);
        case "tomorrow":
          return isTomorrow(date);
        case "weekend":
          return isWeekend(date) && !isBefore(date, today);
        case "past":
          return isBefore(date, today);
        default:
          return true;
      }
    });
  }, [events, activeFilter]);

  const tags = [...new Set(filteredEvents?.map((e) => e.tag).filter(Boolean))] as string[];

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="pt-32 pb-16 section-padding bg-background">
        <div className="container-wide">
          <BackButton />
          <div className="mb-8 bg-muted-foreground">
            <span className="text-primary font-medium text-sm tracking-widest uppercase">What's On</span>
            <h1 className="font-heading text-4xl sm:text-5xl font-bold text-foreground mt-3">Events</h1>
            <p className="text-muted-foreground mt-3 max-w-2xl">Discover markets, sports, dining experiences and more happening in and around Hoedspruit.</p>
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {filters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeFilter === filter.value
                    ? "bg-accent text-primary"
                    : "bg-muted text-muted-foreground hover:bg-accent/50"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Calendar link button */}
          <div className="mb-8">
            <Button asChild variant="outline" className="gap-2">
              <Link to="/events/calendar">
                <CalendarDays className="h-4 w-4" />
                Events Calendar
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <p className="text-muted-foreground">Loading events...</p>
          ) : filteredEvents.length > 0 ? (
            <div className="space-y-12">
              {tags.length > 0 ? (
                tags.map((tag) => (
                  <div key={tag}>
                    <h2 className="font-heading text-2xl font-semibold text-foreground mb-6">{tag}</h2>
                    <div className="space-y-4">
                      {filteredEvents
                        .filter((e) => e.tag === tag)
                        .map((event) => (
                          <EventCard key={event.id} event={event} />
                        ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="space-y-4">
                  {filteredEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border p-12 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No events found for this filter.</p>
              <p className="text-muted-foreground/70 text-sm mt-1">Try a different filter or check back soon!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Events;
