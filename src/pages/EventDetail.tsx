import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Calendar,
  Clock,
  MapPin,
  Tag,
  RotateCcw,
  Share2,
  ArrowLeft,
  Heart,
  ExternalLink,
  Mail,
  Phone,
  Globe,
  Banknote,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const pressStyle = { transition: "transform 0.12s ease" };
const pressHandlers = {
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(0.97)"; },
  onPointerUp: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(1)"; },
  onPointerLeave: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(1)"; },
};

const BackBtn = ({ navigate }: { navigate: ReturnType<typeof useNavigate> }) => (
  <div style={{ paddingTop: 16, paddingLeft: 24, paddingRight: 24, marginBottom: 16 }}>
    <button
      onClick={() => navigate(-1)}
      className="flex items-center"
      style={{ gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0 }}
    >
      <ArrowLeft size={20} strokeWidth={1.8} style={{ color: "#2B2420" }} />
      <span style={{ fontSize: 15, fontWeight: 500, color: "#2B2420" }}>Back</span>
    </button>
  </div>
);

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
      if (!user) { toast.error("Please sign in to save events"); return; }
      if (isFavourited) {
        await supabase.from("favourites" as any).delete().eq("user_id", user.id).eq("item_id", id!).eq("item_type", "event");
      } else {
        await supabase.from("favourites" as any).insert({ user_id: user.id, item_id: id!, item_type: "event" });
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
      const { data, error } = await supabase.from("events").select("*").eq("id", id!).single();
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
      return date.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    } catch { return dateStr; }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: event?.title, url: shareUrl }); }
      catch (err) { if ((err as Error).name !== "AbortError") { await navigator.clipboard.writeText(shareUrl); toast.success("Link copied!"); } }
    } else { await navigator.clipboard.writeText(shareUrl); toast.success("Link copied!"); }
  };

  const pageStyle = { background: "#EBEBEB", paddingBottom: 84, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" };

  if (isLoading) {
    return (
      <div className="min-h-screen" style={pageStyle}>
        <BackBtn navigate={navigate} />
        <div className="flex flex-col items-center justify-center" style={{ paddingTop: 80, paddingLeft: 24, paddingRight: 24 }}>
          <div className="animate-pulse" style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(18,18,20,0.06)", marginBottom: 14 }} />
          <p style={{ fontSize: 14, color: "rgba(18,18,20,0.55)" }}>Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen" style={pageStyle}>
        <BackBtn navigate={navigate} />
        <div style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 80, textAlign: "center" }}>
          <p style={{ fontWeight: 400, fontSize: 22, color: "#020202", marginBottom: 8 }}>Event not found</p>
          <p style={{ fontSize: 14, color: "rgba(18,18,20,0.55)", lineHeight: 1.5 }}>This event may have been removed or is no longer available.</p>
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
  ].filter((row) => row.value);

  const contactRows = [
    contactEmail ? { label: "Email", value: contactEmail, icon: Mail, href: `mailto:${contactEmail}` } : null,
    contactPhone ? { label: "Phone", value: contactPhone, icon: Phone, href: `tel:${contactPhone.replace(/\s/g, "")}` } : null,
    socialLink ? { label: "Social Media", value: "View Profile", icon: Globe, href: socialLink } : null,
    bookingLink ? { label: "Booking", value: "Book Now", icon: ExternalLink, href: bookingLink } : null,
  ].filter(Boolean) as { label: string; value: string; icon: any; href: string }[];

  const SectionLabel = ({ eyebrow, title }: { eyebrow: string; title: string }) => (
    <div style={{ marginBottom: 12 }}>
      <p style={{ fontSize: 12, fontWeight: 500, color: "rgba(18,18,20,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", lineHeight: 1.3, marginBottom: 4, margin: 0 }}>
        {eyebrow}
      </p>
      <h2 style={{ fontWeight: 400, fontSize: 26, lineHeight: 1.15, letterSpacing: "0.01em", color: "#020202", textTransform: "uppercase", margin: 0 }}>
        {title}
      </h2>
    </div>
  );

  const renderDetailCard = (rows: typeof detailRows, isContact = false) => (
    <div style={{ background: "#FFFFFF", border: "1px solid rgba(18,18,20,0.06)", borderRadius: 16, padding: "4px 0", overflow: "hidden" }}>
      {rows.map((row, idx) => {
        const Wrapper = row.href ? "a" : "div";
        const wrapperProps = row.href ? { href: row.href, target: "_blank" as const, rel: "noopener noreferrer" } : {};
        return (
          <div key={row.label}>
            <Wrapper
              {...wrapperProps}
              className="flex items-center"
              style={{ padding: "14px 20px", textDecoration: "none" }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: "50%", background: "rgba(18,18,20,0.06)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 16,
              }}>
                <row.icon size={24} strokeWidth={1.8} style={{ color: "rgba(18,18,20,0.3)" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: "rgba(18,18,20,0.4)", letterSpacing: "0.02em", margin: 0, marginBottom: 2 }}>
                  {row.label}
                </p>
                <p style={{ fontSize: 16, fontWeight: 500, color: "#2B2420", lineHeight: 1.3, margin: 0, wordBreak: "break-word" }}>
                  {row.value}
                </p>
              </div>
            </Wrapper>
            {idx < rows.length - 1 && (
              <div style={{ marginLeft: 60, height: 1, background: "rgba(18,18,20,0.08)" }} />
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen" style={pageStyle}>
      <BackBtn navigate={navigate} />

      {/* Hero Image */}
      {event.image_url && (
        <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 16 }}>
          <div style={{ width: "100%", overflow: "hidden", borderRadius: 16, background: "#f0f0f0", aspectRatio: "16/10" }}>
            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover object-center" />
          </div>
        </div>
      )}

      {/* Category overline */}
      {event.tag && (
        <p style={{ fontSize: 12, fontWeight: 500, color: "rgba(18,18,20,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", lineHeight: 1.3, marginBottom: 4, paddingLeft: 24, margin: 0, marginBlockEnd: 4 }}>
          {event.tag}
        </p>
      )}

      {/* Title */}
      <h1 style={{
        fontWeight: 400, fontSize: 34, lineHeight: 1.1, letterSpacing: "0.01em",
        color: "#020202", textTransform: "uppercase", margin: 0, marginBottom: 4,
        paddingLeft: 24, paddingRight: 24,
      }}>
        {event.title}
      </h1>

      {/* Date line */}
      {(event.date || timeDisplay) && (
        <p style={{
          fontSize: 15, fontWeight: 400, color: "rgba(18,18,20,0.55)", fontStyle: "italic",
          paddingLeft: 24, margin: 0, marginBottom: 32,
        }}>
          {formatDate(event.date)}{timeDisplay ? ` · ${timeDisplay}` : ""}
        </p>
      )}

      {/* About */}
      {event.description && (
        <section style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 32 }}>
          <SectionLabel eyebrow="Overview" title="About" />
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(18,18,20,0.06)", borderRadius: 16, padding: 20 }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 400, color: "#2B2420", lineHeight: 1.45 }}>
              {event.description}
            </p>
          </div>
        </section>
      )}

      {/* Details */}
      {detailRows.length > 0 && (
        <section style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 24 }}>
          <SectionLabel eyebrow="Event info" title="Details" />
          {renderDetailCard(detailRows)}
        </section>
      )}

      {/* Contact */}
      {contactRows.length > 0 && (
        <section style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 24 }}>
          <SectionLabel eyebrow="Reach out" title="Contact" />
          {renderDetailCard(contactRows, true)}
        </section>
      )}

      {/* Gallery */}
      {galleryImages.length > 0 && (
        <section style={{ marginBottom: 36 }}>
          <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 12 }}>
            <SectionLabel eyebrow="Moments" title="Gallery" />
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="inline-flex" style={{ gap: 12, paddingLeft: 24, paddingRight: 24, paddingBottom: 4 }}>
              {galleryImages.map((url, i) => (
                <div key={i} style={{ width: 220, aspectRatio: "4/3", borderRadius: 16, overflow: "hidden", background: "#f0f0f0", flexShrink: 0 }}>
                  <img src={url} alt={`${event.title} ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Action buttons */}
      <div className="flex" style={{ gap: 12, paddingLeft: 24, paddingRight: 24, marginBottom: 36 }}>
        <button
          onClick={handleShare}
          className="flex items-center justify-center"
          style={{
            flex: 1, gap: 8, minHeight: 48, borderRadius: 24,
            background: "transparent", border: "1.5px solid rgba(18,18,20,0.15)",
            fontSize: 15, fontWeight: 500, color: "#2B2420", cursor: "pointer",
            ...pressStyle,
          }}
          {...pressHandlers}
        >
          <Share2 size={20} strokeWidth={1.8} style={{ color: "#2B2420" }} />
          Share
        </button>

        <button
          onClick={() => toggleFavourite.mutate()}
          className="flex items-center justify-center"
          style={{
            flex: 1, gap: 8, minHeight: 48, borderRadius: 24,
            background: "transparent",
            border: isFavourited ? "1.5px solid #D4654A" : "1.5px solid rgba(18,18,20,0.15)",
            fontSize: 15, fontWeight: 500, color: "#2B2420", cursor: "pointer",
            ...pressStyle,
          }}
          {...pressHandlers}
        >
          <Heart
            size={20}
            strokeWidth={1.8}
            style={{ color: isFavourited ? "#D4654A" : "#2B2420" }}
            fill={isFavourited ? "#D4654A" : "none"}
          />
          Interested
        </button>
      </div>
    </div>
  );
};

export default EventDetail;
