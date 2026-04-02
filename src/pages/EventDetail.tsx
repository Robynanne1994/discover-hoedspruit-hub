import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, MapPin, Tag, RotateCcw, Share2, ChevronLeft, Heart, ExternalLink, Mail, Phone, Globe, Banknote } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: isFavourited } = useQuery({
    queryKey: ["favourite", "event", id, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("favourites" as any)
        .select("id")
        .eq("user_id", user.id)
        .eq("item_id", id!)
        .eq("item_type", "event")
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!id,
  });

  const toggleFavourite = useMutation({
    mutationFn: async () => {
      if (!user) {
        toast.error("Please sign in to save events");
        return;
      }
      if (isFavourited) {
        await supabase
          .from("favourites" as any)
          .delete()
          .eq("user_id", user.id)
          .eq("item_id", id!)
          .eq("item_type", "event");
      } else {
        await supabase
          .from("favourites" as any)
          .insert({ user_id: user.id, item_id: id!, item_type: "event" });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favourite", "event", id] });
      queryClient.invalidateQueries({ queryKey: ["favourites"] });
      toast.success(isFavourited ? "Removed from saved" : "Event saved!");
    },
  });

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

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-ZA", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: event?.title, url: shareUrl });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          await navigator.clipboard.writeText(shareUrl);
          toast.success("Link copied!");
        }
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20 bg-background">
        <div className="px-5 pt-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-primary hover:text-foreground text-[13px] font-medium transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        </div>
        <div className="px-5 pt-12 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
          <p className="text-muted-foreground text-[13px]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen pb-20 bg-background">
        <div className="px-5 pt-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-primary hover:text-foreground text-[13px] font-medium transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        </div>
        <div className="px-5 pt-20 text-center">
          <p className="text-muted-foreground text-[14px]">Event not found.</p>
        </div>
      </div>
    );
  }

  const timeDisplay = event.start_time
    ? `${formatTime(event.start_time)}${event.end_time ? ` – ${formatTime(event.end_time)}` : ""}`
    : null;

  const mapsLink = (event as any).google_maps_link || null;
  const socialLink = (event as any).social_media_link || null;
  const contactEmail = (event as any).contact_email || null;
  const contactPhone = (event as any).contact_phone || null;
  const galleryImages: string[] = (event as any).gallery_images ?? [];
  const bookingLink = (event as any).booking_link || null;
  const price = (event as any).price || null;

  const detailRows = [
    { label: "Date", value: formatDate(event.date), icon: Calendar, href: null as string | null },
    { label: "Time", value: timeDisplay, icon: Clock, href: null as string | null },
    { label: "Venue", value: event.location, icon: MapPin, href: mapsLink },
    { label: "Category", value: event.tag, icon: Tag, href: null as string | null },
    { label: "Recurrence", value: event.recurrence, icon: RotateCcw, href: null as string | null },
    { label: "Price", value: price, icon: Banknote, href: null as string | null },
  ].filter((r) => r.value);

  const contactRows = [
    contactEmail ? { label: "Email", value: contactEmail, icon: Mail, href: `mailto:${contactEmail}` } : null,
    contactPhone ? { label: "Phone", value: contactPhone, icon: Phone, href: `tel:${contactPhone.replace(/\s/g, "")}` } : null,
    socialLink ? { label: "Social Media", value: "View Profile", icon: Globe, href: socialLink } : null,
    bookingLink ? { label: "Booking", value: "Book Now", icon: ExternalLink, href: bookingLink } : null,
  ].filter(Boolean) as { label: string; value: string; icon: any; href: string }[];

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Back button */}
      <div className="px-5 pt-6 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-primary hover:text-foreground text-[13px] font-medium transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
      </div>

      {/* Event image */}
      {event.image_url && (
        <div className="px-5 pb-6">
          <div className="rounded-xl overflow-hidden aspect-[4/3]">
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Title */}
      <div className="px-5 pb-2">
        <h1
          className="text-[22px] font-semibold text-foreground leading-[1.2] tracking-[-0.01em]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {event.title}
        </h1>
      </div>

      {/* About this event */}
      {event.description && (
        <div className="px-5 pt-5 pb-1">
          <div className="bg-card border border-border/40 rounded-xl px-4 py-4">
            <h2 className="text-[13px] font-semibold text-foreground mb-2 leading-tight" style={{ fontFamily: "var(--font-body)" }}>
              About this event
            </h2>
            <p className="text-[12.5px] text-muted-foreground leading-[1.75]" style={{ fontFamily: "var(--font-body)" }}>
              {event.description}
            </p>
          </div>
        </div>
      )}

      {/* Event details */}
      {detailRows.length > 0 && (
        <div className="px-5 pt-4 pb-1">
          <div className="bg-card border border-border/40 rounded-xl overflow-hidden">
            {detailRows.map((row, idx) => {
              const Wrapper = row.href ? "a" : "div";
              const wrapperProps = row.href ? { href: row.href, target: "_blank", rel: "noopener noreferrer" } : {};
              return (
                <Wrapper
                  key={row.label}
                  {...wrapperProps}
                  className={`flex items-center gap-3.5 px-4 py-3.5 ${
                    idx < detailRows.length - 1 ? "border-b border-border/20" : ""
                  } ${row.href ? "cursor-pointer hover:bg-muted/30 transition-colors" : ""}`}
                >
                  <row.icon className="h-[15px] w-[15px] text-primary/70 shrink-0" strokeWidth={1.5} />
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] text-muted-foreground block leading-tight" style={{ fontFamily: "var(--font-body)" }}>
                      {row.label}
                    </span>
                    <span className={`text-[13px] font-medium leading-tight ${row.href ? "text-primary" : "text-foreground"}`} style={{ fontFamily: "var(--font-body)" }}>
                      {row.value}
                    </span>
                  </div>
                </Wrapper>
              );
            })}
          </div>
        </div>
      )}

      {/* Contact info */}
      {contactRows.length > 0 && (
        <div className="px-5 pt-4 pb-1">
          <div className="bg-card border border-border/40 rounded-xl overflow-hidden">
            {contactRows.map((row, idx) => (
              <a
                key={row.label}
                href={row.href}
                target={row.label === "Social Media" ? "_blank" : undefined}
                rel={row.label === "Social Media" ? "noopener noreferrer" : undefined}
                className={`flex items-center gap-3.5 px-4 py-3.5 cursor-pointer hover:bg-muted/30 transition-colors ${
                  idx < contactRows.length - 1 ? "border-b border-border/20" : ""
                }`}
              >
                <row.icon className="h-[15px] w-[15px] text-primary/70 shrink-0" strokeWidth={1.5} />
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] text-muted-foreground block leading-tight" style={{ fontFamily: "var(--font-body)" }}>
                    {row.label}
                  </span>
                  <span className="text-[13px] font-medium leading-tight text-primary" style={{ fontFamily: "var(--font-body)" }}>
                    {row.value}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Gallery */}
      {galleryImages.length > 0 && (
        <div className="px-5 pt-5 pb-1">
          <h2 className="text-[13px] font-semibold text-foreground mb-3 leading-tight" style={{ fontFamily: "var(--font-body)" }}>
            Gallery
          </h2>
          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
            {galleryImages.map((url, i) => (
              <div key={i} className="flex-shrink-0 w-[65%] aspect-[4/3] rounded-xl overflow-hidden">
                <img src={url} alt={`${event.title} ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-5 pt-5 pb-2 flex gap-3">
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 bg-card border border-border/40 rounded-xl py-3 text-[13px] font-medium text-foreground hover:bg-muted/50 transition-colors"
          style={{ fontFamily: "var(--font-body)" }}
        >
          <Share2 className="h-[14px] w-[14px] text-primary/70" strokeWidth={1.5} />
          Share
        </button>
        <button
          onClick={() => toggleFavourite.mutate()}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-medium transition-colors ${
            isFavourited
              ? "bg-primary/10 border border-primary/30 text-primary"
              : "bg-card border border-border/40 text-foreground hover:bg-muted/50"
          }`}
          style={{ fontFamily: "var(--font-body)" }}
        >
          <Heart className={`h-[14px] w-[14px] ${isFavourited ? "fill-primary text-primary" : "text-primary/70"}`} strokeWidth={1.5} />
          {isFavourited ? "Interested" : "Interested"}
        </button>
      </div>
    </div>
  );
};

export default EventDetail;
