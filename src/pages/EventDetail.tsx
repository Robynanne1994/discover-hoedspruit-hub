import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ImageLightbox from "@/components/ImageLightbox";
import EventEditDialog from "@/components/admin/EventEditDialog";
import {
  Calendar, Clock, MapPin, RotateCcw, Share2, ArrowUpRight, Heart,
  Mail, Phone, Globe, Banknote, Pencil, Send, Navigation, CalendarPlus, ExternalLink, StickyNote, Check,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import BottomNav from "@/components/BottomNav";
import BackArrowIcon from "@/components/ui/BackArrowIcon";
import { formatEventDateRange, getEventDates } from "@/lib/eventDates";
import { getPerformances, hasPerformances, getNextOccurrence, isEventPast as isEventPastUnified, parseRecurrenceRule } from "@/lib/eventSchedule";
import { formatSAPhone } from "@/lib/formatPhone";
import { collectContacts } from "@/lib/contacts";

const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

// Design tokens (match ListingDetail)
const C = {
  bg: "#E6E0CC",
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

const WhatsAppIcon = ({ size = 18, color = C.primary, ...props }: { size?: number; color?: string } & React.SVGProps<SVGSVGElement>) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true" {...props}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.693.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.83 9.83 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.82 11.82 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413Z" />
  </svg>
);


const pressScale = (s = "0.98") => ({
  onPointerDown: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = `scale(${s})`),
  onPointerUp: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
  onPointerLeave: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
});

const headStyle: React.CSSProperties = {
  margin: "0 0 12px",
  fontFamily: FONT, fontWeight: 700, fontSize: 22, lineHeight: 1.2,
  letterSpacing: 0, textTransform: "none", color: C.heading,
};
const paraStyle: React.CSSProperties = {
  fontFamily: FONT, fontWeight: 400, fontSize: 14.5, lineHeight: 1.6,
  color: C.text, margin: "0 0 10px",
};
const floatBtn: React.CSSProperties = {
  width: 40, height: 40, borderRadius: 999,
  background: "#FFFFFF", border: "none", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
};

type TabKey = "about" | "details" | "contact" | "gallery" | "location";

const pad = (n: number) => String(n).padStart(2, "0");
const toIcsDate = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
const escIcs = (s: string) =>
  s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

// Resolve the start/end Date pair to use when adding to calendar.
// For multi-performance / recurring events this is the *next* upcoming occurrence.
const resolveCalendarRange = (e: any): { start: Date; end: Date } | null => {
  const next = getNextOccurrence(e);
  let start: Date | null = null;
  let endDateStr: string | null = null;
  let endTime: string = "";

  if (next) {
    start = next.date;
    endDateStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
    endTime = (next.endTime || "").slice(0, 5);
  } else {
    // fall back to legacy single/continuous fields
    const startDateStr = e.start_date || e.date;
    if (!startDateStr) return null;
    const startTime = (e.start_time || "00:00").slice(0, 5);
    start = new Date(`${startDateStr}T${startTime}:00`);
    if (isNaN(start.getTime())) return null;
    endDateStr = e.end_date || startDateStr;
    endTime = (e.end_time || "").slice(0, 5);
  }

  let end: Date;
  if (endTime) {
    end = new Date(`${endDateStr}T${endTime}:00`);
    if (isNaN(end.getTime())) end = new Date(start.getTime() + 60 * 60 * 1000);
  } else {
    end = new Date(start.getTime() + 60 * 60 * 1000);
  }
  return { start, end };
};

const buildIcs = (e: any): string | null => {
  const range = resolveCalendarRange(e);
  if (!range) return null;
  const now = new Date();
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hello Hoedspruit//Events//EN",
    "BEGIN:VEVENT",
    `UID:${e.id}@hellohoedspruit`,
    `DTSTAMP:${toIcsDate(now)}`,
    `DTSTART:${toIcsDate(range.start)}`,
    `DTEND:${toIcsDate(range.end)}`,
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
  const range = resolveCalendarRange(e);
  if (!range) return null;
  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title || "",
    dates: `${fmt(range.start)}/${fmt(range.end)}`,
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
  const [tab, setTab] = useState<TabKey>("details");
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
    const hasAboutContent = !!((event as any).description?.trim() || (event as any).hosted_by_name || (event as any).hosted_by_name_2 || (event as any).hosted_by_name_3);
    if (hasAboutContent) setTab("about");
  }, [event]);

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

  const performances = getPerformances(e);
  const isMultiPerformance = performances.length > 0;
  const recurrenceRule = parseRecurrenceRule(e.recurrence);
  const nextOccurrence = getNextOccurrence(e);

  const startTimeRaw = e.start_time ? String(e.start_time).trim() : "";
  const endTimeRaw = e.end_time ? String(e.end_time).trim() : "";
  const startTimeFmt = startTimeRaw ? formatTime(startTimeRaw) : null;
  const endTimeFmt = endTimeRaw && endTimeRaw !== startTimeRaw ? formatTime(endTimeRaw) : null;
  const legacyTimeDisplay = startTimeFmt ? `${startTimeFmt}${endTimeFmt ? ` – ${endTimeFmt}` : ""}` : (endTimeFmt || null);

  // Date/time labels shown in the title block — adapt to event shape.
  let dateDisplay: string | null = formatEventDateRange(e, { long: true });
  let timeDisplay: string | null = legacyTimeDisplay;
  if (isMultiPerformance && nextOccurrence) {
    const d = nextOccurrence.date;
    dateDisplay = `Next: ${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()]}, ${d.getDate()} ${["January","February","March","April","May","June","July","August","September","October","November","December"][d.getMonth()]} ${d.getFullYear()}`;
    const t = formatTime(nextOccurrence.startTime || null);
    const tEnd = nextOccurrence.endTime && nextOccurrence.endTime !== nextOccurrence.startTime ? formatTime(nextOccurrence.endTime) : null;
    timeDisplay = t ? `${t}${tEnd ? ` – ${tEnd}` : ""}` : null;
  } else if (recurrenceRule && nextOccurrence) {
    const d = nextOccurrence.date;
    dateDisplay = `Next: ${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()]}, ${d.getDate()} ${["January","February","March","April","May","June","July","August","September","October","November","December"][d.getMonth()]} ${d.getFullYear()}`;
  }

  const mapsLink = e.google_maps_link || null;
  const socialLink = e.social_media_link || null;
  const socialLabel = e.social_media_label || null;
  const contactEmail = e.contact_email || null;
  const contactPhone = e.contact_phone || null;
  const contactWhatsApp = e.contact_whatsapp || null;
  const waClean = contactWhatsApp ? contactWhatsApp.replace(/[^0-9]/g, "") : null;
  const galleryImages: string[] = e.gallery_images ?? [];
  const bookingLink = e.booking_link || null;
  const bookingLinkLabel = e.booking_link_label?.trim() || null;
  const price = e.price || null;
  const priceNotes: string[] = Array.isArray((e as any).price_notes)
    ? (e as any).price_notes.filter((s: string) => s && String(s).trim())
    : [];
  const notes = e.notes || null;
  const subTag1 = e.sub_tag_1 || null;
  const subTag2 = e.sub_tag_2 || null;
  const eyebrowText = [e.tag, subTag1, subTag2].filter((t) => t && String(t).trim() !== "")[0] || null;

  const directionsHref = mapsLink || (e.location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.location)}` : null);
  const canAddToCal = !!(e.start_date || e.date || isMultiPerformance) && !!nextOccurrence;

  // Past = no upcoming occurrence of any kind.
  const isPast = isEventPastUnified(e);

  // Action pills
  const actions = [
    bookingLink && {
      key: "booking", label: bookingLinkLabel || "Book / Tickets",
      href: bookingLink, Icon: ExternalLink, ext: true,
      disabled: isPast,
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
      onClick: () => addToCalendar(e), Icon: CalendarPlus,
    },
  ].filter(Boolean) as Array<{ key: string; label: string; href?: string; onClick?: () => void; Icon: any; ext?: boolean; disabled?: boolean }>;

  const PillBtn = ({ a, full }: { a: typeof actions[number]; full?: boolean }) => {
    const disabled = a.disabled;
    const baseStyle: React.CSSProperties = {
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
      padding: "14px 18px", borderRadius: 999,
      background: disabled ? "#f5f0e8" : C.surface,
      border: `1px solid ${C.border}`,
      color: disabled ? C.muted : C.heading,
      textDecoration: "none",
      cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: FONT, fontWeight: 400, fontSize: 14,
      letterSpacing: "0.01em", flexShrink: 1,
      width: full ? "100%" : undefined,
      transition: "transform 150ms ease-out",
      opacity: disabled ? 0.7 : 1,
    };
    const inner = (<>
      <a.Icon size={16} strokeWidth={1.75} color={disabled ? C.muted : C.heading} />
      <span>{a.label}</span>
    </>);
    if (disabled) {
      return <div style={baseStyle}>{inner}</div>;
    }
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
          fontFamily: FONT, fontWeight: active ? 700 : 400, fontSize: 12,
          letterSpacing: "0.08em", textTransform: "uppercase",
          color: active ? C.heading : C.muted,
          borderBottom: `2px solid ${active ? C.heading : "transparent"}`,
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

    const hosts: { name: string; subtitle?: string; image?: string; link?: string }[] = [];
    if (e.hosted_by_name) hosts.push({ name: e.hosted_by_name, subtitle: e.hosted_by_subtitle, image: e.hosted_by_image_url, link: (e as any).hosted_by_link });
    if (e.hosted_by_name_2) hosts.push({ name: e.hosted_by_name_2, subtitle: e.hosted_by_subtitle_2, image: e.hosted_by_image_url_2, link: (e as any).hosted_by_link_2 });
    if (e.hosted_by_name_3) hosts.push({ name: e.hosted_by_name_3, subtitle: e.hosted_by_subtitle_3, image: e.hosted_by_image_url_3, link: (e as any).hosted_by_link_3 });

    return (
      <div style={{ padding: 20 }}>
        {desc && (
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
        )}



        {hosts.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <h2 style={{ ...headStyle, marginBottom: 14 }}>Hosted by</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {hosts.map((h, i) => {
                const Tag: any = h.link ? "a" : "div";
                const tagProps = h.link
                  ? { href: h.link, target: "_blank", rel: "noopener noreferrer" }
                  : {};
                return (
                  <Tag
                    key={i}
                    {...tagProps}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      background: C.surface, borderRadius: 16, padding: "14px 16px",
                      border: `1px solid ${C.border}`,
                      textDecoration: "none", color: "inherit",
                    }}
                  >
                    {h.image ? (
                      <img
                        src={h.image}
                        alt={h.name}
                        style={{ width: 48, height: 48, borderRadius: 999, objectFit: "cover", flexShrink: 0 }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 48, height: 48, borderRadius: 999,
                          background: C.ivory, flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <span style={{ fontFamily: FONT, fontSize: 18, color: C.muted }}>{h.name.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <div style={{ minWidth: 1, flex: 1 }}>
                      <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: C.heading }}>{h.name}</div>
                      {h.subtitle && (
                        <div style={{ fontFamily: FONT, fontSize: 12, color: C.muted, marginTop: 2 }}>{h.subtitle}</div>
                      )}
                    </div>
                    {h.link && (
                      <ArrowUpRight size={18} color={C.primary} style={{ flexShrink: 0 }} />
                    )}
                  </Tag>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const detailRows: { Icon: any; label: string; value: React.ReactNode; href?: string; external?: boolean }[] = [];
  if (isMultiPerformance) {
    const todayMid = new Date();
    todayMid.setHours(0, 0, 0, 0);
    const nextKey = nextOccurrence ? `${nextOccurrence.date.getFullYear()}-${pad(nextOccurrence.date.getMonth() + 1)}-${pad(nextOccurrence.date.getDate())}` : null;
    detailRows.push({
      Icon: Calendar,
      label: "Performances",
      value: (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {performances.map((p, i) => {
            const d = new Date(`${p.date}T00:00:00`);
            const past = d < todayMid;
            const isNext = !past && nextKey === p.date;
            const weekday = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()];
            const month = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()];
            const tLabel = p.time ? formatTime(p.time) : "";
            const tEnd = p.end_time && p.end_time !== p.time ? formatTime(p.end_time) : "";
            const timeStr = tLabel ? `${tLabel}${tEnd ? ` – ${tEnd}` : ""}` : "";
            return (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "6px 10px", borderRadius: 8,
                  opacity: past ? 0.45 : 1,
                }}
              >
                <span style={{ fontFamily: FONT, fontSize: 14, color: C.heading, flex: 1 }}>
                  {weekday}, {d.getDate()} {month} {d.getFullYear()}
                  {timeStr ? <span style={{ color: C.muted }}> · {timeStr}</span> : null}
                </span>
                {isNext && (
                  <span style={{
                    fontFamily: FONT, fontSize: 10, fontWeight: 700,
                    letterSpacing: "0.1em", color: C.muted,
                    background: "#f5f0e8", borderRadius: 999, padding: "2px 8px",
                  }}>NEXT</span>
                )}
              </div>
            );
          })}
        </div>
      ),
    });
    if (timeDisplay && nextOccurrence) {
      // Already inline above — no separate Time row.
    }
  } else {
    if (dateDisplay) detailRows.push({ Icon: Calendar, label: "Date", value: dateDisplay });
    if (timeDisplay) detailRows.push({ Icon: Clock, label: "Time", value: timeDisplay });
  }
  if (e.recurrence && e.recurrence.trim().toLowerCase() !== "none" && !isMultiPerformance) {
    detailRows.push({ Icon: RotateCcw, label: "Recurrence", value: e.recurrence });
  }
  if (price) detailRows.push({ Icon: Banknote, label: "Price", value: price });
  if (notes) detailRows.push({ Icon: StickyNote, label: "Notes", value: <span style={{ whiteSpace: "pre-line" }}>{notes}</span> });
  const allPhones = collectContacts(contactPhone, (e as any).additional_phones);
  const allWhatsapps = collectContacts(contactWhatsApp, (e as any).additional_whatsapps);
  const allEmails = collectContacts(contactEmail, (e as any).additional_emails);
  allPhones.forEach((p, i) => detailRows.push({ Icon: Phone, label: i === 0 ? "Phone" : `Phone ${i + 1}`, value: formatSAPhone(p), href: `tel:${p.replace(/\s/g, "")}` }));
  allWhatsapps.forEach((w, i) => {
    const clean = w.replace(/[^0-9]/g, "");
    detailRows.push({ Icon: WhatsAppIcon, label: i === 0 ? "WhatsApp" : `WhatsApp ${i + 1}`, value: formatSAPhone(w), href: `https://wa.me/${clean}`, external: true });
  });
  allEmails.forEach((em, i) => detailRows.push({ Icon: Mail, label: i === 0 ? "Email" : `Email ${i + 1}`, value: em, href: `mailto:${em}`, external: true }));

  const includedItems: string[] = Array.isArray((e as any).included) ? (e as any).included.filter((s: string) => s && s.trim()) : [];

  const renderDetails = () => (
    <div style={{ padding: 20 }}>
      {detailRows.length === 0 && includedItems.length === 0 ? (
        <p style={{ ...paraStyle, color: C.muted, textAlign: "center", marginTop: 40 }}>No additional details yet.</p>
      ) : (
        <>
          {detailRows.length > 0 && (
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
          {includedItems.length > 0 && (
            <div style={{ marginTop: detailRows.length > 0 ? 20 : 0 }}>
              <div style={{ fontSize: 11, fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted, margin: "0 0 10px 4px" }}>
                What's Included
              </div>
              <div style={{ background: C.surface, borderRadius: 16, padding: "4px 16px", border: `1px solid ${C.border}` }}>
                {includedItems.map((item, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 0",
                    borderTop: i === 0 ? "none" : `1px solid ${C.divider}`,
                  }}>
                    <span style={{
                      flexShrink: 0, width: 24, height: 24, borderRadius: 999,
                      background: "#f5f0e8", display: "inline-flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Check size={14} strokeWidth={2} color={C.primary} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 400, color: C.heading, wordBreak: "break-word" }}>
                      {item}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
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

  const renderLocation = () => {
    const isSurrounds = (event.location || "").trim().toLowerCase() === "hoedspruit & surrounds";
    return (
      <div style={{ padding: 20 }}>
        <h2 style={headStyle}>Location</h2>
        <div style={{ background: C.surface, borderRadius: 16, overflow: "hidden", border: `1px solid ${C.border}` }}>
          {isSurrounds ? (
            <div style={{ padding: "32px 20px", textAlign: "center", fontFamily: FONT, fontSize: 14, color: C.heading }}>
              Hoedspruit &amp; Surrounds
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
        {!isSurrounds && directionsHref && (
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
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, paddingBottom: 100, fontFamily: FONT, color: C.text }}>
      {/* Hero (4:3) with floating action buttons */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3", background: "#DDD6C0", overflow: "hidden" }}>
        {((event as any).detail_image_url || event.image_url) && (
          <img src={(event as any).detail_image_url || event.image_url} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />

        )}
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          style={{
            ...floatBtn,
            position: "absolute",
            top: "calc(env(safe-area-inset-top) + 16px)",
            left: 16,
            zIndex: 2,
          }}
        >
          <BackArrowIcon size={20} color={C.heading} />
        </button>
        <div style={{
          position: "absolute",
          top: "calc(env(safe-area-inset-top) + 16px)",
          right: 16,
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <button onClick={() => { if (!requireAuth()) toggleFavourite.mutate(); }} aria-label={isFavourited ? "Unsave" : "Save"} style={floatBtn}>
            <Heart size={20} strokeWidth={1.6} color={isFavourited ? C.primary : C.heading} fill={isFavourited ? C.primary : "none"} />
          </button>
          <button onClick={handleShare} aria-label="Share" style={floatBtn}>
            <Share2 size={20} strokeWidth={1.6} color={C.heading} />
          </button>
          {isAdmin && (
            <button onClick={() => setEditOpen(true)} aria-label="Edit" style={floatBtn}>
              <Pencil size={18} strokeWidth={1.6} color={C.heading} />
            </button>
          )}
        </div>
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
        <h1
          data-no-title-case={(event as any).title_override?.trim() ? "true" : undefined}
          style={{
            margin: 0, fontFamily: FONT, fontWeight: 700, fontSize: 28, lineHeight: 1.15,
            color: C.heading, letterSpacing: "0.01em",
          }}
        >
          {(event as any).title_override?.trim()
            ? <span data-no-title-case="true">{(event as any).title_override}</span>
            : event.title}
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

        {isPast ? (
          <div style={{
            marginTop: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "14px 18px",
            borderRadius: 999,
            background: "#f5f0e8",
            border: `1px solid ${C.border}`,
            color: C.muted,
            fontFamily: FONT, fontWeight: 400, fontSize: 14,
            letterSpacing: "0.01em",
            opacity: 1,
          }}>
            <Calendar size={16} strokeWidth={1.75} color={C.muted} />
            <span>EVENT HAS PASSED</span>
          </div>
        ) : actions.length > 0 && (
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {actions.map((a, i) => {
              const isLastOdd = actions.length % 2 === 1 && i === actions.length - 1;
              return (
                <div key={a.key} style={isLastOdd ? { gridColumn: "1 / -1" } : undefined}>
                  <PillBtn a={a} full />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {(() => {
        const hasAboutContent = !!(e.description?.trim() || e.hosted_by_name || e.hosted_by_name_2 || e.hosted_by_name_3);
        return (
          <>
            <nav style={{
              position: "sticky", top: 0, zIndex: 30,
              background: C.surface, borderBottom: `1px solid ${C.border}`,
              display: "flex", padding: "0 8px",
            }}>
              {hasAboutContent && <TabBtn k="about" label="About" />}
              <TabBtn k="details" label="Details" />
              {galleryImages.length > 0 && <TabBtn k="gallery" label="Gallery" />}
              <TabBtn k="location" label="Location" />
            </nav>

            <main>
              {tab === "about" && hasAboutContent && renderAbout()}
              {tab === "details" && renderDetails()}
              {tab === "gallery" && galleryImages.length > 0 && renderGallery()}
              {tab === "location" && renderLocation()}
            </main>
          </>
        );
      })()}


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
