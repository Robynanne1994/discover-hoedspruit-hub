import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const events = [
  {
    title: "Hoedspruit Craft Market",
    date: "Every Saturday",
    location: "Kamogelo Centre",
    tag: "Market",
  },
  {
    title: "Full Moon Bush Dinner",
    date: "22 March 2026",
    location: "Kapama Private Reserve",
    tag: "Dining",
  },
  {
    title: "Lowveld Trail Run",
    date: "5 April 2026",
    location: "Blyde River Canyon",
    tag: "Sport",
  },
  {
    title: "Wildlife Photography Workshop",
    date: "12 April 2026",
    location: "Hoedspruit Wildlife Centre",
    tag: "Workshop",
  },
];

const EventsSection = () => {
  return (
    <section id="events" className="section-padding bg-card">
      <div className="container-wide">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-12 gap-4">
          <div>
            <span className="text-primary font-medium text-sm tracking-widest uppercase">
              What's On
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mt-3">
              Upcoming Events
            </h2>
          </div>
          <Button variant="ghost" className="text-primary gap-2 self-start sm:self-auto">
            View all events <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {events.map((event) => (
            <a
              key={event.title}
              href="#"
              className="group bg-background rounded-xl p-5 border border-border hover:border-primary/50 hover:shadow-warm transition-all duration-200"
            >
              <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 rounded-full px-3 py-1 mb-4">
                {event.tag}
              </span>
              <h3 className="font-heading text-lg font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                {event.title}
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary/70" />
                  {event.date}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary/70" />
                  {event.location}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EventsSection;
