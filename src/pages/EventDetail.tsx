import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ImageLightbox from "@/components/ImageLightbox";
import EventEditDialog from "@/components/admin/EventEditDialog";
import {
  Calendar, Clock, MapPin, RotateCcw, Share2, ArrowUpRight, Heart,
  Mail, Phone, Globe, Banknote, Pencil, Send, Navigation, CalendarPlus, ExternalLink, Check,
  ReceiptText, NotebookPen, Copy, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useRequireAuth } from "@/hooks/useGuestAuth";
import { useShare } from "@/hooks/useShare";
import { useIsFavourited, useToggleFavourite } from "@/hooks/useFavourites";
import BottomNav from "@/components/BottomNav";
import BackArrowIcon from "@/components/ui/BackArrowIcon";
import { formatEventDateRange, getEventDates } from "@/lib/eventDates";
import { getPerformances, hasPerformances, getNextOccurrence, isEventPast as isEventPastUnified, parseRecurrenceRule } from "@/lib/eventSchedule";
import { formatSAPhone } from "@/lib/formatPhone";
import { collectContacts } from "@/lib/contacts";
import { renderListingRichText } from "@/lib/listingRichText";
import { sharePlainText } from "@/lib/share";
import { isNativeApp } from "@/lib/nativeBridge";
import Seo from "@/components/Seo";
import { eventImage, listingImage, LISTING_IMAGE_COLUMNS } from "@/lib/imageFallback";
import LocationMap from "@/components/LocationMap";
import { MUTED, tab as tabStyle, type, metaRow, metaIcon } from "@/lib/type";
import {
  resolveLocation,
  HOEDSPRUIT_CENTRE,
  type MappableRow,
  type ResolvedLocation,
} from "@/lib/tileMap";


const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const HEAD = "'Nohemi', 'Helvetica Neue', Helvetica, Arial, sans-serif";

// Design tokens (match ListingDetail)
const C = {
  bg: "#E6E0CC",
  surface: "#ffffff",
  ivory: "#f5f0e8",
  border: "#E8E4DF",
  divider: "#EDE9E3",
  heading: "#1A1A1A",
  text: "#2b2420",
  muted: MUTED,
  primary: "#715a3d",
  accent: "#B8916A",
  dark: "#423324",
  // Soft panel that sits on the beige sheet (icon circles)
  soft: "#EEE9DA",
};

const WhatsAppIcon = ({ size = 18, color = C.primary, ...props }: { size?: number; color?: string } & React.SVGProps<SVGSVGElement>) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true" {...props}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.693.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.83 9.83 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.82 11.82 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413Z" />
  </svg>
);

const FacebookIcon = ({ size = 18, color = C.primary, ...props }: { size?: number; color?: string } & React.SVGProps<SVGSVGElement>) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
  </svg>
);

const InstagramIcon = ({ size = 18, color = C.primary, ...props }: { size?: number; color?: string } & React.SVGProps<SVGSVGElement>) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true" {...props}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.336 3.608 1.311.975.975 1.249 2.242 1.311 3.608.058 1.266.069 1.646.069 4.85s-.012 3.584-.07 4.85c-.062 1.366-.336 2.633-1.311 3.608-.975.975-2.242 1.249-3.608 1.311-1.266.058-1.645.07-4.85.07-3.204 0-3.584-.012-4.85-.07-1.366-.062-2.633-.336-3.608-1.311-.975-.975-1.249-2.242-1.311-3.608C2.175 15.747 2.163 15.368 2.163 12s.012-3.584.07-4.85c.062-1.366.336-2.633 1.311-3.608.975-.975 2.242-1.249 3.608-1.311C8.416 2.175 8.796 2.163 12 2.163zm0 1.838c-3.141 0-3.51.012-4.747.068-1.018.046-1.572.215-1.94.358-.488.19-.836.416-1.202.782-.366.366-.592.714-.782 1.202-.143.368-.312.922-.358 1.94-.056 1.237-.068 1.606-.068 4.747s.012 3.51.068 4.747c.046 1.018.215 1.572.358 1.94.19.488.416.836.782 1.202.366.366.714.592 1.202.782.368.143.922.312 1.94.358 1.237.056 1.606.068 4.747.068s3.51-.012 4.747-.068c1.018-.046 1.572-.215 1.94-.358.488-.19.836-.416 1.202-.782.366-.366.592-.714.782-1.202.143-.368.312-.922.358-1.94.056-1.237.068-1.606.068-4.747s-.012-3.51-.068-4.747c-.046-1.018-.215-1.572-.358-1.94-.19-.488-.416-.836-.782-1.202-.366-.366-.714-.592-1.202-.782-.368-.143-.922-.312-1.94-.358C15.51 4.013 15.141 4.001 12 4.001zm0 3.063A4.937 4.937 0 1116.937 12 4.943 4.943 0 0112 7.064zm0 8.137A3.2 3.2 0 1015.2 12 3.204 3.204 0 0012 15.201zm6.406-8.343a1.153 1.153 0 11-1.153-1.153 1.154 1.154 0 011.153 1.153z" />
  </svg>
);


const pressScale = (s = "0.98") => ({
  onPointerDown: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = `scale(${s})`),
  onPointerUp: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
  onPointerLeave: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
});

const headStyle: React.CSSProperties = {
  margin: "0 0 12px",
  ...type.sectionTitle, textTransform: "none",
};
const paraStyle: React.CSSProperties = {
  ...type.body, margin: "0 0 10px",
};
const cardStyle: React.CSSProperties = {
  background: C.surface,
  borderRadius: 20,
  border: "none",
};
const categoryLineStyle: React.CSSProperties = {
  marginBottom: 8,
  ...type.label,
  lineHeight: 1.4,
  color: "#715A3D",
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

const icsFileName = (e: any) =>
  `${(e.title || "event").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`;

const downloadIcsInBrowser = (e: any, ics: string) => {
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = icsFileName(e);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/**
 * `<a download>` on a blob: URL — what downloadIcsInBrowser does — is a real
 * browser download. Capacitor's WKWebView/Android WebView has no download
 * manager to catch it, so it silently does nothing there; that was the whole
 * "can't add to calendar" bug on-device. In the native app the file has to
 * actually exist on disk before anything can open it: write the .ics into
 * the app's cache dir with @capacitor/filesystem, then hand that file to
 * @capacitor/share, which opens the OS share sheet — iOS recognises a .ics
 * attachment and surfaces "Add to Calendar" as one of the sheet's own
 * actions, no EventKit integration required.
 */
const addToCalendarNative = async (e: any, ics: string): Promise<boolean> => {
  try {
    const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([
      import("@capacitor/filesystem"),
      import("@capacitor/share"),
    ]);
    const path = icsFileName(e);
    await Filesystem.writeFile({
      path,
      data: ics,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    const { uri } = await Filesystem.getUri({ path, directory: Directory.Cache });
    await Share.share({ title: e.title || "Event", url: uri, dialogTitle: "Add to Calendar" });
    return true;
  } catch (err) {
    // A user backing out of the share sheet also rejects the promise — that's
    // not a failure worth falling back from.
    const msg = (err as { message?: string })?.message?.toLowerCase() || "";
    if (msg.includes("cancel") || msg.includes("dismiss")) return true;
    console.warn("[addToCalendar] native share failed", err);
    return false;
  }
};

const addToCalendar = async (e: any) => {
  if (isNativeApp()) {
    const ics = buildIcs(e);
    if (!ics) { toast.error("This event has no start date."); return; }
    const ok = await addToCalendarNative(e, ics);
    if (ok) return;
    // Native share failed outright (not just "no start date") — Google
    // Calendar's web flow still works everywhere, including Android in-app.
    const url = buildGoogleCalUrl(e);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    else toast.error("Couldn't add this event to your calendar.");
    return;
  }

  const ua = navigator.userAgent || "";
  const isAppleMobile = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in document);
  // Apple devices open .ics natively into the Calendar app; everyone else gets Google Calendar.
  if (isAppleMobile) {
    const ics = buildIcs(e);
    if (!ics) { toast.error("This event has no start date."); return; }
    downloadIcsInBrowser(e, ics);
    return;
  }
  const url = buildGoogleCalUrl(e);
  if (!url) { toast.error("This event has no start date."); return; }
  window.open(url, "_blank", "noopener,noreferrer");
};

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  
  const [tab, setTab] = useState<TabKey>("details");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [mapPlace, setMapPlace] = useState<ResolvedLocation | null>(null);

  const { data: event, isLoading } = useQuery({
    queryKey: ["event-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // When a host is linked to an app listing, its cover image is the host photo.
  const hostListingIds = [
    (event as any)?.hosted_by_listing_id,
    (event as any)?.hosted_by_listing_id_2,
    (event as any)?.hosted_by_listing_id_3,
  ].filter(Boolean) as string[];

  const { data: hostListingImages } = useQuery({
    queryKey: ["event-host-listing-images", hostListingIds.slice().sort().join(",")],
    queryFn: async () => {
      const { data } = await supabase
        .from("listings")
        .select(`id, ${LISTING_IMAGE_COLUMNS}`)
        .in("id", hostListingIds);
      const map: Record<string, string> = {};
      (data ?? []).forEach((l: any) => {
        // The Hosted by avatar is a circle, and so is the listing's search
        // thumbnail — the one picture on the listing that was cropped knowing
        // its corners get thrown away. Everything else is a fallback behind it.
        const url = listingImage(l, "search");
        if (url) map[l.id] = url;
      });
      return map;
    },
    enabled: hostListingIds.length > 0,
  });

  const isFavourited = useIsFavourited(id!, "event");
  const toggleFavourite = useToggleFavourite();

  const requireAuth = useRequireAuth();
  const share = useShare();

  const handleToggleFavourite = () => {
    // Guests get a dismissable bottom sheet, not a full-screen redirect.
    if (!requireAuth("save favourites")) return;
    toggleFavourite.mutate({ itemId: id!, itemType: "event", currentlyFavourited: isFavourited });
    toast.success(isFavourited ? "Removed from saved" : "Saved!");
  };

  // Opens the phone's own share sheet (copy link + the user's apps); falls back
  // to the in-app sheet on desktop browsers that have none.
  const handleShare = () => {
    share({
      title: event?.title || "Hello Hoedspruit",
      text: (event as any)?.description || undefined,
      url: `/events/${id}`,
    });
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
    setMapPlace(null);
    let cancelled = false;
    const row = event as MappableRow;
    resolveLocation({
      latitude: row.latitude,
      longitude: row.longitude,
      googleMapsLink: row.google_maps_link,
      location: event.location,
      title: event.title,
    })
      .then((place) => { if (!cancelled) setMapPlace(place); })
      .catch(() => { if (!cancelled) setMapPlace({ coords: HOEDSPRUIT_CENTRE, precise: false }); });
    return () => { cancelled = true; };
  }, [event]);

  if (isLoading || !event) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, fontFamily: FONT, color: C.text }}>
        <div style={{ padding: "var(--header-top) 16px 0" }}>
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "#FFFFFF", border: "none", padding: 0, cursor: "pointer",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <BackArrowIcon size={18} color="#1A1A1A" />
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
  const notes: string[] = Array.isArray((e as any).notes)
    ? (e as any).notes.filter((s: string) => s && String(s).trim())
    : (typeof (e as any).notes === "string" && (e as any).notes.trim() ? [(e as any).notes] : []);
  const subTag1 = e.sub_tag_1 || null;
  const subTag2 = e.sub_tag_2 || null;
  const allTags = [
    { text: e.tag, type: "main" as const },
    { text: subTag1, type: "sub" as const },
    { text: subTag2, type: "sub" as const },
  ].filter((t) => t.text && String(t.text).trim() !== "");
  const eyebrowText = allTags[0]?.text || null;

  const directionsHref = mapsLink || (e.location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.location)}` : null);
  const canAddToCal = !!(e.start_date || e.date || isMultiPerformance) && !!nextOccurrence;

  // Past = no upcoming occurrence of any kind.
  const isPast = isEventPastUnified(e);

  // Action pills
  const actions = [
    bookingLink && {
      key: "booking", label: "Book",
      href: bookingLink, Icon: ExternalLink, ext: true,
      disabled: isPast,
    },
    socialLink && {
      key: "social",
      // Always show the platform name only, whatever the admin label says.
      label: /facebook\.com|fb\.com/i.test(socialLink) ? "Facebook" : /instagram\.com/i.test(socialLink) ? "Instagram" : "Website",
      href: socialLink,
      Icon: /facebook\.com/i.test(socialLink) ? FacebookIcon : /instagram\.com/i.test(socialLink) ? InstagramIcon : Globe,
      ext: true,
    },
    directionsHref && {
      key: "directions", label: "Directions",
      href: directionsHref, Icon: Send, ext: true,
    },
    canAddToCal && {
      key: "calendar", label: "Calendar",
      onClick: () => addToCalendar(e), Icon: CalendarPlus,
    },
  ].filter(Boolean) as Array<{ key: string; label: string; href?: string; onClick?: () => void; Icon: any; ext?: boolean; disabled?: boolean }>;

  const ActionBtn = ({ a }: { a: typeof actions[number] }) => {
    const disabled = a.disabled;
    const filled = !disabled && a.key === "booking";
    const fg = disabled ? C.muted : filled ? "#FFFFFF" : C.heading;
    const baseStyle: React.CSSProperties = {
      flex: 1, minWidth: 0,
      display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
      padding: "12px 6px", borderRadius: 18,
      background: disabled ? C.ivory : filled ? C.dark : C.surface,
      border: "none",
      color: fg, textDecoration: "none",
      cursor: disabled ? "not-allowed" : "pointer",
      ...type.tabActive,
      boxShadow: disabled ? "none" : filled ? "0 6px 16px rgba(66,51,36,0.28)" : "0 4px 14px rgba(43,36,32,0.10)",
      transition: "transform 150ms ease-out",
    };
    const inner = (
      <>
        <a.Icon size={20} strokeWidth={1.75} color={fg} />
        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{a.label}</span>
      </>
    );
    if (disabled) return <div style={baseStyle}>{inner}</div>;
    if (a.onClick) return <button type="button" onClick={a.onClick} style={baseStyle} {...pressScale()}>{inner}</button>;
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
          ...tabStyle(active),
          color: active ? C.heading : MUTED,
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

    // A host can link to a listing on the app or out to a URL — never both, so
    // the listing wins if some old row somehow carries the two.
    // A photo uploaded and cropped for the host always wins over the linked
    // listing's cover, so the crop in the editor is what the page shows.
    const hosts: { name: string; subtitle?: string; image?: string; link?: string; listingId?: string }[] = [];
    if (e.hosted_by_name) hosts.push({ name: e.hosted_by_name, subtitle: e.hosted_by_subtitle, image: e.hosted_by_image_url || (e.hosted_by_listing_id && hostListingImages?.[e.hosted_by_listing_id]) || undefined, link: (e as any).hosted_by_link, listingId: e.hosted_by_listing_id });
    if (e.hosted_by_name_2) hosts.push({ name: e.hosted_by_name_2, subtitle: e.hosted_by_subtitle_2, image: e.hosted_by_image_url_2 || (e.hosted_by_listing_id_2 && hostListingImages?.[e.hosted_by_listing_id_2]) || undefined, link: (e as any).hosted_by_link_2, listingId: e.hosted_by_listing_id_2 });
    if (e.hosted_by_name_3) hosts.push({ name: e.hosted_by_name_3, subtitle: e.hosted_by_subtitle_3, image: e.hosted_by_image_url_3 || (e.hosted_by_listing_id_3 && hostListingImages?.[e.hosted_by_listing_id_3]) || undefined, link: (e as any).hosted_by_link_3, listingId: e.hosted_by_listing_id_3 });

    return (
      <div style={{ padding: "16px 20px 20px" }}>
        {desc && (
          <>
            <div style={{ ...cardStyle, padding: "18px 20px" }}>{renderListingRichText(desc)}</div>
          </>
        )}



        {hosts.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <h2 style={{ ...headStyle, marginBottom: 14 }}>Hosted by</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {hosts.map((h, i) => {
                const Tag: any = h.listingId ? Link : h.link ? "a" : "div";
                const tagProps = h.listingId
                  ? { to: `/listing/${h.listingId}` }
                  : h.link
                    ? { href: h.link, target: "_blank", rel: "noopener noreferrer" }
                    : {};
                const linked = !!(h.listingId || h.link);
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
                    {linked && (
                      h.listingId
                        ? <ChevronRight size={18} color={C.primary} style={{ flexShrink: 0 }} />
                        : <ArrowUpRight size={18} color={C.primary} style={{ flexShrink: 0 }} />
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

  const detailRows: { Icon?: any; label: React.ReactNode; value: React.ReactNode; href?: string; external?: boolean; compact?: boolean }[] = [];
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
                <span style={{
                  flexShrink: 0, width: 20, height: 20, borderRadius: 999,
                  background: "#f5f0e8", display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Calendar size={11} strokeWidth={1.75} color={C.primary} />
                </span>
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
    if (dateDisplay) detailRows.push({ Icon: Calendar, label: "Date", value: dateDisplay, compact: true });
    if (timeDisplay) detailRows.push({ Icon: Clock, label: "Time", value: timeDisplay, compact: true });
  }
  if (e.recurrence && e.recurrence.trim().toLowerCase() !== "none" && !isMultiPerformance) {
    detailRows.push({ Icon: RotateCcw, label: "Recurrence", value: e.recurrence, compact: true });
  }
  if (notes.length > 0) {
    detailRows.push({
      Icon: NotebookPen,
      label: "Notes",
      compact: notes.length === 1,
      value: notes.length === 1 ? (
        <span style={{ whiteSpace: "pre-line" }}>{notes[0]}</span>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {notes.map((n, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{
                flexShrink: 0, width: 6, height: 6, borderRadius: 999,
                background: C.primary, marginTop: 8,
              }} />
              <span style={{ whiteSpace: "pre-line", flex: 1, minWidth: 0, fontFamily: FONT, fontSize: 14, fontWeight: 400, color: C.text }}>{n}</span>
            </div>
          ))}
        </div>
      ),
    });
  }


  const allPhones = collectContacts(contactPhone, (e as any).additional_phones);
  const allWhatsapps = collectContacts(contactWhatsApp, (e as any).additional_whatsapps);
  const allEmails = collectContacts(contactEmail, (e as any).additional_emails);

  const contactRows: { Icon?: any; label: React.ReactNode; value: React.ReactNode; href?: string; external?: boolean; disabled?: boolean }[] = [];
  allPhones.forEach((p, i) => contactRows.push({ Icon: Phone, label: i === 0 ? "Phone" : `Phone ${i + 1}`, value: formatSAPhone(p), href: `tel:${p.replace(/\s/g, "")}` }));
  allWhatsapps.forEach((w, i) => {
    const clean = w.replace(/[^0-9]/g, "");
    contactRows.push({ Icon: WhatsAppIcon, label: i === 0 ? "WhatsApp" : `WhatsApp ${i + 1}`, value: "Chat on WhatsApp", href: `https://wa.me/${clean}`, external: true });
  });
  allEmails.forEach((em, i) => contactRows.push({ Icon: Mail, label: i === 0 ? "Email" : `Email ${i + 1}`, value: em, href: `mailto:${em}`, external: true }));
  if (socialLink) {
    const isFb = /facebook\.com|fb\.com/i.test(socialLink);
    const isIg = /instagram\.com/i.test(socialLink);
    const SocialIcon = isFb ? FacebookIcon : isIg ? InstagramIcon : Globe;
    const defaultLabel = isFb ? "Facebook" : isIg ? "Instagram" : "Website";
    contactRows.push({ Icon: SocialIcon, label: socialLabel || defaultLabel, value: socialLabel || socialLink, href: socialLink, external: true });
  }
  if (bookingLink) contactRows.push({ Icon: ExternalLink, label: bookingLinkLabel || "Booking link", value: bookingLinkLabel || bookingLink, href: bookingLink, external: true, disabled: isPast });

  const includedItems: string[] = Array.isArray((e as any).included) ? (e as any).included.filter((s: string) => s && s.trim()) : [];
  const hasPricingCard = !!price || priceNotes.length > 0 || includedItems.length > 0;

  const renderRowsCard = (rows: typeof detailRows) => (
    <div style={{ ...cardStyle, overflow: "hidden" }}>
      {rows.map((r, i) => {
        const rowStyle: React.CSSProperties = {
          padding: 18,
          borderBottom: i < rows.length - 1 ? `1px solid ${C.divider}` : undefined,
          textDecoration: "none", display: "block", color: "inherit",
        };
        if (r.compact) {
          const inner = (
            <>
              {r.Icon && <r.Icon size={18} strokeWidth={1.5} color={C.primary} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted }}>{r.label}</div>
                <div style={{ fontSize: 14, fontWeight: 400, color: C.heading, wordBreak: "break-word" }}>{r.value}</div>
              </div>
              {r.href && <ArrowUpRight size={16} color={C.muted} />}
            </>
          );
          const compactStyle: React.CSSProperties = {
            ...rowStyle,
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "14px 16px",
          };
          if (r.href) {
            return (
              <a key={i} href={r.href} {...(r.external ? { target: "_blank", rel: "noopener noreferrer" } : {})} style={compactStyle}>
                {inner}
              </a>
            );
          }
          return (
            <div key={i} style={compactStyle}>
              {inner}
            </div>
          );
        }
        const header = (
          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 4, position: "relative", marginBottom: 6 }}>
            {r.Icon && <r.Icon size={16} strokeWidth={1.5} color={C.primary} />}
            <h3 style={{
              ...type.eyebrow, margin: 0, flex: 1,
            }}>{r.label}</h3>
            {r.href && <ArrowUpRight size={16} color={C.muted} />}
          </div>
        );
        const body = (
          <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 400, color: C.heading, wordBreak: "break-word" }}>
            {r.value}
          </div>
        );
        if (r.href) {
          return (
            <a key={i} href={r.href} {...(r.external ? { target: "_blank", rel: "noopener noreferrer" } : {})} style={rowStyle}>
              {header}
              {body}
            </a>
          );
        }
        return <div key={i} style={rowStyle}>{header}{body}</div>;
      })}
    </div>
  );


  const sectionHeading = (label: string) => (
    <h2 style={{ ...headStyle, margin: "0 0 14px" }}>{label}</h2>
  );

  const renderDetails = () => (
    <div style={{ padding: "16px 20px 20px" }}>
      {detailRows.length === 0 && !hasPricingCard ? (
        <p style={{ ...paraStyle, color: C.muted, textAlign: "center", marginTop: 40 }}>No additional details yet.</p>
      ) : (
        <>
          {detailRows.length > 0 && (
            <>
              {sectionHeading("Event Details")}
              {renderRowsCard(detailRows)}
            </>
          )}
          {hasPricingCard && (
            <div style={{ marginTop: detailRows.length > 0 ? 20 : 0 }}>
              {sectionHeading("Pricing")}
              <div style={{ ...cardStyle, overflow: "hidden" }}>
                {(() => {
                  const sections: { Icon: any; label: string; body: React.ReactNode; compact?: boolean }[] = [];
                  if (price) {
                    sections.push({
                      Icon: Banknote, label: "Price", compact: true,
                      body: <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 400, color: C.heading, wordBreak: "break-word" }}>{price}</div>,
                    });
                  }
                  if (priceNotes.length > 0) {
                    sections.push({
                      Icon: ReceiptText, label: "Price Notes", compact: priceNotes.length === 1,
                      body: priceNotes.length === 1 ? (
                        <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 400, color: C.text, wordBreak: "break-word" }}>{priceNotes[0]}</div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {priceNotes.map((note, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                              <span style={{ flexShrink: 0, width: 6, height: 6, borderRadius: 999, background: C.primary, marginTop: 8 }} />
                              <div style={{ flex: 1, minWidth: 0, fontFamily: FONT, fontSize: 14, fontWeight: 400, color: C.text, wordBreak: "break-word" }}>{note}</div>
                            </div>
                          ))}
                        </div>
                      ),
                    });
                  }
                  if (includedItems.length > 0) {
                    sections.push({
                      Icon: Check, label: "What's Included",
                      body: (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {includedItems.map((item, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 999, background: "#f5f0e8", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                                <Check size={14} strokeWidth={2} color={C.primary} />
                              </span>
                              <div style={{ flex: 1, minWidth: 0, fontFamily: FONT, fontSize: 14, fontWeight: 400, color: C.heading, wordBreak: "break-word" }}>{item}</div>
                            </div>
                          ))}
                        </div>
                      ),
                    });
                  }
                  return sections.map((s, i) => {
                    const isLast = i === sections.length - 1;
                    if (s.compact) {
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderBottom: isLast ? undefined : `1px solid ${C.divider}` }}>
                          <s.Icon size={18} strokeWidth={1.5} color={C.primary} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 11, fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted }}>{s.label}</div>
                            <div style={{ fontSize: 14, fontWeight: 400, color: C.heading, wordBreak: "break-word" }}>{s.body}</div>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={i} style={{ padding: 18, borderBottom: isLast ? undefined : `1px solid ${C.divider}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 4, position: "relative", marginBottom: 6 }}>
                          <s.Icon size={16} strokeWidth={1.5} color={C.primary} />
                          <h3 style={{ ...type.eyebrow, margin: 0, flex: 1 }}>{s.label}</h3>
                        </div>
                        {s.body}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderContact = () => (
    <div style={{ padding: "16px 20px 20px" }}>
      {contactRows.length === 0 ? (
        <p style={{ ...paraStyle, color: C.muted, textAlign: "center", marginTop: 40 }}>No contact details yet.</p>
      ) : (
        <>
          {sectionHeading("Contact")}
          <div style={{ ...cardStyle, padding: "4px 20px" }}>
            {contactRows.map((r, i) => {
              const inner = (
                <>
                  <r.Icon size={18} strokeWidth={1.5} color={r.disabled ? C.muted : C.primary} />
                  <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 400, color: r.disabled ? C.muted : C.heading, wordBreak: "break-word" }}>
                    {r.value}
                  </div>
                  {r.href && <ArrowUpRight size={16} color={C.muted} />}
                </>
              );
              const style: React.CSSProperties = {
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 0", textDecoration: "none",
                borderTop: i === 0 ? "none" : `1px solid ${C.divider}`,
                opacity: r.disabled ? 0.5 : 1,
              };
              if (r.href && !r.disabled) {
                return (
                  <a key={i} href={r.href} {...(r.external ? { target: "_blank", rel: "noopener noreferrer" } : {})} style={style}>
                    {inner}
                  </a>
                );
              }
              return <div key={i} style={{ ...style, cursor: r.disabled ? "not-allowed" : "default" }} aria-disabled={r.disabled || undefined}>{inner}</div>;
            })}
          </div>
        </>
      )}
    </div>
  );


  const renderGallery = () => (
    <div style={{ padding: "16px 20px 20px" }}>
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
    const addressText = event.location || event.title;
    const mapHref = directionsHref || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressText)}`;

    const copyAddress = async () => {
      const outcome = await sharePlainText(addressText);
      if (outcome === "copied") toast.success("Address copied");
      if (outcome === "failed") toast.error("Couldn't copy the address");
    };

    // One row of the directions / address card: circled icon, label + value, arrow.
    const LocationRow = ({
      Icon, label, value, onClick, href, first,
    }: {
      Icon: any; label: string; value: string; onClick?: () => void; href?: string; first?: boolean;
    }) => {
      const inner = (
        <>
          <span style={{
            width: 40, height: 40, borderRadius: "50%", background: C.soft,
            display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Icon size={17} strokeWidth={1.75} color={C.primary} />
          </span>
          <span style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
            <span style={{
              ...type.label, display: "block", marginBottom: 3,
            }}>
              {label}
            </span>
            <span style={{ display: "block", fontFamily: FONT, fontSize: 15, color: C.heading, wordBreak: "break-word" }}>
              {value}
            </span>
          </span>
          {href && <ArrowUpRight size={16} color={C.muted} style={{ flexShrink: 0 }} />}
        </>
      );
      const rowStyle: React.CSSProperties = {
        display: "flex", alignItems: "center", gap: 14, width: "100%",
        padding: "16px 0", textDecoration: "none",
        background: "none", border: "none", cursor: "pointer",
        borderTop: first ? "none" : `1px solid ${C.divider}`,
      };
      return href
        ? <a href={href} target="_blank" rel="noopener noreferrer" style={rowStyle}>{inner}</a>
        : <button type="button" onClick={onClick} style={rowStyle}>{inner}</button>;
    };

    return (
      <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ ...cardStyle, padding: isSurrounds ? "20px 22px" : 0, overflow: "hidden" }}>
          {isSurrounds ? (
            <div style={{ fontFamily: FONT, fontSize: 15, color: C.heading }}>
              Hoedspruit &amp; Surrounds
            </div>
          ) : (
            <>
              <div style={{ borderRadius: "16px 16px 0 0", overflow: "hidden" }}>
                <LocationMap
                  coords={mapPlace?.coords ?? null}
                  precise={mapPlace?.precise ?? true}
                  href={mapHref}
                  label={event.title}
                  pinColor={C.primary}
                />
              </div>
              <div style={{ padding: "14px 20px 16px" }}>
                {event.location && (
                  <div style={type.cardTitleL}>
                    {event.location}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {!isSurrounds && (
          <div style={{ ...cardStyle, padding: "0 20px" }}>
            <LocationRow first Icon={Navigation} label="Directions" value="Open in Google Maps" href={mapHref} />
            <LocationRow Icon={Copy} label="COPY ADDRESS" value={addressText} onClick={copyAddress} />
          </div>
        )}
      </div>
    );
  };


  return (
    <div style={{ minHeight: "100vh", background: C.bg, paddingBottom: !isPast && actions.length > 0 ? 190 : 100, fontFamily: FONT, color: C.text }}>
      <Seo
        title={`${event.title} — Hello Hoedspruit`}
        description={
          ((event as any).description ? String((event as any).description).replace(/<[^>]*>/g, "").trim() : "") ||
          `${event.title} in Hoedspruit. Event details, dates and how to book on Hello Hoedspruit.`
        }
        path={`/events/${event.id}`}
        image={eventImage(event, "detail") || undefined}
        type="article"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Event",
          name: event.title,
          description: (event as any).description
            ? String((event as any).description).replace(/<[^>]*>/g, "").trim().slice(0, 500)
            : undefined,
          image: eventImage(event, "detail") || undefined,
          startDate: (event as any).start_date || (event as any).date || undefined,
          endDate: (event as any).end_date || undefined,
          eventStatus: "https://schema.org/EventScheduled",
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
          location: {
            "@type": "Place",
            name: (event as any).venue || (event as any).location || "Hoedspruit",
            address: {
              "@type": "PostalAddress",
              streetAddress: (event as any).address || undefined,
              addressLocality: "Hoedspruit",
              addressCountry: "ZA",
            },
          },
          url: `https://hello-hoedspruit-hub.lovable.app/events/${event.id}`,
        }}
      />
      {/* Hero (4:3) with floating action buttons */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3", background: "#DDD6C0", overflow: "hidden" }}>
        {eventImage(event, "detail") && (
          <img src={eventImage(event, "detail")!} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />

        )}
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          style={{
            ...floatBtn,
            position: "absolute",
            top: "var(--overlay-top)",
            left: 16,
            zIndex: 2,
          }}
        >
          <BackArrowIcon size={20} color={C.heading} />
        </button>
        <div style={{
          position: "absolute",
          top: "var(--overlay-top)",
          right: 16,
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <button onClick={handleShare} aria-label="Share" style={floatBtn}>
            <Share2 size={20} strokeWidth={1.6} color={C.heading} />
          </button>
          <button onClick={handleToggleFavourite} aria-label={isFavourited ? "Unsave" : "Save"} style={floatBtn}>
            <Heart size={20} strokeWidth={2} color={isFavourited ? "#715a3d" : C.primary} fill={isFavourited ? "#715a3d" : "none"} />
          </button>
          {isAdmin && (
            <button onClick={() => setEditOpen(true)} aria-label="Edit" style={floatBtn}>
              <Pencil size={18} strokeWidth={1.6} color={C.heading} />
            </button>
          )}
        </div>
      </div>

      {/* Title sheet — overlaps the hero with a rounded top edge */}
      <div style={{
        position: "relative",
        zIndex: 3,
        background: C.surface,
        borderRadius: "28px 28px 0 0",
        marginTop: -28,
        padding: "22px 20px 0",
      }}>
        {allTags.length > 0 && (
          <div style={categoryLineStyle}>
            {allTags.map((t, i) => (
              <span key={i}>
                {i > 0 && <span style={{ color: C.accent, margin: "0 6px" }}>·</span>}
                {t.text}
              </span>
            ))}
          </div>
        )}

        <h1
          data-no-title-case={(event as any).title_override?.trim() ? "true" : undefined}
          style={{
            ...type.pageTitle, margin: 0,
          }}
        >
          {(event as any).title_override?.trim()
            ? <span data-no-title-case="true">{(event as any).title_override}</span>
            : event.title}
        </h1>

        {dateDisplay && (
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <span style={{
              width: 8, height: 8, borderRadius: 999, flexShrink: 0,
              background: isPast ? C.muted : "#2b7f3f",
            }} />
            <span style={{
              fontSize: 13, fontWeight: 600, letterSpacing: "0.01em",
              color: isPast ? C.muted : "#2b7f3f",
            }}>
              {isPast ? "Event has passed" : "Upcoming"}
            </span>
            <span style={{ fontSize: 13, color: MUTED }}>· {dateDisplay}</span>
          </div>
        )}

        {timeDisplay && (
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6, ...type.meta }}>
            <Clock size={14} color={MUTED} strokeWidth={1.75} style={{ flexShrink: 0 }} />
            <span>{timeDisplay}</span>
          </div>
        )}

        {event.location && (
          <a
            href={directionsHref || undefined}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              marginTop: 8, ...metaRow,
              alignItems: "center",
              ...type.meta, textDecoration: "none",
            }}
          >
            <MapPin size={14} color={MUTED} strokeWidth={1.75} style={{ flexShrink: 0, alignSelf: "center" }} />
            <span>{event.location}</span>
          </a>
        )}
      </div>

      {(() => {
        const hasAboutContent = !!(e.description?.trim() || e.hosted_by_name || e.hosted_by_name_2 || e.hosted_by_name_3);
        const hasContactContent = contactRows.length > 0;
        return (
          <>
            <nav style={{
              position: "sticky", top: 0, zIndex: 30,
              background: C.surface, borderBottom: "1px solid rgba(112,90,61,0.14)",
              display: "flex", padding: "12px 12px 0",
              overflowX: "auto",
            }}>
              {hasAboutContent && <TabBtn k="about" label="About" />}
              <TabBtn k="details" label="Details" />
              {hasContactContent && <TabBtn k="contact" label="Contact" />}
              {galleryImages.length > 0 && <TabBtn k="gallery" label="Gallery" />}
              <TabBtn k="location" label="Location" />
            </nav>

            <section style={{ background: C.bg }}>
              {tab === "about" && hasAboutContent && renderAbout()}
              {tab === "details" && renderDetails()}
              {tab === "contact" && hasContactContent && renderContact()}
              {tab === "gallery" && galleryImages.length > 0 && renderGallery()}
              {tab === "location" && renderLocation()}
            </section>
          </>
        );
      })()}


      {/* Fixed action bar, parked just above the bottom nav. BottomNav is
          `74px + var(--safe-bottom)` tall (it grows for the home-indicator
          inset) and sits at bottom:0, so this has to clear that same amount
          or the home indicator on taller-inset phones pushes the nav up into
          it and clips it — a bare "84" ignored the inset entirely. */}
      {!isPast && actions.length > 0 && (
        <div style={{
          position: "fixed",
          bottom: "calc(74px + var(--safe-bottom) + 10px)",
          left: "50%", transform: "translateX(-50%)",
          zIndex: 40, width: "100%", maxWidth: 480,
          padding: "0 14px", boxSizing: "border-box",
          display: "flex", gap: 8,
        }}>
          {actions.map((a) => <ActionBtn key={a.key} a={a} />)}
        </div>
      )}

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
