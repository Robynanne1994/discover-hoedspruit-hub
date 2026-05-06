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
const FONT_HEAD = "'Helvetica World', 'Helvetica Neue', Helvetica, Arial, sans-serif";

const PAGE_BG = "#EBEBEB";
const SURFACE = "#FFFFFF";
const TEXT = "#0A0A0A";
const MUTED = "#8A8480";
const DIVIDER = "#E8E4DF";

const pressScale = (scale = "0.98") => ({
  onPointerDown: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = `scale(${scale})`),
  onPointerUp: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
  onPointerLeave: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
});

const overlayBtn: React.CSSProperties = {
  width: 44, height: 44, borderRadius: 999,
  background: SURFACE,
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  display: "flex", alignItems: "center", justifyContent: "center",
  border: "none", cursor: "pointer",
  transition: "transform 150ms ease-out",
};

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const { user, isAdmin } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(false);
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

  const pageStyle: React.CSSProperties = { minHeight: "100vh", background: "transparent", paddingBottom: 84, fontFamily: font };

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
  const formatWhatsapp = (digits: string) => {
    let local = digits;
    if (local.startsWith("27")) local = "0" + local.slice(2);
    if (local.length === 10) return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
    return local;
  };
  const waDisplay = waClean ? formatWhatsapp(waClean) : null;
  const galleryImages: string[] = (event as any).gallery_images ?? [];
  const bookingLink = (event as any).booking_link || null;
  const bookingLinkLabel = (event as any).booking_link_label?.trim() || null;
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

  const WhatsappIcon = ({ color }: { color: string }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.057 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.889-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.887 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.47 3.488"/>
    </svg>
  );

  const contactRows = [
    contactEmail ? { label: "Email", value: contactEmail, icon: Mail, href: `mailto:${contactEmail}`, isCustomIcon: false } : null,
    contactPhone ? { label: "Phone", value: contactPhone, icon: Phone, href: `tel:${contactPhone.replace(/\s/g, "")}`, isCustomIcon: false } : null,
    waClean ? { label: "Whatsapp", value: waDisplay as string, icon: WhatsappIcon, href: `https://wa.me/${waClean}`, isCustomIcon: true } : null,
    socialLink ? { label: "Social Media", value: socialLabel || "Social Media Profile", icon: Globe, href: socialLink, isCustomIcon: false } : null,
  ].filter(Boolean) as { label: string; value: string; icon: any; href: string; isCustomIcon: boolean }[];

  const SectionLabel = ({ title }: { eyebrow?: string; title: string }) => (
    <h2 style={{
      fontFamily: FONT_HEAD, fontWeight: 500, fontSize: 22, lineHeight: "22px",
      letterSpacing: "-0.66px", color: TEXT, margin: 0, marginTop: 18, marginBottom: 10,
      textTransform: "none",
    }}>
      {title}
    </h2>
  );

  const renderDetailCard = (rows: typeof detailRows) => (
    <div style={{ background: SURFACE, borderRadius: 24, paddingLeft: 20, paddingRight: 20 }}>
      {rows.map((row, idx) => {
        const Wrapper: any = row.href ? "a" : "div";
        const wrapperProps = row.href ? { href: row.href, target: "_blank" as const, rel: "noopener noreferrer" } : {};
        return (
          <div key={row.label} style={{ borderTop: idx > 0 ? `1px solid ${DIVIDER}` : "none" }}>
            <Wrapper
              {...wrapperProps}
              style={{ display: "flex", alignItems: "center", height: 56, textDecoration: "none" }}
            >
              <div style={{ marginRight: 14, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 18 }}>
                <row.icon size={18} strokeWidth={1.5} color="#898480" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontFamily: font, fontSize: 14, fontWeight: 400, color: TEXT,
                  lineHeight: 1.35, margin: 0, wordBreak: "break-word",
                }}>
                  {row.value}
                </p>
              </div>
              {row.href && (
                <ArrowUpRight size={18} strokeWidth={1.5} color="#5b4632" style={{ flexShrink: 0, marginLeft: 12 }} />
              )}
            </Wrapper>
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={pageStyle}>
      {/* Hero image */}
      {event.image_url ? (
        <div style={{ position: "relative", width: "100%", height: 360, overflow: "hidden", borderBottomLeftRadius: 24, borderBottomRightRadius: 24, background: DIVIDER }}>
          <img src={event.image_url} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
          <button
            onClick={() => navigate(-1)}
            style={{ ...overlayBtn, position: "absolute", top: 12, left: 12, zIndex: 10 }}
            aria-label="Back"
            {...pressScale("0.94")}
          >
            <ArrowLeft size={20} strokeWidth={1.5} color={TEXT} />
          </button>
          {(() => {
            const rightIcons: { key: string; onClick: () => void; ariaLabel: string; node: React.ReactNode }[] = [];
            if (isAdmin) {
              rightIcons.push({
                key: "edit",
                onClick: () => setEditOpen(true),
                ariaLabel: "Edit event",
                node: <Pencil size={20} strokeWidth={1.5} color={TEXT} />,
              });
            }
            rightIcons.push({
              key: "share",
              onClick: handleShare,
              ariaLabel: "Share",
              node: <Share2 size={20} strokeWidth={1.5} color={TEXT} />,
            });
            rightIcons.push({
              key: "fav",
              onClick: () => { if (!requireAuth()) toggleFavourite.mutate(); },
              ariaLabel: isFavourited ? "Unsave" : "Save",
              node: <Heart size={20} strokeWidth={1.5} color={isFavourited ? "#5b4632" : TEXT} fill={isFavourited ? "#5b4632" : "none"} />,
            });
            return rightIcons.map((b, idx) => {
              const rightOffset = 12 + (rightIcons.length - 1 - idx) * (44 + 8);
              return (
                <button
                  key={b.key}
                  onClick={b.onClick}
                  aria-label={b.ariaLabel}
                  style={{ ...overlayBtn, position: "absolute", top: 12, right: rightOffset, zIndex: 10 }}
                  {...pressScale("0.94")}
                >
                  {b.node}
                </button>
              );
            });
          })()}
        </div>
      ) : (
        <div style={{ padding: "48px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => navigate(-1)} style={overlayBtn} {...pressScale("0.94")}>
            <ArrowLeft size={20} strokeWidth={1.5} color={TEXT} />
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            {isAdmin && (
              <button onClick={() => setEditOpen(true)} aria-label="Edit event" style={overlayBtn} {...pressScale("0.94")}>
                <Pencil size={20} strokeWidth={1.5} color={TEXT} />
              </button>
            )}
            <button onClick={handleShare} aria-label="Share" style={overlayBtn} {...pressScale("0.94")}>
              <Share2 size={20} strokeWidth={1.5} color={TEXT} />
            </button>
            <button
              onClick={() => { if (!requireAuth()) toggleFavourite.mutate(); }}
              aria-label={isFavourited ? "Unsave" : "Save"}
              style={overlayBtn}
              {...pressScale("0.94")}
            >
              <Heart size={20} strokeWidth={1.5} color={isFavourited ? "#5b4632" : TEXT} fill={isFavourited ? "#5b4632" : "none"} />
            </button>
          </div>
        </div>
      )}

      {/* Content area */}
      <div style={{ paddingTop: 16, paddingLeft: 24, paddingRight: 24 }}>
        {/* Eyebrow */}
        {tagParts.length > 0 && (
          <p style={{
            fontFamily: font, fontWeight: 500, fontSize: 12, lineHeight: "14.4px",
            letterSpacing: "0.18em", color: "#5b4632", margin: 0, marginBottom: 10,
            textTransform: "uppercase", textAlign: "center",
          }}>
            {tagParts.join("  ·  ")}
          </p>
        )}

        {/* Title */}
        <h1 style={{
          fontFamily: FONT_HEAD, fontSize: 32, fontWeight: 500, lineHeight: "34px",
          letterSpacing: "-0.96px", color: TEXT, textTransform: "none",
          marginTop: 0, marginBottom: 8, textAlign: "center",
        }}>
          {event.title}
        </h1>

        {/* Rustic divider */}
        <div
          aria-hidden
          style={{
            marginTop: 18,
            marginBottom: 4,
            height: 10,
            backgroundImage:
              "radial-gradient(circle, #5b4632 1px, transparent 1.4px), linear-gradient(to right, transparent 0, #5b4632 8%, #5b4632 92%, transparent 100%)",
            backgroundRepeat: "repeat-x, no-repeat",
            backgroundSize: "6px 2px, 100% 1px",
            backgroundPosition: "center top, center bottom",
            opacity: 0.7,
          }}
        />

        {/* Stat row: Date · Time · Location */}
        {(() => {
          const stats = [
            { label: "Date", value: event.date ? formatDate(event.date) : null },
            { label: "Time", value: timeDisplay },
            { label: "Location", value: event.location },
          ].filter((s) => s.value);
          if (stats.length === 0) return null;
          const icons: Record<string, any> = { Date: Calendar, Time: Clock, Location: MapPin };
          return (
            <div
              style={{
                display: "flex",
                alignItems: "stretch",
                marginTop: 28,
                marginBottom: 20,
                background: "#F5EFE3",
                border: "1px solid #E5DAC5",
                borderRadius: 18,
                padding: "18px 8px",
              }}
            >
              {stats.map((s, i) => {
                const Icon = icons[s.label];
                return (
                  <div
                    key={s.label}
                    style={{
                      flex: 1,
                      padding: "0 10px",
                      textAlign: "center",
                      borderLeft: i > 0 ? `1px solid #E5DAC5` : "none",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                    }}
                  >
                    {Icon && (
                      <div style={{
                        width: 36, height: 36, borderRadius: 999,
                        background: "#EAE0CC",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Icon size={18} strokeWidth={1.6} color="#5b4632" />
                      </div>
                    )}
                    <p style={{
                      margin: 0, fontFamily: font, fontWeight: 400, fontSize: 11,
                      letterSpacing: "0.08em", textTransform: "uppercase", color: "#8a7a5e",
                    }}>
                      {s.label}
                    </p>
                    <p style={{
                      margin: 0, fontFamily: FONT_HEAD, fontWeight: 500, fontSize: 13,
                      lineHeight: 1.25, color: TEXT, wordBreak: "break-word",
                    }}>
                      {s.value}
                    </p>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Quick action buttons */}
        {(() => {
          const actions: { key: string; label: string; href: string; icon: React.ReactNode }[] = [];
          if (contactPhone) {
            actions.push({
              key: "call",
              label: "Call",
              href: `tel:${contactPhone.replace(/\s/g, "")}`,
              icon: <Phone size={22} strokeWidth={1.6} color="#FFFFFF" />,
            });
          }
          if (mapsLink) {
            actions.push({
              key: "directions",
              label: "Directions",
              href: mapsLink,
              icon: <MapPin size={22} strokeWidth={1.6} color="#FFFFFF" />,
            });
          }
          if (waClean) {
            actions.push({
              key: "whatsapp",
              label: "Whatsapp",
              href: `https://wa.me/${waClean}`,
              icon: <WhatsappIcon color="#FFFFFF" />,
            });
          } else if (contactEmail) {
            actions.push({
              key: "email",
              label: "Email",
              href: `mailto:${contactEmail}`,
              icon: <Mail size={22} strokeWidth={1.6} color="#FFFFFF" />,
            });
          }
          if (actions.length === 0) return null;
          return (
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${actions.length}, 1fr)`, gap: 10, marginBottom: 10 }}>
              {actions.map((a) => (
                <a
                  key={a.key}
                  href={a.href}
                  target={a.href.startsWith("http") ? "_blank" : undefined}
                  rel={a.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                    background: "#2E241C", color: "#FFFFFF", borderRadius: 18,
                    height: 78, textDecoration: "none",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                    transition: "transform 150ms ease-out",
                    fontFamily: font,
                  }}
                  {...pressScale("0.97")}
                >
                  {a.icon}
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#FFFFFF" }}>{a.label}</span>
                </a>
              ))}
            </div>
          );
        })()}

        {/* Book Now CTA */}
        {bookingLink && (
          <div style={{ marginBottom: 20 }}>
            <a
              href={bookingLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                background: "#2E241C", color: "#FFFFFF", border: "none", borderRadius: 999,
                padding: "0 24px", height: 48, fontSize: 15, fontWeight: 400, lineHeight: "18px",
                letterSpacing: 0, textDecoration: "none", cursor: "pointer",
                transition: "transform 150ms ease-out", fontFamily: font, textTransform: "capitalize",
                boxSizing: "border-box",
              }}
              {...pressScale()}
            >
              {bookingLinkLabel || "Book Now"}
            </a>
          </div>
        )}


        {/* About */}
        {event.description && (
          <section style={{ marginBottom: 24 }}>
            <SectionLabel eyebrow="Overview" title="About" />
            <p
              style={{
                margin: 0,
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontWeight: 400,
                fontSize: 14,
                lineHeight: "20.3px",
                letterSpacing: 0,
                color: "#0A0A0A",
                whiteSpace: "pre-line",
                ...(aboutExpanded ? {} : { display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }),
              }}
            >
              {event.description}
            </p>
            {event.description.length > 120 && (
              <button
                onClick={() => setAboutExpanded(!aboutExpanded)}
                style={{
                  marginTop: 6,
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontFamily: font,
                  fontSize: 14,
                  fontWeight: 400,
                  color: TEXT,
                  textDecoration: "underline",
                  textUnderlineOffset: "3px",
                  textTransform: "capitalize",
                }}
              >
                {aboutExpanded ? "Show Less" : "Read More"}
              </button>
            )}
          </section>
        )}

        {/* Details */}
        {(detailRows.length > 0 || notes) && (
          <section style={{ marginBottom: 24 }}>
            <SectionLabel eyebrow="Event info" title="Details" />
            <div style={{ background: SURFACE, borderRadius: 24, paddingLeft: 20, paddingRight: 20 }}>
              {detailRows.map((row, idx) => {
                const Wrapper: any = row.href ? "a" : "div";
                const wrapperProps = row.href ? { href: row.href, target: "_blank" as const, rel: "noopener noreferrer" } : {};
                return (
                  <div key={row.label} style={{ borderTop: idx > 0 ? `1px solid ${DIVIDER}` : "none" }}>
                    <Wrapper
                      {...wrapperProps}
                      style={{ display: "flex", alignItems: "center", height: 56, textDecoration: "none" }}
                    >
                      <div style={{ marginRight: 14, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 18 }}>
                        <row.icon size={18} strokeWidth={1.5} color="#898480" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontFamily: font, fontSize: 14, fontWeight: 400, color: TEXT,
                          lineHeight: 1.35, margin: 0, wordBreak: "break-word",
                        }}>
                          {row.value}
                        </p>
                      </div>
                      {row.href && (
                        <ArrowUpRight size={18} strokeWidth={1.5} color="#5b4632" style={{ flexShrink: 0, marginLeft: 12 }} />
                      )}
                    </Wrapper>
                  </div>
                );
              })}
              {notes && (
                <div style={{ borderTop: detailRows.length > 0 ? `1px solid ${DIVIDER}` : "none" }}>
                  <button
                    onClick={() => setNotesOpen((v) => !v)}
                    aria-expanded={notesOpen}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", height: 56,
                      background: "transparent", border: "none", cursor: "pointer", textAlign: "left", padding: 0,
                    }}
                  >
                    <div style={{ marginRight: 14, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 18 }}>
                      <StickyNote size={18} strokeWidth={1.5} color="#898480" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontFamily: font, fontSize: 14, fontWeight: 400, color: TEXT,
                        lineHeight: 1.35, margin: 0,
                      }}>
                        Notes
                      </p>
                    </div>
                    <ChevronDown size={18} strokeWidth={1.5} color="#5b4632"
                      style={{ flexShrink: 0, marginLeft: 12, transform: notesOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms ease-out" }} />
                  </button>
                  {notesOpen && (
                    <div style={{ padding: "0 0 16px 32px" }}>
                      <p style={{ fontFamily: font, fontWeight: 400, fontSize: 14, lineHeight: "20.3px", color: TEXT, margin: 0, whiteSpace: "pre-wrap" }}>
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
            <div style={{ background: SURFACE, borderRadius: 24, paddingLeft: 20, paddingRight: 20 }}>
              {contactRows.map((row, idx) => {
                const Wrapper: any = row.href ? "a" : "div";
                const wrapperProps = row.href ? { href: row.href, target: "_blank", rel: "noopener noreferrer" } : {};
                return (
                  <div key={row.label} style={{ borderTop: idx > 0 ? `1px solid ${DIVIDER}` : "none" }}>
                    <Wrapper
                      {...wrapperProps}
                      style={{ display: "flex", alignItems: "center", height: 56, textDecoration: "none" }}
                    >
                      <div style={{ marginRight: 14, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 18 }}>
                        {row.isCustomIcon
                          ? <row.icon color="#898480" />
                          : <row.icon size={18} strokeWidth={1.5} color="#898480" />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontFamily: font, fontSize: 14, fontWeight: 400, color: TEXT,
                          lineHeight: 1.35, margin: 0, wordBreak: "break-word",
                        }}>
                          {row.value}
                        </p>
                      </div>
                      {row.href && (
                        <ArrowUpRight size={18} strokeWidth={1.5} color="#5b4632" style={{ flexShrink: 0, marginLeft: 12 }} />
                      )}
                    </Wrapper>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Hosted By */}
        {(() => {
          const e = event as any;
          const hosts = [
            { name: e.hosted_by_name, subtitle: e.hosted_by_subtitle, image: e.hosted_by_image_url },
            { name: e.hosted_by_name_2, subtitle: e.hosted_by_subtitle_2, image: e.hosted_by_image_url_2 },
            { name: e.hosted_by_name_3, subtitle: e.hosted_by_subtitle_3, image: e.hosted_by_image_url_3 },
          ].filter((h) => h.name && String(h.name).trim() !== "");
          if (hosts.length === 0) return null;
          return (
            <section style={{ marginBottom: 24 }}>
              <SectionLabel eyebrow="Host" title="Hosted By" />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {hosts.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      background: SURFACE, borderRadius: 24, padding: "16px 20px",
                      display: "flex", alignItems: "center", gap: 14,
                    }}
                  >
                    {h.image && (
                      <img
                        src={h.image}
                        alt={h.name}
                        style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {h.subtitle && (
                        <p style={{
                          margin: 0, fontFamily: font, fontSize: 11, fontWeight: 500,
                          letterSpacing: "0.08em", textTransform: "uppercase", color: "#715a3d",
                          marginBottom: 4,
                        }}>
                          {h.subtitle}
                        </p>
                      )}
                      <p style={{
                        margin: 0, fontFamily: FONT_HEAD, fontSize: 18, fontWeight: 500,
                        color: TEXT, lineHeight: 1.2,
                      }}>
                        {h.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })()}
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
