import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ArrowRight, Calendar, Clock, MapPin, Tag, RotateCcw } from "lucide-react";

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: event, isLoading } = useQuery({
    queryKey: ["event-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const formatTime = (time: string | null) => {
    if (!time) return null;
    const [h, m] = time.split(":");
    const hour = parseInt(h);
    if (isNaN(hour)) return time;
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white pb-20">
        <Skeleton className="w-full aspect-[4/3]" />
        <div className="px-6 pt-8 space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center pb-20">
        <p className="text-neutral-400 text-sm">Event not found</p>
      </div>
    );
  }

  const detailRows = [
    { label: "Date", value: event.date, icon: Calendar },
    { label: "Time", value: event.start_time ? `${formatTime(event.start_time)}${event.end_time ? ` – ${formatTime(event.end_time)}` : ""}` : null, icon: Clock },
    { label: "Venue", value: event.location, icon: MapPin },
    { label: "Category", value: event.tag, icon: Tag },
    { label: "Recurrence", value: event.recurrence, icon: RotateCcw },
  ].filter((r) => r.value);

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="fixed top-4 left-4 z-20 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center"
      >
        <ArrowLeft className="h-4 w-4 text-neutral-800" />
      </button>

      {/* Hero image */}
      {event.image_url ? (
        <div className="w-full aspect-[4/3] overflow-hidden">
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full aspect-[4/3] bg-neutral-100 flex items-center justify-center">
          <Calendar className="h-12 w-12 text-neutral-300" />
        </div>
      )}

      {/* Title */}
      <div className="px-6 pt-8 pb-2">
        <h1
          className="text-[36px] font-light text-neutral-900 leading-[1.1] tracking-[-0.02em]"
          style={{ fontFamily: "'Cormorant Garamond', 'Georgia', serif" }}
        >
          {event.title}
        </h1>
      </div>

      {/* Description */}
      {event.description && (
        <div className="px-6 pt-4 pb-2">
          <h2
            className="text-[15px] font-semibold text-neutral-900 leading-[1.3] mb-2"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            About this event
          </h2>
          <p
            className="text-[14px] text-neutral-500 leading-[1.7] tracking-[0.01em]"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {event.description}
          </p>
        </div>
      )}

      {/* Detail rows */}
      {detailRows.length > 0 && (
        <div className="px-6 pt-8">
          {detailRows.map((row, idx) => (
            <div
              key={row.label}
              className={`flex items-center justify-between py-[18px] ${
                idx < detailRows.length - 1 ? "border-b border-neutral-100" : ""
              }`}
            >
              <span
                className="text-[15px] font-medium text-neutral-900 tracking-[-0.01em]"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {row.label}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="text-[13px] text-neutral-400 tracking-[-0.01em]"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {row.value}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-neutral-300" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventDetail;
