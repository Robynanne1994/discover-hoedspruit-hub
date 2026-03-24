import { Calendar, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Events = () => {
  const { data: events, isLoading } = useQuery({
    queryKey: ["events-page"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const tags = [...new Set(events?.map((e) => e.tag).filter(Boolean))] as string[];

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="pt-32 pb-16 section-padding bg-background">
        <div className="container-wide">
          <div className="mb-12">
            <span className="text-primary font-medium text-sm tracking-widest uppercase">What's On</span>
            <h1 className="font-heading text-4xl sm:text-5xl font-bold text-foreground mt-3">Events</h1>
            <p className="text-muted-foreground mt-3 max-w-2xl">Discover markets, sports, dining experiences and more happening in and around Hoedspruit.</p>
          </div>

          {isLoading ? (
            <p className="text-muted-foreground">Loading events...</p>
          ) : events?.length ? (
            <div className="space-y-12">
              {tags.length > 0 ? (
                tags.map((tag) => (
                  <div key={tag}>
                    <h2 className="font-heading text-2xl font-semibold text-foreground mb-6">{tag}</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {events
                        .filter((e) => e.tag === tag)
                        .map((event) => (
                          <div key={event.id} className="group bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 hover:shadow-warm transition-all duration-200">
                            {event.image_url && (
                              <div className="aspect-video overflow-hidden">
                                <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              </div>
                            )}
                            <div className="p-5">
                              <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 rounded-full px-3 py-1 mb-3">
                                {event.tag}
                              </span>
                              <h3 className="font-heading text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                                {event.title}
                              </h3>
                              {event.description && (
                                <div className="text-muted-foreground text-sm mb-3 line-clamp-3 break-words prose-a:text-primary prose-a:underline" dangerouslySetInnerHTML={{ __html: event.description }} />
                              )}
                              <div className="space-y-1.5 text-sm text-muted-foreground">
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
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {events.map((event) => (
                    <div key={event.id} className="group bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 hover:shadow-warm transition-all duration-200">
                      {event.image_url && (
                        <div className="aspect-video overflow-hidden">
                          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                      )}
                      <div className="p-5">
                        <h3 className="font-heading text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                          {event.title}
                        </h3>
                        {event.description && (
                          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{event.description}</p>
                        )}
                        <div className="space-y-1.5 text-sm text-muted-foreground">
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border p-12 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No upcoming events at the moment.</p>
              <p className="text-muted-foreground/70 text-sm mt-1">Check back soon for exciting local events!</p>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Events;
