import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const EventsSection = () => {
  const { data: events } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const hasEvents = !!events?.length;

  return (
    <section id="events" className="section-padding bg-card">
      <div className="container-wide">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-12 gap-4">
          <div>
            <span className="text-primary font-medium text-sm tracking-widest uppercase">What's On</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mt-3">Upcoming Events</h2>
          </div>
          <Button variant="ghost" className="text-primary gap-2 self-start sm:self-auto" asChild>
            <a href="/events">View all events <ArrowRight className="h-4 w-4" /></a>
          </Button>
        </div>

        {hasEvents ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {events.slice(0, 4).map((event) => (
              <a key={event.id} href="#" className="group bg-background rounded-xl p-5 border border-border hover:border-primary/50 hover:shadow-warm transition-all duration-200">
                {event.tag && (
                  <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 rounded-full px-3 py-1 mb-4">
                    {event.tag}
                  </span>
                )}
                <h3 className="font-heading text-lg font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                  {event.title}
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary/70" />
                    {event.date}
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary/70" />
                      {event.location}
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="bg-background rounded-xl border border-border p-12 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">No upcoming events at the moment.</p>
            <p className="text-muted-foreground/70 text-sm mt-1">Check back soon for exciting local events!</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default EventsSection;
