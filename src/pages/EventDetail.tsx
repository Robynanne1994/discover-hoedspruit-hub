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
import BottomNav from "@/components/BottomNav";

const font = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const pressScale = (scale = "0.97") => ({
  onPointerDown: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = `scale(${scale})`),
  onPointerUp: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
  onPointerLeave: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
});

const overlayBtn: React.CSSProperties = {
  width: 40, height: 40, borderRadius: "50%",
  background: "rgba(255, 255, 255, 0.85)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  display: "flex", alignItems: "center", justifyContent: "center",
  border: "none", cursor: "pointer",
  transition: "transform 0.12s ease",
};

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

  const requireAuth = () => {
    if (!user) { toast.info("Sign in to use this feature"); navigate("/auth"); return true; }
    return false;
  };

  const toggleFavourite = useMutation({
    mutationFn: async () => {
      if (!user) return;
      if (isFavourited) {
        await supabase.from("favourites" as any).delete().eq("user_id", user.id).eq("item_id", id!).eq("item_type", "event");
      } else {
        await supabase.from("favourites" as any).insert({ user_id: user.id, item_id: id!, item_type: "event" });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favourite", "event", id] });
      queryClient.invalidateQueries({ queryKey: ["favourites"] });
      toast.success(isFavourited ? "Removed from saved" : "Saved!");
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

  const pageStyle: React.CSSProperties = { minHeight: "100vh", background: "#EBEBEB", paddingBottom: 84, fontFamily: font };

  if (isLoading) {
    return (
      <div style={pageStyle}>
        <div style={{ padding: "52px 24px 0" }}>
          <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer" }}>
            <ArrowLeft size={20} strokeWidth={1.8} style={{ color: "#2B2420" }} />
            <span style={{ fontSize: 15, fontWeight: 500, color: "#2B2420", fontFamily: font }}>Back</span>
          </button>
        </div>
        <div style={{ padding: "48px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(18,18,20,0.04)", animation: "pulse 2s infinite" }} />
          <p style={{ fontSize: 13, color: "rgba(18,18,20,0.35)", fontFamily: font }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={pageStyle}>
        <div style={{ padding: "52px 24px 0" }}>
          <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer" }}>
            <ArrowLeft size={20} strokeWidth={1.8} style={{ color: "#2B2420" }} />
            <span style={{ fontSize: 15, fontWeight: 500, color: "#2B2420", fontFamily: font }}>Back</span>
          </button>
        </div>
        <div style={{ padding: "80px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "rgba(18,18,20,0.4)", fontFamily: font }}>Event not found.</p>
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

  const SectionLabel = ({ title }: { eyebrow?: string; title: string }) => (
    <div style={{ marginBottom: 12 }}>
      <h2 style={{ fontWeight: 400, fontSize: 28, lineHeight: 1.15, letterSpacing: "-0.01em", color: "#020202", textTransform: "capitalize", margin: 0, fontFamily: "'Helvetica World', Helvetica, Arial, sans-serif" }}>
        {title}
      </h2>
    </div>
  );

  const renderDetailCard = (rows: typeof detailRows) => (
    <div style={{ background: "#FFFFFF", border: "1px solid rgba(18,18,20,0.06)", borderRadius: 16, padding: "4px 0", overflow: "hidden" }}>
      {rows.map((row, idx) => {
        const Wrapper = row.href ? "a" : "div";
        const wrapperProps = row.href ? { href: row.href, target: "_blank" as const, rel: "noopener noreferrer" } : {};
        return (
          <div key={row.label}>
            {idx > 0 && <div style={{ height: 1, background: "rgba(18,18,20,0.08)", marginLeft: 56 }} />}
            <Wrapper
              {...wrapperProps}
              style={{ display: "flex", alignItems: "center", padding: "14px 20px", textDecoration: "none" }}
            >
              <div style={{ marginRight: 16, flexShrink: 0 }}>
                <row.icon size={20} strokeWidth={1.8} style={{ color: "rgba(18,18,20,0.3)" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: "rgba(18,18,20,0.4)", letterSpacing: "0.02em", margin: 0, marginBottom: 2, fontFamily: font }}>
                  {row.label}
                </p>
                <p style={{ fontSize: 16, fontWeight: 500, color: "#2B2420", lineHeight: 1.3, margin: 0, wordBreak: "break-word", fontFamily: font }}>
                  {row.value}
                </p>
              </div>
            </Wrapper>
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={pageStyle}>
      {/* Hero image with overlay back button */}
      {event.image_url ? (
        <div style={{ position: "relative" }}>
          <div style={{ width: "100%", aspectRatio: "4/3", overflow: "hidden", borderRadius: 16 }}>
            <img src={event.image_url} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
          </div>
          <button onClick={() => navigate(-1)} style={{ ...overlayBtn, position: "absolute", top: 16, left: 16, zIndex: 10 }} {...pressScale("0.9")}>
            <ArrowLeft size={20} strokeWidth={1.8} color="#2B2420" />
          </button>
        </div>
      ) : (
        <div style={{ padding: "48px 24px 0" }}>
          <button onClick={() => navigate(-1)} style={{ ...overlayBtn, background: "rgba(18,18,20,0.06)" }} {...pressScale("0.9")}>
            <ArrowLeft size={20} strokeWidth={1.8} color="#2B2420" />
          </button>
        </div>
      )}

      {/* Content area */}
      <div style={{ paddingTop: 20, paddingLeft: 20, paddingRight: 20 }}>
        {/* Category overline */}
        {event.tag && (
          <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(18,18,20,0.4)", lineHeight: 1.3, marginBottom: 4, marginTop: 0, fontFamily: font }}>
            {event.tag}
          </p>
        )}

        {/* Title */}
        <h1 style={{ fontFamily: "'Helvetica World', Helvetica, Arial, sans-serif", fontSize: 35, fontWeight: 400, lineHeight: 1, letterSpacing: "-0.01em", color: "#020202", textTransform: "capitalize", marginBottom: 8, marginTop: 0 }}>
          {event.title}
        </h1>

        {/* Date line */}
        {(event.date || timeDisplay) && (
          <p style={{ fontSize: 15, fontWeight: 400, color: "rgba(18,18,20,0.55)", fontStyle: "italic", margin: 0, marginBottom: 16, fontFamily: font }}>
            {formatDate(event.date)}{timeDisplay ? ` · ${timeDisplay}` : ""}
          </p>
        )}

        {/* Action buttons (Share, Interested) */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <button
            onClick={handleShare}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              background: "#020202", border: "none", borderRadius: 16,
              padding: "12px 24px", height: 48, cursor: "pointer", transition: "transform 0.12s ease",
              fontFamily: "'Helvetica World', Helvetica, Arial, sans-serif",
            }}
            {...pressScale()}
          >
            <Share2 size={14} strokeWidth={1.8} color="#ffffff" />
            <span style={{ fontSize: 15, fontWeight: 600, color: "#ffffff", fontFamily: "'Helvetica World', Helvetica, Arial, sans-serif" }}>Share</span>
          </button>
          <button
            onClick={() => { if (!requireAuth()) toggleFavourite.mutate(); }}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              background: "#020202", border: "none", borderRadius: 16,
              padding: "12px 24px", height: 48, cursor: "pointer", transition: "transform 0.12s ease",
              fontFamily: "'Helvetica World', Helvetica, Arial, sans-serif",
            }}
            {...pressScale()}
          >
            <Heart size={14} strokeWidth={1.8} color="#ffffff" fill={isFavourited ? "#ffffff" : "none"} />
            <span style={{ fontSize: 15, fontWeight: 600, color: "#ffffff", fontFamily: "'Helvetica World', Helvetica, Arial, sans-serif" }}>Interested</span>
          </button>
        </div>

        {/* Book Now CTA */}
        {bookingLink && (
          <div style={{ marginBottom: 20 }}>
            <a
              href={bookingLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                background: "#020202", color: "#FFFFFF", border: "none", borderRadius: 16,
                padding: "12px 24px", height: 48, fontSize: 15, fontWeight: 600,
                textDecoration: "none", cursor: "pointer", transition: "transform 0.12s ease, opacity 0.12s ease",
                fontFamily: font, textTransform: "capitalize",
              }}
              onPointerDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.97)"; (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
              onPointerUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; (e.currentTarget as HTMLElement).style.opacity = "1"; }}
              onPointerLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            >
              <ExternalLink size={20} strokeWidth={1.8} color="#FFFFFF" />
              Book Now
            </a>
          </div>
        )}

        {/* About */}
        {event.description && (
          <section style={{ marginBottom: 24 }}>
            <SectionLabel eyebrow="Overview" title="About" />
            <p style={{ margin: 0, fontSize: 14, fontWeight: 400, color: "#737373", lineHeight: 1.45, fontFamily: "'Helvetica World', Helvetica, Arial, sans-serif" }}>
              {event.description}
            </p>
          </section>
        )}

        {/* Details */}
        {detailRows.length > 0 && (
          <section style={{ marginBottom: 24 }}>
            <SectionLabel eyebrow="Event info" title="Details" />
            {renderDetailCard(detailRows)}
          </section>
        )}

        {/* Contact */}
        {contactRows.length > 0 && (
          <section style={{ marginBottom: 24 }}>
            <SectionLabel eyebrow="Reach out" title="Contact" />
            {renderDetailCard(contactRows)}
          </section>
        )}
      </div>

      {/* Gallery (full-bleed scroll) */}
      {galleryImages.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <div style={{ paddingLeft: 20, paddingRight: 20, marginBottom: 12 }}>
            <SectionLabel eyebrow="Moments" title="Gallery" />
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="inline-flex" style={{ gap: 12, paddingLeft: 20, paddingRight: 20, paddingBottom: 4 }}>
              {galleryImages.map((url, i) => (
                <div key={i} style={{ width: 220, aspectRatio: "4/3", borderRadius: 16, overflow: "hidden", background: "#f0f0f0", flexShrink: 0 }}>
                  <img src={url} alt={`${event.title} ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <BottomNav />
    </div>
  );
};

export default EventDetail;
