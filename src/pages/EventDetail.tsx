import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ImageLightbox from "@/components/ImageLightbox";
import EventEditDialog from "@/components/admin/EventEditDialog";
import {
  Calendar, Clock, MapPin, RotateCcw, Share2, ArrowUpRight, Heart,
  Mail, Phone, Globe, Banknote, Pencil, Send, Navigation, CalendarPlus, ExternalLink, StickyNote,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import BottomNav from "@/components/BottomNav";
import BackArrowIcon from "@/components/ui/BackArrowIcon";
import { formatEventDateRange } from "@/lib/eventDates";
import { formatSAPhone } from "@/lib/formatPhone";

const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

// Design tokens (match ListingDetail)
const C = {
  bg: "#ebebeb",
  surface: "#ffffff",
  ivory: "#f5f0e8",
  border: "#E8E4DF",
  divider: "#EDE9E3",
  heading: "#020202",
  text: "#2b2420",
  muted: "#8A8480",
  primary: "#715a3d",
  accent: "#B8916A",
};

const pressScale = (s = "0.98") => ({
  onPointerDown: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = `scale(${s})`),
  onPointerUp: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
  onPointerLeave: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
});

const headStyle: React.CSSProperties = {
  margin: "0 0 12px",
  fontFamily: FONT, fontWeight: 400, fontSize: 12,
  letterSpacing: "0.08em", textTransform: "uppercase", color: C.heading,
};
const paraStyle: React.CSSProperties = {
  fontFamily: FONT, fontWeight: 400, fontSize: 14.5, lineHeight: 1.6,
  color: C.text, margin: "0 0 10px",
};
const iconBtn: React.CSSProperties = {
  width: 40, height: 40, borderRadius: 999,
  background: "none", border: "none", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
};

type TabKey = "about" | "details" | "gallery" | "location";

const pad = (n: number) => String(n).padStart(2, "0");
const toIcsDate = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
const escIcs = (s: string) =>
  s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

const buildIcs = (e: any): string | null => {
  const startDateStr = e.start_date || e.date;
  if (!startDateStr) return null;
  const startTime = (e.start_time || "00:00").slice(0, 5);
  const startISO = `${startDateStr}T${startTime}:00`;
  const start = new Date(startISO);
  if (isNaN(start.getTime())) return null;
  const endDateStr = e.end_date || startDateStr;
  const endTime = (e.end_time || "").slice(0, 5);
  let end: Date;
  if (endTime) {
    end = new Date(`${endDateStr}T${endTime}:00`);
    if (isNaN(end.getTime())) end = new Date(start.getTime() + 60 * 60 * 1000);
  } else {
    end = new Date(start.getTime() + 60 * 60 * 1000);
  }
  const now = new Date();
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hello Hoedspruit//Events//EN",
    "BEGIN:VEVENT",
    `UID:${e.id}@hellohoedspruit`,
    `DTSTAMP:${toIcsDate(now)}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escIcs(e.title || "")}`,
    e.description ? `DESCRIPTION:${escIcs(e.description)}` : "",
    e.location ? `LOCATION:${escIcs(e.location)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
};

// Build Google Calendar event-create URL. Works on web + mobile (opens
// Google Calendar app on Android, Google Calendar in browser elsewhere),
// which adds the event to the user's own calendar instead of downloading a file.
const buildGoogleCalUrl = (e: any): string | null => {
  const startDateStr = e.start_date || e.date;
  if (!startDateStr) return null;
  const startTime = (e.start_time || "00:00").slice(0, 5);
  const start = new Date(`${startDateStr}T${startTime}:00`);
  if (isNaN(start.getTime())) return null;
  const endDateStr = e.end_date || startDateStr;
  const endTime = (e.end_time || "").slice(0, 5);
  let end: Date;
  if (endTime) {
    end = new Date(`${endDateStr}T${endTime}:00`);
    if (isNaN(end.getTime())) end = new Date(start.getTime() + 60 * 60 * 1000);
  } else {
    end = new Date(start.getTime() + 60 * 60 * 1000);
  }
  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title || "",
    dates: `${fmt(start)}/${fmt(end)}`,
  });
  if (e.description) params.set("details", String(e.description).replace(/<[^>]*>/g, ""));
  if (e.location) params.set("location", String(e.location).replace(/<[^>]*>/g, ""));
  return `https://www.google.com/calendar/render?${params.toString()}`;
};

const downloadIcs = (e: any) => {
  const ics = buildIcs(e);
  if (!ics) { toast.error("This event has no start date."); return; }
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(e.title || "event").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const addToCalendar = (e: any) => {
  const ua = navigator.userAgent || "";
  const isAppleMobile = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in document);
  // Apple devices open .ics natively into the Calendar app; everyone else gets Google Calendar.
  if (isAppleMobile) {
    downloadIcs(e);
    return;
  }
  const url = buildGoogleCalUrl(e);
  if (!url) { toast.error("This event has no start date."); return; }
  window.open(url, "_blank", "noopener,noreferrer");
};

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [tab, setTab] = useState<TabKey>("about");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [mapCoords, setMapCoords] = useState<{ lat: number; lon: number } | null>(null);

  const { data: event, isLoading } = useQuery({
    queryKey: ["event-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: isFavourited } = useQuery({
    queryKey: ["favourite", "event", id, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("favourites" as any)
        .select("id").eq("user_id", user.id).eq("item_id", id!).eq("item_type", "event").maybeSingle();
      return !!data;
    },
    enabled: !!user && !!id,
  });

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

  const requireAuth = () => {
    if (!user) { toast.info("Sign in to use this feature"); navigate("/auth"); return true; }
    return false;
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: event?.title, url: shareUrl }); }
      catch (err) {
        if ((err as Error).name !== "AbortError") {
          try { await navigator.clipboard.writeText(shareUrl); toast.success("Link copied!"); } catch { toast.error("Could not copy link"); }
        }
      }
    } else {
      try { await navigator.clipboard.writeText(shareUrl); toast.success("Link copied!"); } catch { toast.error("Could not copy link"); }
    }
  };

  // Geocode for Location tab
  useEffect(() => {
    if (!event) return;
    setMapCoords(null);
    const link: string | null = (event as any).google_maps_link || null;
    const loc: string | null = event.location || null;
    const tryParse = (url: string) => {
      const at = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (at) return { lat: parseFloat(at[1]), lon: parseFloat(at[2]) };
      const d = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
      if (d) return { lat: parseFloat(d[1]), lon: parseFloat(d[2]) };
      const q = url.match(/[?&](?:query|q)=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (q) return { lat: parseFloat(q[1]), lon: parseFloat(q[2]) };
      return null;
    };
    if (link) {
      const parsed = tryParse(link);
      if (parsed) { setMapCoords(parsed); return; }
    }
    const query = loc ? `${loc}, Hoedspruit, South Africa` : `${event.title}, Hoedspruit, South Africa`;
    let cancelled = false;
    fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((arr) => {
        if (cancelled) return;
        if (Array.isArray(arr) && arr[0]) setMapCoords({ lat: parseFloat(arr[0].lat), lon: parseFloat(arr[0].lon) });
        else setMapCoords({ lat: -24.3567, lon: 31.0 });
      })
      .catch(() => { if (!cancelled) setMapCoords({ lat: -24.3567, lon: 31.0 }); });
    return () => { cancelled = true; };
  }, [event]);

  if (isLoading || !event) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, fontFamily: FONT, color: C.text }}>
        <div style={{ padding: 20 }}>
          <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: C.primary, fontFamily: FONT, fontSize: 15 }}>
            <BackArrowIcon size={20} color={C.primary} />
            <span>Back</span>
          </button>
        </div>
        <div style={{ padding: "80px 20px", textAlign: "center", color: C.muted, fontSize: 14 }}>
          {isLoading ? "Loading..." : "Event not found."}
        </div>
      </div>
    );
  }

  const e: any = event;

  const formatTime = (time: string | null) => {
    if (!time) return null;
    const [h, m] = time.split(":");
    const hour = parseInt(h);
    if (isNaN(hour)) return time;
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  const startTimeRaw = e.start_time ? String(e.start_time).trim() : "";
  const endTimeRaw = e.end_time ? String(e.end_time).trim() : "";
  const startTimeFmt = startTimeRaw ? formatTime(startTimeRaw) : null;
  const endTimeFmt = endTimeRaw && endTimeRaw !== startTimeRaw ? formatTime(endTimeRaw) : null;
  const timeDisplay = startTimeFmt ? `${startTimeFmt}${endTimeFmt ? ` – ${endTimeFmt}` : ""}` : (endTimeFmt || null);
  const dateDisplay = formatEventDateRange(e, { long: true });

  const mapsLink = e.google_maps_link || null;
  const socialLink = e.social_media_link || null;
  const socialLabel = e.social_media_label || null;
  const contactEmail = e.contact_email || null;
  const contactPhone = e.contact_phone || null;
  const contactWhatsapp = e.contact_whatsapp || null;
  const waClean = contactWhatsapp ? contactWhatsapp.replace(/[^0-9]/g, "") : null;
  const galleryImages: string[] = e.gallery_images ?? [];
  const bookingLink = e.booking_link || null;
  const bookingLinkLabel = e.booking_link_label?.trim() || null;
  const price = e.price || null;
  const notes = e.notes || null;
  const subTag1 = e.sub_tag_1 || null;
  const subTag2 = e.sub_tag_2 || null;
  const eyebrowText = [e.tag, subTag1, subTag2].filter((t) => t && String(t).trim() !== "")[0] || null;

  const directionsHref = mapsLink || (e.location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.location)}` : null);
  const canAddToCal = !!(e.start_date || e.date);

  // Action pills
  const actions = [
    bookingLink && {
      key: "booking", label: bookingLinkLabel || "Book / Tickets",
      href: bookingLink, Icon: ExternalLink, ext: true,
    },
    socialLink && {
      key: "social", label: socialLabel || "Website",
      href: socialLink, Icon: Globe, ext: true,
    },
    directionsHref && {
      key: "directions", label: "Directions",
      href: directionsHref, Icon: Send, ext: true,
    },
    canAddToCal && {
      key: "calendar", label: "Add to Calendar",
      onClick: () => downloadIcs(e), Icon: CalendarPlus,
    },
  ].filter(Boolean) as Array<{ key: string; label: string; href?: string; onClick?: () => void; Icon: any; ext?: boolean }>;

  const PillBtn = ({ a, full }: { a: typeof actions[number]; full?: boolean }) => {
    const baseStyle: React.CSSProperties = {
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
      padding: "10px 14px", borderRadius: 999,
      background: C.surface, border: `1px solid ${C.border}`,
      color: C.primary, textDecoration: "none", cursor: "pointer",
      fontFamily: FONT, fontWeight: 400, fontSize: 13,
      letterSpacing: "0.01em", flexShrink: 0,
      width: full ? "100%" : undefined,
      transition: "transform 150ms ease-out",
    };
    const inner = (<>
      <a.Icon size={14} strokeWidth={1.75} color={C.primary} />
      <span>{a.label}</span>
    </>);
    if (a.onClick) {
      return <button type="button" onClick={a.onClick} style={baseStyle} {...pressScale()}>{inner}</button>;
    }
    return (
      <a href={a.href} {...(a.ext ? { target: "_blank", rel: "noopener noreferrer" } : {})} style={baseStyle} {...pressScale()}>
        {inner}
      </a>
    );
  };

  const TabBtn = ({ k, label }: { k: TabKey; label: string }) => {
    const active = tab === k;
    return (
      <button
        onClick={() => setTab(k)}
        style={{
          flex: 1, background: "none", border: "none", cursor: "pointer",
          padding: "14px 4px",
          fontFamily: FONT, fontWeight: 400, fontSize: 12,
          letterSpacing: "0.08em", textTransform: "uppercase",
          color: active ? C.heading : C.muted,
          borderBottom: `2px solid ${active ? C.primary : "transparent"}`,
          marginBottom: -1,
        }}
      >
        {label}
      </button>
    );
  };

  // ----- Tabs -----
  const renderAbout = () => {
    const desc = (e.description || "").trim();
    const isLong = desc.length > 180;
    const paragraphs = desc.split("\n").filter(Boolean);
    return (
      <div style={{ padding: 20 }}>
        {desc ? (
          <>
            <h2 style={headStyle}>About</h2>
            <div style={!aboutExpanded && isLong ? {
              display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
            } : undefined}>
              {paragraphs.map((p, i) => <p key={i} style={paraStyle}>{p}</p>)}
            </div>
            {isLong && (
              <button
                onClick={() => setAboutExpanded(!aboutExpanded)}
                style={{
                  marginTop: 6, background: "none", border: "none", padding: 0, cursor: "pointer",
                  fontFamily: FONT, fontSize: 13, color: C.primary,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                }}
              >
                {aboutExpanded ? "Show less" : "Read more"}
              </button>
            )}
          </>
        ) : (
          <p style={{ ...paraStyle, color: C.muted, textAlign: "center", marginTop: 40 }}>No description yet.</p>
        )}

      </div>
    );
  };

  const detailRows: { Icon: any; label: string; value: React.ReactNode; href?: string; external?: boolean }[] = [];
  if (dateDisplay) detailRows.push({ Icon: Calendar, label: "Date", value: dateDisplay });
  if (timeDisplay) detailRows.push({ Icon: Clock, label: "Time", value: timeDisplay });
  if (e.recurrence && e.recurrence.trim().toLowerCase() !== "none") {
    detailRows.push({ Icon: RotateCcw, label: "Recurrence", value: e.recurrence });
  }
  if (price) detailRows.push({ Icon: Banknote, label: "Price", value: price });
  if (notes) detailRows.push({ Icon: StickyNote, label: "Notes", value: <span style={{ whiteSpace: "pre-line" }}>{notes}</span> });
  if (contactPhone) detailRows.push({ Icon: Phone, label: "Phone", value: formatSAPhone(contactPhone), href: `tel:${contactPhone.replace(/\s/g, "")}` });
  if (waClean) detailRows.push({ Icon: Phone, label: "WhatsApp", value: formatSAPhone(contactWhatsapp), href: `https://wa.me/${waClean}`, external: true });
  if (contactEmail) detailRows.push({ Icon: Mail, label: "Email", value: contactEmail, href: `mailto:${contactEmail}`, external: true });

  const renderDetails = () => (
    <div style={{ padding: 20 }}>
      {detailRows.length === 0 ? (
        <p style={{ ...paraStyle, color: C.muted, textAlign: "center", marginTop: 40 }}>No additional details yet.</p>
      ) : (
        <div style={{ background: C.surface, borderRadius: 16, padding: "4px 16px", border: `1px solid ${C.border}` }}>
          {detailRows.map((r, i) => {
            const inner = (
              <>
                <r.Icon size={18} strokeWidth={1.5} color={C.primary} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted }}>{r.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 400, color: C.heading, wordBreak: "break-word" }}>{r.value}</div>
                </div>
                {r.href && <ArrowUpRight size={16} color={C.muted} />}
              </>
            );
            const style: React.CSSProperties = {
              display: "flex", alignItems: "center", gap: 14,
              padding: "14px 0", textDecoration: "none",
              borderTop: i === 0 ? "none" : `1px solid ${C.divider}`,
            };
            if (r.href) {
              return (
                <a key={i} href={r.href} {...(r.external ? { target: "_blank", rel: "noopener noreferrer" } : {})} style={style}>
                  {inner}
                </a>
              );
            }
            return <div key={i} style={style}>{inner}</div>;
          })}
        </div>
      )}
    </div>
  );

  const renderGallery = () => (
    <div style={{ padding: 20 }}>
      {galleryImages.length === 0 ? (
        <p style={{ ...paraStyle, color: C.muted, textAlign: "center", marginTop: 40 }}>No photos yet.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
          {galleryImages.map((url, i) => (
            <button key={i} type="button"
              onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
              style={{ aspectRatio: "1 / 1", borderRadius: 12, overflow: "hidden", background: C.ivory, border: "none", padding: 0, cursor: "pointer" }}
              aria-label={`Open image ${i + 1}`}
            >
              <img src={url} alt={`${event.title} ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderLocation = () => (
    <div style={{ padding: 20 }}>
      <h2 style={headStyle}>Location</h2>
      <div style={{ background: C.surface, borderRadius: 16, overflow: "hidden", border: `1px solid ${C.border}` }}>
        <div style={{ position: "relative", height: 200, background: "linear-gradient(135deg, #DDD6C0 0%, #C9C1A8 100%)" }}>
          {mapCoords && (() => {
            const d = 0.006;
            const bbox = `${mapCoords.lon - d}%2C${mapCoords.lat - d}%2C${mapCoords.lon + d}%2C${mapCoords.lat + d}`;
            return (
              <iframe
                title="Map"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${mapCoords.lat}%2C${mapCoords.lon}`}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            );
          })()}
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -100%)", pointerEvents: "none" }}>
            <div style={{ width: 16, height: 16, background: C.primary, borderRadius: "50% 50% 50% 0", transform: "rotate(-45deg)", boxShadow: "0 4px 8px rgba(0,0,0,0.25)" }} />
          </div>
        </div>
        {event.location && (
          <div style={{ padding: 16, display: "flex", alignItems: "flex-start", gap: 10 }}>
            <MapPin size={18} color={C.primary} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1, minWidth: 0, fontSize: 14, color: C.heading }}>{event.location}</div>
          </div>
        )}
      </div>
      {directionsHref && (
        <a
          href={directionsHref}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            background: C.primary, color: "#fff",
            padding: "14px 20px", borderRadius: 999,
            textDecoration: "none", fontFamily: FONT, fontSize: 14, fontWeight: 400,
            letterSpacing: "0.02em",
          }}
          {...pressScale()}
        >
          <Navigation size={16} />
          <span>Get Directions</span>
        </a>
      )}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, paddingBottom: 100, fontFamily: FONT, color: C.text }}>
      {/* Sticky header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 40,
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px",
      }}>
        <button onClick={() => navigate(-1)} aria-label="Back"
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: C.heading, padding: 4, minHeight: 40 }}>
          <BackArrowIcon size={20} color={C.heading} />
          <span style={{ fontFamily: FONT, fontSize: 15, color: C.heading }}>Event Details</span>
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button onClick={() => { if (!requireAuth()) toggleFavourite.mutate(); }} aria-label={isFavourited ? "Unsave" : "Save"} style={iconBtn}>
            <Heart size={20} strokeWidth={1.6} color={isFavourited ? C.primary : C.heading} fill={isFavourited ? C.primary : "none"} />
          </button>
          <button onClick={handleShare} aria-label="Share" style={iconBtn}>
            <Share2 size={20} strokeWidth={1.6} color={C.heading} />
          </button>
          {isAdmin && (
            <button onClick={() => setEditOpen(true)} aria-label="Edit" style={iconBtn}>
              <Pencil size={18} strokeWidth={1.6} color={C.heading} />
            </button>
          )}
        </div>
      </header>

      {/* Hero (4:3) */}
      <div style={{ width: "100%", aspectRatio: "4 / 3", background: "#DDD6C0", overflow: "hidden" }}>
        {event.image_url && (
          <img src={event.image_url} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        )}
      </div>

      {/* Title block */}
      <div style={{ background: C.surface, padding: "20px 20px 18px" }}>
        {eyebrowText && (
          <div style={{
            marginBottom: 8, fontSize: 11, color: C.muted,
            letterSpacing: "0.12em", textTransform: "uppercase",
          }}>
            {eyebrowText}
          </div>
        )}
        <h1 style={{
          margin: 0, fontFamily: FONT, fontWeight: 400, fontSize: 24, lineHeight: 1.2,
          color: C.heading, letterSpacing: "0.01em",
        }}>
          {event.title}
        </h1>
        {(dateDisplay || timeDisplay) && (
          <div style={{
            marginTop: 8, fontSize: 13, color: C.muted, letterSpacing: "0.01em",
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <Calendar size={12} color={C.muted} strokeWidth={1.6} />
            <span>{[dateDisplay, timeDisplay].filter(Boolean).join(" · ")}</span>
          </div>
        )}
        {event.location && (
          <div style={{
            marginTop: 6, fontSize: 13, color: C.muted, letterSpacing: "0.01em",
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <MapPin size={12} color={C.muted} strokeWidth={1.6} />
            <span>{event.location}</span>
          </div>
        )}

        {actions.length > 0 && (
          actions.length === 4 ? (
            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {actions.map((a) => <PillBtn key={a.key} a={a} full />)}
            </div>
          ) : (
            <div style={{ marginTop: 16, display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }} className="scrollbar-hide">
              {actions.map((a) => <PillBtn key={a.key} a={a} />)}
            </div>
          )
        )}
      </div>

      {/* Sticky tab bar */}
      <nav style={{
        position: "sticky", top: 57, zIndex: 30,
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        display: "flex", padding: "0 8px",
      }}>
        <TabBtn k="about" label="About" />
        <TabBtn k="details" label="Details" />
        {galleryImages.length > 0 && <TabBtn k="gallery" label="Gallery" />}
        <TabBtn k="location" label="Location" />
      </nav>

      <main>
        {tab === "about" && renderAbout()}
        {tab === "details" && renderDetails()}
        {tab === "gallery" && galleryImages.length > 0 && renderGallery()}
        {tab === "location" && renderLocation()}
      </main>

      <ImageLightbox
        images={galleryImages}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        alt={event.title}
      />

      {isAdmin && (
        <EventEditDialog open={editOpen} onOpenChange={setEditOpen} event={event} />
      )}

      <BottomNav />
    </div>
  );
};


export default EventDetail;
