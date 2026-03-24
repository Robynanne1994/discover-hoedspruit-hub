import { Calendar, MapPin, Clock, ArrowRight } from "lucide-react";
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
    }
  });

  const hasEvents = !!events?.length;

  return (
    <section id="events" className="section-padding bg-[#f2ece3]">
      <div className="container-wide">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-12 gap-4">
          <div>
            <span className="text-primary font-medium text-sm tracking-widest uppercase">What's On</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3 font-sans text-stone-900">Upcoming Events</h2>
          </div>
          <Button variant="ghost" className="text-primary gap-2 self-start sm:self-auto" asChild>
            <a href="/events">View all events <ArrowRight className="h-4 w-4" /></a>
          </Button>
        </div>

        {hasEvents ?
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {events.slice(0, 4).map((event) =>
          <a key={event.id} href="#" className="group bg-background rounded-xl border border-border hover:border-primary/50 hover:shadow-warm transition-all duration-200 flex flex-col overflow-hidden">
                {event.image_url && (
                  <div className="aspect-[16/10] overflow-hidden">
                    <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                )}
                <div className="p-5 flex flex-col flex-1">
                  {event.tag &&
                    <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 rounded-full px-3 py-1 mb-3 self-start">
                      {event.tag}
                    </span>
                  }
                  <h3 className="text-base font-semibold text-foreground mb-2 group-hover:text-primary transition-colors font-sans line-clamp-2 leading-snug">
                    {event.title}
                  </h3>
                  {event.description && (
                    <div className="text-sm text-muted-foreground mb-3 line-clamp-2 break-words prose-a:text-primary prose-a:underline" dangerouslySetInnerHTML={{ __html: event.description }} />
                  )}
                  <div className="mt-auto space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2.5">
                      <Calendar className="h-5 w-5 text-primary/70 shrink-0" />
                      <span className="truncate break-words prose-a:text-primary prose-a:underline" dangerouslySetInnerHTML={{ __html: event.date }} />
                    </div>
                    {event.location &&
                      <div className="flex items-center gap-2.5">
                        <MapPin className="h-5 w-5 text-primary/70 shrink-0" />
                        <span className="truncate break-words prose-a:text-primary prose-a:underline" dangerouslySetInnerHTML={{ __html: event.location }} />
                      </div>
                    }
                  </div>
                </div>
              </a>
          )}
          </div> :

        <div className="bg-background rounded-xl border border-border p-12 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">No upcoming events at the moment.</p>
            <p className="text-muted-foreground/70 text-sm mt-1">Check back soon for exciting local events!</p>
          </div>
        }
      </div>
    </section>);

};

export default EventsSection;