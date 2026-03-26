import { Calendar, MapPin, Clock, Repeat } from "lucide-react";
import FavouriteButton from "@/components/FavouriteButton";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description?: string | null;
    date: string;
    start_time?: string | null;
    end_time?: string | null;
    recurrence?: string | null;
    location?: string | null;
    image_url?: string | null;
    tag?: string | null;
  };
}

const EventCard = ({ event }: EventCardProps) => {
  return (
    <div className="group relative bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 hover:shadow-warm transition-all duration-200">
      <FavouriteButton itemId={event.id} itemType="event" />
      <div className="flex">
        {event.image_url && (
          <div className="w-32 sm:w-40 shrink-0">
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <div className="p-4 flex-1 min-w-0">
          {event.tag && (
            <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 rounded-full px-2 py-0.5 mb-1.5">
              {event.tag}
            </span>
          )}
          <h3 className="font-heading text-base font-semibold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-2">
            {event.title}
          </h3>
          {event.description && (
            <div
              className="text-muted-foreground text-sm mb-2 line-clamp-2 break-words prose-a:text-primary prose-a:underline"
              dangerouslySetInnerHTML={{ __html: event.description }}
            />
          )}
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-primary/70 shrink-0" />
              <span
                className="break-words prose-a:text-primary prose-a:underline text-xs"
                dangerouslySetInnerHTML={{ __html: event.date }}
              />
            </div>
            {(event.start_time || event.end_time) && (
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                <span className="text-xs">
                  {event.start_time}
                  {event.start_time && event.end_time ? " – " : ""}
                  {event.end_time}
                </span>
              </div>
            )}
            {event.recurrence && (
              <div className="flex items-center gap-2">
                <Repeat className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                <span className="text-xs">{event.recurrence}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                <span
                  className="break-words prose-a:text-primary prose-a:underline text-xs"
                  dangerouslySetInnerHTML={{ __html: event.location }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
