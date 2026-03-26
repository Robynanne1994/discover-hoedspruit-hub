import { Calendar, MapPin, Clock, ArrowRight, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
} from "@/components/ui/carousel";

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
    <section id="events" className="section-padding bg-secondary-fill">
      <div className="container-wide">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-6 gap-4">
          <div>
            <span className="text-primary font-medium text-sm tracking-widest uppercase">What's On</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3 font-sans text-foreground">Upcoming Events</h2>
          </div>
          <Button variant="ghost" className="text-primary gap-2 self-start sm:self-auto" asChild>
            <a href="/events">View all events <ArrowRight className="h-4 w-4" /></a>
          </Button>
        </div>

        {hasEvents ? (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-3 font-sans">Events</h3>
            <Carousel opts={{ align: "start", loop: false }} className="w-full">
              <CarouselContent className="-ml-2">
                {events.slice(0, 8).map((event) => (
                  <CarouselItem key={event.id} className="pl-2 basis-1/2">
                    <a href="/events" className="group block">
                      <div className="relative rounded-sm overflow-hidden aspect-square shadow-card hover:shadow-warm transition-all duration-300">
                        {event.image_url ? (
                          <img src={event.image_url} alt={event.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="absolute inset-0 bg-muted flex items-center justify-center">
                            <Calendar className="h-8 w-8 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                      <div className="pt-1.5 px-0.5">
                        {event.tag && (
                          <span className="text-primary text-[8px] font-semibold uppercase tracking-wider">{event.tag}</span>
                        )}
                        <h3 className="text-xs font-bold text-foreground font-sans line-clamp-2 leading-tight">{event.title}</h3>
                        <span className="text-muted-foreground text-[8px] mt-0.5">{event.date}</span>
                      </div>
                    </a>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselNext className="hidden sm:flex" />
            </Carousel>
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