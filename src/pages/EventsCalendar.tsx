import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import DOMPurify from "dompurify";
import { supabase } from "@/integrations/supabase/client";

const sanitizeHtml = (html: string) =>
  DOMPurify.sanitize(html, { ALLOWED_URI_REGEXP: /^(?:https?|mailto|tel):/i });
import Navbar from "@/components/Navbar";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Clock, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/BackButton";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parse,
} from "date-fns";

import { expandEventDates, formatEventDateRange } from "@/lib/eventDates";

/** Concrete dates an event spans, using new structured fields with legacy fallback. */
function parseDateText(_raw: string, event?: any): Date[] {
  if (event) return expandEventDates(event);
  return [];
}

type EventRow = {
  id: string;
  title: string;
  date: string;
  description: string | null;
  location: string | null;
  image_url: string | null;
  tag: string | null;
  start_time: string | null;
  end_time: string | null;
  recurrence: string | null;
};

const EventsCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { data: events } = useQuery({
    queryKey: ["events-calendar"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").order("date");
      if (error) throw error;
      return data as EventRow[];
    },
  });

  // Map dates → events
  const { dateEventMap, recurringEvents } = useMemo(() => {
    const map = new Map<string, EventRow[]>();
    const recurring: EventRow[] = [];

    events?.forEach((event) => {
      const dates = parseDateText(event.date, event);
      if (dates.length === 0) {
        recurring.push(event);
      } else {
        dates.forEach((d) => {
          const key = format(d, "yyyy-MM-dd");
          if (!map.has(key)) map.set(key, []);
          map.get(key)!.push(event);
        });
      }
    });

    return { dateEventMap: map, recurringEvents: recurring };
  }, [events]);

  // Build calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let day = calStart;
  while (day <= calEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const selectedEvents = selectedDate
    ? dateEventMap.get(format(selectedDate, "yyyy-MM-dd")) || []
    : [];

  return (
    <div className="min-h-screen" style={{ background: "#5C6446" }}>
      <Navbar />
      <section className="pt-24 pb-32 section-padding">
        <div className="container-wide max-w-3xl mx-auto">
          <BackButton />
          <div className="mb-8">
            <span className="text-primary font-medium text-sm tracking-widest uppercase">What's On</span>
            <h1 className="font-sans text-3xl sm:text-4xl font-bold text-foreground mt-2">
              Events Calendar
            </h1>
          </div>

          {/* Calendar */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden mb-6">
            {/* Month navigation */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h2 className="font-semibold text-lg text-foreground">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 text-center border-b border-border">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
              {days.map((d, i) => {
                const key = format(d, "yyyy-MM-dd");
                const hasEvents = dateEventMap.has(key);
                const inMonth = isSameMonth(d, currentMonth);
                const today = isToday(d);
                const selected = selectedDate && isSameDay(d, selectedDate);

                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (hasEvents) setSelectedDate(d);
                    }}
                    className={`
                      relative flex flex-col items-center justify-center py-3 sm:py-4 text-sm transition-colors
                      ${!inMonth ? "text-muted-foreground/30" : "text-foreground"}
                      ${hasEvents && inMonth ? "cursor-pointer hover:bg-accent/50 font-semibold" : "cursor-default"}
                      ${selected ? "bg-primary/10" : ""}
                      ${today && !selected ? "font-bold" : ""}
                    `}
                  >
                    <span className={today ? "flex items-center justify-center h-7 w-7 rounded-full bg-primary text-primary-foreground text-sm" : ""}>
                      {format(d, "d")}
                    </span>
                    {hasEvents && inMonth && (
                      <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected date events */}
          {selectedDate && (
            <div className="mb-8">
              <h3 className="font-semibold text-foreground mb-4">
                Events on {format(selectedDate, "d MMMM yyyy")}
              </h3>
              {selectedEvents.length === 0 ? (
                <p className="text-muted-foreground text-sm">No events on this date.</p>
              ) : (
                <div className="space-y-3">
                  {selectedEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recurring / unparsed events */}
          {recurringEvents.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Repeat className="h-4 w-4 text-primary" />
                Recurring & Ongoing Events
              </h3>
              <div className="space-y-3">
                {recurringEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

function EventCard({ event }: { event: EventRow }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-colors">
      <div className="flex gap-4 p-4">
        {event.image_url && (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-20 h-20 rounded-2xl object-cover shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground mb-1">{event.title}</h4>
          {event.tag && (
            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 rounded-full px-2 py-0.5 mb-2">
              {event.tag}
            </span>
          )}
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-3.5 w-3.5 text-primary/70 shrink-0" />
              <span
                className="truncate prose-a:text-primary prose-a:underline"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(formatEventDateRange(event)) }}
              />
            </div>
            {(() => {
              const st = event.start_time && String(event.start_time).trim() ? event.start_time : null;
              const et = event.end_time && String(event.end_time).trim() ? event.end_time : null;
              if (!st && !et) return null;
              return (
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                  <span>
                    {st || ""}{st && et ? " – " : ""}{et && !st ? et : (st && et ? et : "")}
                  </span>
                </div>
              );
            })()}
            {event.recurrence && (
              <div className="flex items-center gap-2">
                <Repeat className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                <span>{event.recurrence}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                <span
                  className="truncate prose-a:text-primary prose-a:underline"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(event.location) }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventsCalendar;
