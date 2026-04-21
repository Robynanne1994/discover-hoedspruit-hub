import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ImageLightbox from "@/components/ImageLightbox";
import EventEditDialog from "@/components/admin/EventEditDialog";
import {
  Calendar,
  Clock,
  MapPin,
  Tag,
  RotateCcw,
  Share2,
  ArrowLeft,
  ArrowUpRight,
  Heart,
  ExternalLink,
  Mail,
  Phone,
  Globe,
  Banknote,
  Pencil,
  StickyNote,
  ChevronDown,
  MessageCircle,
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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const { user, isAdmin } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
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
    if (!dateStr) return "";
    // Strip HTML tags
    const clean = String(dateStr).replace(/<[^>]*>/g, "").trim();
    // Only try to parse strict ISO-style dates (YYYY-MM-DD). Otherwise show raw text.
    if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
      const date = new Date(clean);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      }
    }
    return clean;
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
        <div style={{ padding: "48px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
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
        <div style={{ padding: "80px 20px", textAlign: "center" }}>
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
  const socialLabel = (event as any).social_media_label || null;
  const contactEmail = (event as any).contact_email || null;
  const contactPhone = (event as any).contact_phone || null;
  const contactWhatsapp = (event as any).contact_whatsapp || null;
  const waClean = contactWhatsapp ? contactWhatsapp.replace(/[^0-9]/g, "") : null;
  const galleryImages: string[] = (event as any).gallery_images ?? [];
  const bookingLink = (event as any).booking_link || null;
  const price = (event as any).price || null;
  const notes = (event as any).notes || null;
  const subTag1 = (event as any).sub_tag_1 || null;
  const subTag2 = (event as any).sub_tag_2 || null;
  const tagParts = [event.tag, subTag1, subTag2].filter((t) => t && String(t).trim() !== "");

  const detailRows = [
    { label: "Date", value: formatDate(event.date), icon: Calendar, href: null as string | null },
    { label: "Time", value: timeDisplay, icon: Clock, href: null as string | null },
    { label: "Venue", value: event.location, icon: MapPin, href: mapsLink },
    { label: "Recurrence", value: event.recurrence && event.recurrence.trim().toLowerCase() !== "none" ? event.recurrence : null, icon: RotateCcw, href: null as string | null },
    { label: "Price", value: price, icon: Banknote, href: null as string | null },
  ].filter((row) => row.value);

  const contactRows = [
    contactEmail ? { label: "Email", value: contactEmail, icon: Mail, href: `mailto:${contactEmail}` } : null,
    contactPhone ? { label: "Phone", value: contactPhone, icon: Phone, href: `tel:${contactPhone.replace(/\s/g, "")}` } : null,
    waClean ? { label: "WhatsApp", value: contactWhatsapp, icon: MessageCircle, href: `https://wa.me/${waClean}` } : null,
    socialLink ? { label: "Social Media", value: socialLabel || "Social Media Profile", icon: Globe, href: socialLink } : null,
    bookingLink ? { label: "Booking", value: "Booking Link", icon: ExternalLink, href: bookingLink } : null,
  ].filter(Boolean) as { label: string; value: string; icon: any; href: string }[];

  const SectionLabel = ({ title }: { eyebrow?: string; title: string }) => (
    <div style={{ marginBottom: 12 }}>
      <h2 style={{ fontWeight: 400, fontSize: 28, lineHeight: 1.15, letterSpacing: "-0.01em", color: "#020202", textTransform: "none", margin: 0, fontFamily: "'Helvetica World', Helvetica, Arial, sans-serif" }}>
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
                <p style={{ fontSize: 14, fontWeight: 400, color: "#2B2420", lineHeight: 1.3, margin: 0, wordBreak: "break-word", fontFamily: font }}>
                  {row.value}
                </p>
              </div>
              {row.href && (
                <ArrowUpRight size={18} strokeWidth={1.8} color="#2B2420" style={{ flexShrink: 0, marginLeft: 12 }} />
              )}
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
          {(() => {
            const rightIcons: { key: string; onClick: () => void; ariaLabel: string; node: React.ReactNode }[] = [];
            if (isAdmin) {
              rightIcons.push({
                key: "edit",
                onClick: () => setEditOpen(true),
                ariaLabel: "Edit event",
                node: <Pencil size={18} strokeWidth={1.8} color="#2B2420" />,
              });
            }
            rightIcons.push({
              key: "share",
              onClick: handleShare,
              ariaLabel: "Share",
              node: <Share2 size={18} strokeWidth={1.8} color="#2B2420" />,
            });
            rightIcons.push({
              key: "fav",
              onClick: () => { if (!requireAuth()) toggleFavourite.mutate(); },
              ariaLabel: isFavourited ? "Unsave" : "Save",
              node: <Heart size={18} strokeWidth={1.8} color="#2B2420" fill={isFavourited ? "#2B2420" : "none"} />,
            });
            return rightIcons.map((b, idx) => {
              const rightOffset = 16 + (rightIcons.length - 1 - idx) * (40 + 8);
              return (
                <button
                  key={b.key}
                  onClick={b.onClick}
                  aria-label={b.ariaLabel}
                  style={{ ...overlayBtn, position: "absolute", top: 16, right: rightOffset, zIndex: 10 }}
                  {...pressScale("0.9")}
                >
                  {b.node}
                </button>
              );
            });
          })()}
        </div>
      ) : (
        <div style={{ padding: "48px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => navigate(-1)} style={{ ...overlayBtn, background: "rgba(18,18,20,0.06)" }} {...pressScale("0.9")}>
            <ArrowLeft size={20} strokeWidth={1.8} color="#2B2420" />
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            {isAdmin && (
              <button
                onClick={() => setEditOpen(true)}
                aria-label="Edit event"
                style={{ ...overlayBtn, background: "rgba(18,18,20,0.06)" }}
                {...pressScale("0.9")}
              >
                <Pencil size={18} strokeWidth={1.8} color="#2B2420" />
              </button>
            )}
            <button
              onClick={handleShare}
              aria-label="Share"
              style={{ ...overlayBtn, background: "rgba(18,18,20,0.06)" }}
              {...pressScale("0.9")}
            >
              <Share2 size={18} strokeWidth={1.8} color="#2B2420" />
            </button>
            <button
              onClick={() => { if (!requireAuth()) toggleFavourite.mutate(); }}
              aria-label={isFavourited ? "Unsave" : "Save"}
              style={{ ...overlayBtn, background: "rgba(18,18,20,0.06)" }}
              {...pressScale("0.9")}
            >
              <Heart size={18} strokeWidth={1.8} color="#2B2420" fill={isFavourited ? "#2B2420" : "none"} />
            </button>
          </div>
        </div>
      )}

      {/* Content area */}
      <div style={{ paddingTop: 20, paddingLeft: 24, paddingRight: 24 }}>
        {/* Category overline */}
        {tagParts.length > 0 && (
          <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(18,18,20,0.4)", lineHeight: 1.3, marginBottom: 4, marginTop: 0, fontFamily: font }}>
            {tagParts.join(" | ")}
          </p>
        )}

        {/* Title */}
        <h1 style={{ fontFamily: "'Helvetica World', Helvetica, Arial, sans-serif", fontSize: 35, fontWeight: 400, lineHeight: 1, letterSpacing: "-0.01em", color: "#020202", textTransform: "none", marginBottom: 8, marginTop: 0 }}>
          {event.title}
        </h1>

        {/* Date line */}
        {(event.date || timeDisplay) && (
          <p style={{ fontSize: 15, fontWeight: 400, color: "rgba(18,18,20,0.55)", fontStyle: "italic", margin: 0, marginBottom: 16, fontFamily: font }}>
            {formatDate(event.date)}{timeDisplay ? ` · ${timeDisplay}` : ""}
          </p>
        )}



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
                padding: "12px 20px", height: 48, fontSize: 15, fontWeight: 600,
                textDecoration: "none", cursor: "pointer", transition: "transform 0.12s ease, opacity 0.12s ease",
                fontFamily: font, textTransform: "capitalize",
              }}
              onPointerDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.97)"; (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
              onPointerUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; (e.currentTarget as HTMLElement).style.opacity = "1"; }}
              onPointerLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            >
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
        {(detailRows.length > 0 || notes) && (
          <section style={{ marginBottom: 24 }}>
            <SectionLabel eyebrow="Event info" title="Details" />
            <div style={{ background: "#FFFFFF", border: "1px solid rgba(18,18,20,0.06)", borderRadius: 16, padding: "4px 0", overflow: "hidden" }}>
              {detailRows.map((row, idx) => {
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
                        <p style={{ fontSize: 14, fontWeight: 400, color: "#2B2420", lineHeight: 1.3, margin: 0, wordBreak: "break-word", fontFamily: font }}>
                          {row.value}
                        </p>
                      </div>
                    </Wrapper>
                  </div>
                );
              })}
              {notes && (
                <div>
                  {detailRows.length > 0 && <div style={{ height: 1, background: "rgba(18,18,20,0.08)", marginLeft: 56 }} />}
                  <button
                    onClick={() => setNotesOpen((v) => !v)}
                    aria-expanded={notesOpen}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      padding: "14px 20px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div style={{ marginRight: 16, flexShrink: 0 }}>
                      <StickyNote size={20} strokeWidth={1.8} style={{ color: "rgba(18,18,20,0.3)" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 400, color: "#2B2420", lineHeight: 1.3, margin: 0, fontFamily: font }}>
                        Notes
                      </p>
                    </div>
                    <ChevronDown
                      size={20}
                      strokeWidth={1.8}
                      style={{
                        color: "rgba(18,18,20,0.5)",
                        transform: notesOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 200ms ease-out",
                        flexShrink: 0,
                      }}
                    />
                  </button>
                  {notesOpen && (
                    <div style={{ padding: "0 20px 16px 56px" }}>
                      <p style={{ fontSize: 14, fontWeight: 400, color: "#2B2420", lineHeight: 1.5, margin: 0, whiteSpace: "pre-wrap", fontFamily: font }}>
                        {notes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}



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
          <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 12 }}>
            <SectionLabel eyebrow="Moments" title="Gallery" />
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="inline-flex" style={{ gap: 12, paddingLeft: 24, paddingRight: 24, paddingBottom: 4 }}>
              {galleryImages.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
                  style={{ width: 220, aspectRatio: "4/3", borderRadius: 16, overflow: "hidden", background: "#f0f0f0", flexShrink: 0, border: "none", padding: 0, cursor: "pointer" }}
                  aria-label={`Open image ${i + 1}`}
                >
                  <img src={url} alt={`${event.title} ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <ImageLightbox
        images={galleryImages}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        alt={event.title}
      />

      <BottomNav />
      {isAdmin && event && (
        <EventEditDialog open={editOpen} onOpenChange={setEditOpen} event={event} />
      )}
    </div>
  );
};

export default EventDetail;
