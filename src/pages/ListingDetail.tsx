import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Star, Pencil, Heart, Share2, Check, X as XIcon, Phone, Send,
  Mail, Globe, ArrowUpRight, MapPin, Navigation, ChevronRight, Clock, Flag, Copy,
  Sparkles, Coffee, Car, HeartPulse, BedDouble, PawPrint, Users, Banknote,
  ShoppingBag, CreditCard, Package, MessageCircleMore, Calendar, Wrench, Leaf,
  Tag, ClipboardList, Baby, Accessibility, Home, Sofa, Utensils, Soup, Music, Wine,
  CalendarDays,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRequireAuth } from "@/hooks/useGuestAuth";
import { useShare } from "@/hooks/useShare";
import { sharePlainText } from "@/lib/share";
import { useIsFavourited, useToggleFavourite } from "@/hooks/useFavourites";
import { isRestaurantCategory, isShoppingCategory, isAccommodationCategory, isNGOCategory, isTradesCategory, isHomeGardenCategory, isWeddingsEventsCategory, isWellnessBeautyCategory } from "@/lib/categoryFields";
import BottomNav from "@/components/BottomNav";
import ImageLightbox from "@/components/ImageLightbox";
import { toast } from "sonner";
import { getWeekPublicHolidays, holidayHoursNote, getSADate } from "@/lib/southAfricaHolidays";
import { sanitizeDashes } from "@/lib/sanitizeListing";
import { formatSAPhone } from "@/lib/formatPhone";
import { collectContacts, isUsableSocialLink, isUsableWebsite, websiteHref, websiteKind } from "@/lib/contacts";
import { formatServiceLabel } from "@/lib/serviceLabels";
import BackArrowIcon from "@/components/ui/BackArrowIcon";
import LocationMap from "@/components/LocationMap";
import {
  resolveLocation,
  HOEDSPRUIT_CENTRE,
  type MappableRow,
  type ResolvedLocation,
} from "@/lib/tileMap";
import { formatEventDateRange, getEventSortDate } from "@/lib/eventDates";
import { DISPLAY_SECTIONS, resolveSectionMode, type DisplayMode } from "@/lib/detailsDisplayModes";
import { getCustomIcon } from "@/lib/customIcons";
import { renderListingRichText } from "@/lib/listingRichText";
import { getSpecialBadge } from "@/lib/specialBadge";
import Seo from "@/components/Seo";
import { Skeleton } from "@/components/ui/skeleton";
import { MUTED, tab as tabStyle, type, metaRow, metaIcon, metaIconSolid } from "@/lib/type";


const WhatsAppIcon = ({ size = 20, color = C.primary, ...props }: { size?: number; color?: string } & React.SVGProps<SVGSVGElement>) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true" {...props}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.693.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.83 9.83 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.82 11.82 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413Z" />
  </svg>
);

const FacebookIcon = ({ size = 20, color = C.primary, ...props }: { size?: number; color?: string } & React.SVGProps<SVGSVGElement>) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
  </svg>
);

const InstagramIcon = ({ size = 20, color = C.primary, ...props }: { size?: number; color?: string } & React.SVGProps<SVGSVGElement>) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true" {...props}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163C8.741 0 8.332.014 7.052.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const HEAD = "'Nohemi', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Design tokens
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
  open: "#2b7f3f",
  closed: "#B05B3F",
  // Soft panel that sits on the beige sheet (suggest-an-edit, icon circles)
  soft: "#EEE9DA",
  softBorder: "rgba(112,90,61,0.16)",
};

// Anything that renders like a lucide icon (including our own WhatsApp / social SVGs).
type IconComp = React.ComponentType<{ size?: string | number; strokeWidth?: string | number; color?: string; style?: React.CSSProperties }>;

// Content cards on the beige sheet: white, generously rounded, no hairline.
const cardStyle: React.CSSProperties = {
  background: C.surface,
  borderRadius: 20,
  border: "none",
};


const pressScale = (s = "0.98") => ({
  onPointerDown: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = `scale(${s})`),
  onPointerUp: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
  onPointerLeave: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
});

const toTitleCase = (s: string) =>
  s.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

const SMALL_WORDS_DETAILS = new Set(["of", "for", "from", "to", "by", "a", "an"]);
const formatDetailLabel = (s: string): string => {
  if (!s) return s;
  const parts = s.split(/(\s+)/);
  let firstIdx = -1;
  for (let i = 0; i < parts.length; i++) { if (parts[i].trim()) { firstIdx = i; break; } }
  return parts.map((p, i) => {
    if (!p.trim()) return p;
    const lower = p.toLowerCase();
    
    // Special cases
    if (lower === "wifi") return "WiFi";
    if (lower === "(free)") return "(Free)";
    if (lower === "wifi(free)") return "WiFi (Free)";

    const cleaned = lower.replace(/[^a-z']/g, "");
    if (i !== firstIdx && SMALL_WORDS_DETAILS.has(cleaned)) return lower;
    
    // Handle words starting with punctuation like (
    if (p.startsWith("(")) {
      return "(" + lower.charAt(1).toUpperCase() + lower.slice(2);
    }
    
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }).join("");
};

type TabKey = "about" | "contact" | "details" | "specials" | "events" | "gallery" | "location";

const ListingDetail = () => {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromCategoryState = (location.state as { fromCategory?: string } | null)?.fromCategory;
  const fromCategoryQuery = new URLSearchParams(location.search).get("from") || undefined;
  const fromCategory = fromCategoryState || fromCategoryQuery;
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<TabKey>("about");
  const [detailsCatTab, setDetailsCatTab] = useState<string | null>(null);
  
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [suggestEditOpen, setSuggestEditOpen] = useState(false);
  const [mapPlace, setMapPlace] = useState<ResolvedLocation | null>(null);
  const [heroImgError, setHeroImgError] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [descOverflows, setDescOverflows] = useState(false);
  const descRef = useRef<HTMLDivElement>(null);

  const { data: listing, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["listing-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("listings").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data ? sanitizeDashes(data) : null;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (!listing) return;
    setMapPlace(null);
    let cancelled = false;
    const row = listing as MappableRow;
    resolveLocation({
      latitude: row.latitude,
      longitude: row.longitude,
      googleMapsLink: row.google_maps_link,
      location: listing.location,
      title: listing.title,
    })
      .then((place) => { if (!cancelled) setMapPlace(place); })
      .catch(() => { if (!cancelled) setMapPlace({ coords: HOEDSPRUIT_CENTRE, precise: false }); });
    return () => { cancelled = true; };
  }, [listing]);

  const { data: listingCategories } = useQuery({
    queryKey: ["listing-detail-categories", id],
    queryFn: async () => {
      const { data: junctions } = await supabase.from("listing_categories").select("category_id").eq("listing_id", id!);
      if (!junctions || junctions.length === 0) return [];
      const catIds = junctions.map((j: any) => j.category_id);
      const { data: cats } = await supabase.from("categories").select("id, title").in("id", catIds);
      return cats ?? [];
    },
    enabled: !!id,
  });

  const { data: listingSubcategories } = useQuery({
    queryKey: ["listing-detail-subcategories", id],
    queryFn: async () => {
      const { data: junctions } = await supabase.from("listing_subcategories").select("subcategory_id").eq("listing_id", id!);
      if (!junctions || junctions.length === 0) return [];
      const subIds = junctions.map((j: any) => j.subcategory_id);
      const { data: subs } = await supabase.from("subcategories").select("id, title").in("id", subIds);
      return subs ?? [];
    },
    enabled: !!id,
  });


  const { data: relatedSpecials } = useQuery({
    queryKey: ["listing-detail-specials", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("specials")
        .select("id,title,badge_override,day_of_week,discount_type,discount_value,freebie_text,card_deal_text,image_url,valid_from,valid_until")
        .eq("business_id", id!)
        .eq("is_active", true);
      const today = new Date().toISOString().slice(0, 10);
      return (data ?? []).filter((s: any) => !s.valid_until || s.valid_until >= today);
    },
    enabled: !!id,
  });

  const { data: relatedEvents } = useQuery({
    queryKey: ["listing-detail-events", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("id,title,date,start_date,end_date,start_time,image_url,location")
        .eq("business_id", id!);
      const today = new Date().toISOString().slice(0, 10);
      return (data ?? []).filter((e: any) => {
        if (e.end_date) return e.end_date >= today;
        if (e.start_date) return e.start_date >= today;
        return true; // free-text date — keep
      });
    },
    enabled: !!id,
  });

  const isFavourited = useIsFavourited(id!, "listing");
  const toggleFavourite = useToggleFavourite();

  const { data: displayDefaults } = useQuery({
    queryKey: ["details-display-defaults"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_content")
        .select("content")
        .eq("section", "details_display_defaults")
        .maybeSingle();
      return ((data?.content as any)?.defaults ?? {}) as Record<string, "yes_only" | "all">;
    },
  });

  const requireAuth = useRequireAuth();
  const share = useShare();

  const handleToggleFavourite = () => {
    // Guests get a dismissable bottom sheet, not a full-screen redirect.
    if (!requireAuth("save favourites")) return;
    toggleFavourite.mutate({ itemId: id!, itemType: "listing", currentlyFavourited: isFavourited });
    toast.success(isFavourited ? "Removed from saved" : "Saved!");
  };

  // Opens the phone's own share sheet (copy link + the user's apps); falls back
  // to the in-app sheet on desktop browsers that have none.
  const handleShare = () => {
    share({
      title: listing?.title || "Hello Hoedspruit",
      text: listing?.description || undefined,
      url: `/listing/${id}`,
    });
  };

  useEffect(() => {
    const hasS = (relatedSpecials?.length ?? 0) > 0;
    const hasE = (relatedEvents?.length ?? 0) > 0;
    const hasG = ((listing as any)?.gallery_images?.length ?? 0) > 0;
    const keys: TabKey[] = ["about", "contact", "details", ...(hasS ? ["specials" as TabKey] : []), ...(hasE ? ["events" as TabKey] : []), ...(hasG ? ["gallery" as TabKey] : []), "location"];
    if (!keys.includes(tab)) setTab("about");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relatedSpecials, relatedEvents, listing, tab]);

  // Does the description need a "Read more"? Measured rather than guessed at a
  // character count, so short-but-tall copy (headings, lists) clamps correctly.
  useLayoutEffect(() => {
    if (descExpanded) return;
    const el = descRef.current;
    if (!el) { setDescOverflows(false); return; }
    setDescOverflows(el.scrollHeight - el.clientHeight > 8);
  }, [listing, tab, descExpanded]);

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, fontFamily: FONT, color: C.text, paddingBottom: 100 }}>
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
        <div style={{ padding: "16px 20px 0" }}>
          <Skeleton style={{ width: "100%", height: 260, borderRadius: 20, background: "rgba(0,0,0,0.06)" }} />
          <Skeleton style={{ width: "70%", height: 28, borderRadius: 8, marginTop: 20, background: "rgba(0,0,0,0.06)" }} />
          <Skeleton style={{ width: "45%", height: 14, borderRadius: 6, marginTop: 12, background: "rgba(0,0,0,0.06)" }} />
          <Skeleton style={{ width: "55%", height: 14, borderRadius: 6, marginTop: 8, background: "rgba(0,0,0,0.06)" }} />
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <Skeleton style={{ flex: 1, height: 44, borderRadius: 999, background: "rgba(0,0,0,0.06)" }} />
            <Skeleton style={{ flex: 1, height: 44, borderRadius: 999, background: "rgba(0,0,0,0.06)" }} />
            <Skeleton style={{ flex: 1, height: 44, borderRadius: 999, background: "rgba(0,0,0,0.06)" }} />
          </div>
          <Skeleton style={{ width: "100%", height: 120, borderRadius: 16, marginTop: 20, background: "rgba(0,0,0,0.06)" }} />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, fontFamily: FONT, color: C.text, paddingBottom: 100 }}>
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
        <div style={{ padding: "80px 24px", textAlign: "center" }}>
          <h2 style={{ fontFamily: HEAD, fontSize: 22, fontWeight: 550, color: C.heading, margin: "0 0 10px" }}>
            Something went wrong
          </h2>
          <p style={{ fontFamily: FONT, fontSize: 14, color: C.muted, margin: "0 0 24px", lineHeight: 1.5 }}>
            We couldn't load this listing. Please check your connection and try again.
          </p>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            style={{
              background: "#423324", color: "#fff", border: "none", borderRadius: 999,
              height: 48, padding: "0 28px", fontFamily: FONT, fontSize: 14, fontWeight: 500,
              cursor: isFetching ? "default" : "pointer", opacity: isFetching ? 0.6 : 1,
            }}
          >
            {isFetching ? "Trying…" : "Try again"}
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!listing) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, fontFamily: FONT, color: C.text, paddingBottom: 100 }}>
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
        <div style={{ padding: "80px 24px", textAlign: "center" }}>
          <h2 style={{ fontFamily: HEAD, fontSize: 22, fontWeight: 550, color: C.heading, margin: "0 0 10px" }}>
            Listing not found
          </h2>
          <p style={{ fontFamily: FONT, fontSize: 14, color: C.muted, margin: "0 0 24px", lineHeight: 1.5 }}>
            This listing may have been removed or the link is out of date.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 260, margin: "0 auto" }}>
            <button
              onClick={() => navigate("/")}
              style={{
                background: "#423324", color: "#fff", border: "none", borderRadius: 999,
                height: 48, padding: "0 24px", fontFamily: FONT, fontSize: 14, fontWeight: 500, cursor: "pointer",
              }}
            >
              Back to home
            </button>
            <button
              onClick={() => navigate("/categories")}
              style={{
                background: "transparent", color: "#1A1A1A", border: "1px solid #E8E4DF", borderRadius: 999,
                height: 48, padding: "0 24px", fontFamily: FONT, fontSize: 14, fontWeight: 500, cursor: "pointer",
              }}
            >
              Browse listings
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }


  // ----- Derived data -----
  const firstCategory = listingCategories && listingCategories.length > 0 ? listingCategories[0] : null;
  const isListingRestaurant = listingCategories?.some((c) => isRestaurantCategory(c.title)) ?? false;
  const isListingShopping = listingCategories?.some((c) => isShoppingCategory(c.title)) ?? false;
  const isListingAccommodation = listingCategories?.some((c) => isAccommodationCategory(c.title)) ?? false;
  const isListingNGO = listingCategories?.some((c) => isNGOCategory(c.title)) ?? false;
  const isListingTrades = listingCategories?.some((c) => isTradesCategory(c.title)) ?? false;
  const isListingHomeGarden = listingCategories?.some((c) => isHomeGardenCategory(c.title)) ?? false;
  const isListingWeddingsEvents = listingCategories?.some((c) => isWeddingsEventsCategory(c.title)) ?? false;
  const isListingWellnessBeauty = listingCategories?.some((c) => isWellnessBeautyCategory(c.title)) ?? false;
  const l = listing as any;
  const galleryImages = (l.gallery_images as string[] | null) || [];
  const openingHours = l.opening_hours as Record<string, string> | null;
  const hasHours = !isListingAccommodation && openingHours && Object.values(openingHours).some((v) => v);
  const longDescription = l.long_description as string | null;
  const descriptionText = (longDescription || "").trim();
  const whatsappNum = l.whatsapp as string | null;
  const waClean = whatsappNum ? whatsappNum.replace(/[^0-9]/g, "") : null;
  // Contact rows show this instead of the raw WhatsApp number.
  const whatsappCta = ((l.whatsapp_cta_label as string | null) || "").trim() || "Chat on WhatsApp";
  const goodToKnow = ((l.good_to_know as string[] | null) ?? []).map((s) => (s || "").trim()).filter(Boolean);
  // "26km from Town" — shown in the header and on the location tab.
  const kmFromTown = (() => {
    if (!l.km_from_town) return null;
    const n = parseFloat(String(l.km_from_town).replace(",", ".").replace(/[^0-9.]/g, ""));
    const value = Number.isFinite(n) ? (Math.round(n * 100) / 100).toString() : String(l.km_from_town);
    return `${value}km from Town`;
  })();
  const hasGallery = galleryImages.length > 0;
  const hasSpecials = (relatedSpecials?.length ?? 0) > 0;
  const hasEvents = (relatedEvents?.length ?? 0) > 0;

  // Pick the chosen contact for the top action buttons.
  // Index 0 = primary (listing.phone / .email / .whatsapp / .website),
  // index 1+ = corresponding additional_* entry.
  const pickAction = (primary: string | null | undefined, extras: string[] | null | undefined, index: number) => {
    const arr = [primary || "", ...((extras || []) as string[])];
    const safe = Math.max(0, Math.min(index || 0, arr.length - 1));
    const v = (arr[safe] || "").trim();
    return v || (primary || "").trim() || (arr.find((x) => (x || "").trim()) || "");
  };
  const actionPhone = pickAction(listing.phone, l.additional_phones, l.action_phone_index ?? 0);
  const actionEmail = pickAction(listing.email, l.additional_emails, l.action_email_index ?? 0);
  const actionWhatsappRaw = pickAction(whatsappNum, l.additional_whatsapps, l.action_whatsapp_index ?? 0);
  const actionWhatsappClean = actionWhatsappRaw ? actionWhatsappRaw.replace(/[^0-9]/g, "") : "";

  // Websites the listing can actually be linked to, paired with their labels.
  // A placeholder ("-", "N/A") or a note ("coming soon") in the website column
  // means the listing has no website, so it must render nothing at all.
  const websiteEntries = (() => {
    const urls = [listing.website || "", ...(((l.additional_websites as string[] | null) ?? []))];
    const labels = [
      ((l.website_label as string | null) || "").trim(),
      ...((((l as any).additional_website_labels as string[] | null) || []) as string[]).map((s) => (s || "").trim()),
    ];
    const seen = new Set<string>();
    const out: { url: string; label: string }[] = [];
    urls.forEach((raw, i) => {
      const url = (raw || "").trim();
      if (!isUsableWebsite(url)) return;
      const key = url.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ url, label: labels[i] || "" });
    });
    return out;
  })();
  const actionWebsiteRaw = pickAction(listing.website, l.additional_websites, l.action_website_index ?? 0);
  const actionWebsite = isUsableWebsite(actionWebsiteRaw)
    ? actionWebsiteRaw.trim()
    : (websiteEntries[0]?.url ?? "");

  // Own social columns, held to the same test as the website column so a "-" or
  // a note never becomes a dead Facebook link.
  const facebookLink = isUsableSocialLink((l as any).facebook) ? String((l as any).facebook).trim() : "";
  const instagramLink = isUsableSocialLink((l as any).instagram) ? String((l as any).instagram).trim() : "";

  // Category labels, with the category the user arrived from first.
  const categoryChips = (() => {
    const cats = listingCategories ?? [];
    const ordered = fromCategory
      ? [...cats.filter((c) => c.title === fromCategory), ...cats.filter((c) => c.title !== fromCategory)]
      : cats;
    return ordered.map((c) => c.title);
  })();

  const hasContact = !!(listing.email || listing.phone || waClean || websiteEntries.length || facebookLink || instagramLink || ((listing as any).additional_emails?.length) || ((listing as any).additional_phones?.length) || ((listing as any).additional_whatsapps?.length));
  const hasAbout = !!descriptionText;
  const hasLocation = !!(listing.location || mapPlace);

  // ----- Open status -----
  const todayIndex = new Date().getDay();
  const todayLabel = todayIndex === 0 ? "Sunday" : DAY_LABELS[todayIndex - 1];
  const parseTimeStr = (s: string) => {
    const [h, mm] = s.replace(".", ":").trim().split(":");
    return parseInt(h, 10) * 60 + (mm ? parseInt(mm, 10) : 0);
  };
  const formatTime = (s: string) => (s.includes(":") ? s : `${s}:00`);
  type OpenStatus =
    | { state: "open"; closes?: string; alwaysOpen?: boolean }
    | { state: "closed"; opensAt?: string; opensDay?: string }
    | { state: "temporarily_closed" };
  const computeOpenStatus = (): OpenStatus | null => {
    if (!openingHours) return null;
    const rawTodayVal = openingHours[todayLabel.toLowerCase()];
    const todayVal = typeof rawTodayVal === "string" ? rawTodayVal : "";
    if (todayVal && /temporarily\s*closed/i.test(todayVal)) return { state: "temporarily_closed" };
    const findNext = (start: number) => {
      for (let i = start; i < start + 7; i++) {
        const idx = (DAY_LABELS.indexOf(todayLabel) + i) % 7;
        const v = openingHours[DAY_LABELS[idx].toLowerCase()] || "";
        if (!v || v.toLowerCase() === "closed") continue;
        const mm = v.match(/(\d{1,2}[:.]?\d{0,2})\s*[-–]\s*(\d{1,2}[:.]?\d{0,2})/);
        if (!mm) continue;
        return { opensAt: formatTime(mm[1]), opensDay: i === 1 ? "Tomorrow" : DAY_LABELS[idx] };
      }
      return null;
    };
    if (!todayVal || todayVal.toLowerCase() === "closed") return { state: "closed", ...(findNext(1) || {}) };
    if (/always\s*open|24\s*\/?\s*7|24\s*hours?/i.test(todayVal)) return { state: "open", alwaysOpen: true };
    const m = todayVal.match(/(\d{1,2}[:.]?\d{0,2})\s*[-–]\s*(\d{1,2}[:.]?\d{0,2})/);
    if (!m) return { state: "open" };
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    const o = parseTimeStr(m[1]); const c = parseTimeStr(m[2]);
    if (cur >= o && cur <= c) return { state: "open", closes: formatTime(m[2]) };
    if (cur < o) return { state: "closed", opensAt: formatTime(m[1]), opensDay: "Today" };
    return { state: "closed", ...(findNext(1) || {}) };
  };
  const openStatus = computeOpenStatus();

  // ----- Public holidays -----
  // The hours list is this Monday–Sunday, so holidays come from the calendar
  // week we are in: a holiday next Monday belongs to next week's list, not to
  // the Monday row on screen, which stands for the Monday just gone.
  const weekHolidays = getWeekPublicHolidays(getSADate());
  const todayHoliday = Object.values(weekHolidays).find((h) => h.daysAway === 0) || null;

  // ----- Detail sections (flattened from old accordion logic) -----
  type DField = { label: string; on: boolean | string };
  type DSection = { key: string; title: string; fields: DField[]; iconComp?: any };
  const sections: DSection[] = [];
  const filterDefined = (arr: { label: string; value: boolean | string | null }[]): DField[] =>
    arr.filter(f => f.value === true || f.value === false || typeof f.value === "string")
      .map(f => ({ label: f.label, on: f.value as boolean | string }));

  if (l.price_level) {
    const labels: Record<number, string> = { 1: "Budget-friendly", 2: "Mid-Range", 3: "Upscale", 4: "Fine dining" };
    sections.push({ key: "pricing", title: "Pricing", iconComp: Tag,
      fields: [{ label: labels[l.price_level] || "", on: true }] });
  }

  // Distance is no longer a Details card — it sits in the header next to the
  // rating and again under the map on the Location tab.

  if (isListingRestaurant) {
    const known = ["Dine-in", "Takeaway", "Delivery"];
    const norm = (l.service_type || []).map((s: string) => {
      const t = s.trim().toLowerCase();
      if (["take away", "take-away", "takeaway"].includes(t)) return "Takeaway";
      if (["sit down", "sit-down", "dine-in", "dine in"].includes(t)) return "Dine-in";
      return s;
    }).filter((s: string) => !/reservation/i.test(s));
    const svc: DField[] = known.map(k => ({ label: k, on: norm.some((s: string) => s.toLowerCase() === k.toLowerCase()) }));
    norm.forEach((s: string) => { if (!known.some(k => k.toLowerCase() === s.toLowerCase())) svc.push({ label: s, on: true }); });
    if (svc.length) sections.push({ key: "service", title: "Service Options", iconComp: ClipboardList, fields: svc });

    const kids = filterDefined([
      { label: "Good for kids", value: l.good_for_kids },
      { label: "Kids' menu", value: l.kids_menu },
      { label: "High chairs", value: l.high_chairs },
      { label: "Nappy changing station", value: l.nappy_changing_station },
      { label: "Kids playground", value: l.kids_playground },
    ]);
    if (kids.length) sections.push({ key: "kids", title: "Kids & Family", iconComp: Baby, fields: kids });

    const access = filterDefined([
      { label: "Accessible entrance", value: l.wheelchair_entrance },
      { label: "Accessible seating", value: l.wheelchair_seating },
      { label: "Accessible toilet", value: l.wheelchair_toilet },
      { label: "Accessible parking", value: l.wheelchair_car_park },
    ]);
    if (access.length) sections.push({ key: "accessibility", title: "Accessibility", iconComp: Accessibility, fields: access });

    const amen = filterDefined([
      { label: "Toilets", value: l.has_toilet },
      { label: l.has_wifi === true && l.has_free_wifi === true ? "WiFi (Free)" : "WiFi", value: l.has_wifi },
      { label: "Smoking section", value: l.smoking_allowed },
      { label: "Pet friendly", value: l.pets_allowed },
      { label: "Drive-through", value: (l as any).drive_through },
    ]);
    if (amen.length) sections.push({ key: "amenities", title: "Amenities", iconComp: Home, fields: amen });

    const drinks = filterDefined([
      { label: "Wine list", value: l.has_wine_list },
      { label: "Cocktails", value: l.has_cocktails },
      { label: "Craft beer", value: l.has_craft_beer },
      { label: "Smoothies", value: l.has_smoothies },
      { label: "Coffee", value: l.has_coffee },
      { label: "Champagne", value: l.has_champagne },
      { label: "Milkshakes", value: l.has_milkshakes },
      { label: "Mocktails", value: l.has_mocktails },
      { label: "Beers / Ciders", value: l.has_beers_ciders },
      { label: "Iced coffee", value: l.has_iced_coffee },
    ]);
    if (drinks.length) sections.push({ key: "drinks", title: "Drinks", iconComp: Wine, fields: drinks });

    if (l.seating?.length) sections.push({ key: "seating", title: "Seating", iconComp: Sofa, fields: l.seating.map((s: string) => ({ label: toTitleCase(s.replace(/ seating$/i, "")), on: true })) });
    if (l.meal?.length) {
      const mealOrder = ["breakfast", "lunch", "dinner"];
      const sortedMeals = [...l.meal].sort((a: string, b: string) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        const aIndex = mealOrder.indexOf(aLower);
        const bIndex = mealOrder.indexOf(bLower);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return aLower.localeCompare(bLower);
      });
      sections.push({ key: "meals", title: "Meals served", iconComp: Utensils, fields: sortedMeals.map((m: string) => ({ label: toTitleCase(m), on: true })) });
    }
    const CUISINE_HIDE = new Set(["light meals", "pub grub", "breakfast", "farm to fork", "farm food", "bak contemporary", "health bowls", "health food", "fried chicken", "farm-to-fork", "contemporary", "smoked meats", "bakery", "artisan bakery", "gelato", "wraps", "salads", "chicken", "sandwiches", "sandwhiches"]);
    const filteredCuisine = (l.cuisine ?? []).filter((c: string) => !CUISINE_HIDE.has(c.trim().toLowerCase()));
    if (filteredCuisine.length) sections.push({ key: "cuisine", title: "Cuisine", iconComp: Soup, fields: filteredCuisine.map((c: string) => ({ label: toTitleCase(c), on: true })) });
    if ((l as any).foods?.length) sections.push({ key: "foods", title: "Foods", iconComp: Utensils, fields: (l as any).foods.map((f: string) => ({ label: toTitleCase(f), on: true })) });
    if (l.vibe?.length) sections.push({ key: "vibe", title: "Vibe", iconComp: Music, fields: l.vibe.map((v: string) => ({ label: toTitleCase(v), on: true })) });
    if ((l as any).is_franchise === true) sections.push({ key: "business-type", title: "Business Type", iconComp: Home, fields: [{ label: "Franchise", on: true }] });
  }

  if (isListingAccommodation) {
    // Pricing: average price per person per night & price range
    const pricing: { label: string; on: boolean }[] = [];
    const avgPrice = (l as any).avg_price_per_person_per_night;
    if (avgPrice) pricing.push({ label: `Average of ${String(avgPrice).trim()} per person per night`, on: true });
    if (l.price_range) pricing.push({ label: `${String(l.price_range).trim()}`, on: true });
    if (pricing.length) sections.push({ key: "accom-pricing", title: "Pricing", iconComp: Banknote, fields: pricing });

    // Capacity: sleeps & rooms
    const capacity: { label: string; on: boolean }[] = [];
    const sleepsAdults = (l as any).sleeps;
    const sleepsChildren = (l as any).sleeps_children;
    if (sleepsAdults && sleepsChildren) {
      capacity.push({ label: `Sleeps ${sleepsAdults} ${Number(sleepsAdults) === 1 ? "Adult" : "Adults"} and ${sleepsChildren} ${Number(sleepsChildren) === 1 ? "Child" : "Children"}`, on: true });
    } else if (sleepsAdults) {
      capacity.push({ label: `Sleeps ${sleepsAdults} ${Number(sleepsAdults) === 1 ? "Person" : "People"}`, on: true });
    } else if (sleepsChildren) {
      capacity.push({ label: `Sleeps ${sleepsChildren} ${Number(sleepsChildren) === 1 ? "Child" : "Children"}`, on: true });
    }
    if ((l as any).rooms_count) capacity.push({ label: `${(l as any).rooms_count} ${Number((l as any).rooms_count) === 1 ? "Room" : "Rooms"}`, on: true });
    if (capacity.length) sections.push({ key: "accom-capacity", title: "Capacity", iconComp: Users, fields: capacity });

    const breakfastLabel = l.has_breakfast === true
      ? (l.breakfast_included === true ? "Breakfast (Included)"
        : l.breakfast_included === false ? "Breakfast (extra charge)" : "Breakfast")
      : "Breakfast";
    const food = filterDefined([
      { label: "Restaurant", value: l.has_restaurant }, { label: "Bar", value: l.has_bar },
      { label: "Room service", value: l.has_room_service }, { label: breakfastLabel, value: l.has_breakfast },
    ]);
    if (food.length) sections.push({ key: "accom-food", title: "Food & drink", iconComp: Coffee, fields: food });
    const shuttleLabel = l.has_airport_shuttle === true
      ? (l.airport_shuttle_free === true ? "Airport shuttle (Free)"
        : l.airport_shuttle_free === false ? "Airport shuttle (extra charge)" : "Airport shuttle")
      : "Airport shuttle";
    const transport = filterDefined([
      { label: shuttleLabel, value: l.has_airport_shuttle },
      { label: "Free parking", value: l.has_free_parking },
      { label: "Secure parking", value: l.has_secure_parking },
    ]);
    if (transport.length) sections.push({ key: "accom-transport", title: "Transport", iconComp: Car, fields: transport });
    const wellness = filterDefined([
      { label: "Spa", value: l.has_spa }, { label: "Fitness centre", value: l.has_fitness_centre }, { label: "Swimming pool", value: l.has_swimming_pool },
    ]);
    if (wellness.length) sections.push({ key: "accom-wellness", title: "Wellness", iconComp: HeartPulse, fields: wellness });
    const rooms = filterDefined([
      { label: "Aircon", value: l.has_aircon }, { label: "Laundry service", value: l.has_laundry }, { label: "WiFi", value: l.has_wifi_accom },
    ]);
    if (rooms.length) sections.push({ key: "accom-rooms", title: "Rooms", iconComp: BedDouble, fields: rooms });
    if (l.child_friendly === true) sections.push({ key: "accom-children", title: "Children", iconComp: Baby, fields: [{ label: "Child friendly", on: true }] });
    if (l.pets_allowed === true) sections.push({ key: "accom-pets", title: "Pets", iconComp: PawPrint, fields: [{ label: "Pet friendly", on: true }] });
  }

  if (isListingShopping) {
    const shop = filterDefined([
      { label: "Air conditioned", value: l.air_conditioned },
      { label: "Delivery available", value: l.delivery_available },
      { label: "Order online", value: l.order_online },
      { label: "Parking available", value: l.parking_available },
      { label: "Local products", value: l.local_products },
      { label: "Curio / gifts", value: l.curio_or_gifts },
    ]);
    if (shop.length) sections.push({ key: "shop-amenities", title: "Amenities", iconComp: ShoppingBag, fields: shop });
    if (l.payment_methods?.length) sections.push({ key: "shop-payment", title: "Payment", iconComp: CreditCard, fields: l.payment_methods.map((p: string) => ({ label: toTitleCase(p), on: true })) });
    if (l.product_categories?.length) sections.push({ key: "shop-products", title: "Products", iconComp: Package, fields: l.product_categories.map((p: string) => ({ label: toTitleCase(p), on: true })) });
  }

  // Custom rows
  for (let i = 1; i <= 3; i++) {
    const t = (l[`custom_title_${i}`] || "").toString().trim();
    const v = (l[`custom_text_${i}`] || "").toString().trim();
    if (t && v) sections.push({ key: `custom-${i}`, title: t, iconComp: getCustomIcon(null), fields: [{ label: v, on: "__text__" }] });
  }

  if (isListingNGO) {
    [
      { label: "Cause", value: l.cause },
      { label: "Impact", value: l.impact },
      { label: "Ways To Give", value: l.ways_to_give },
      { label: "Volunteering", value: l.volunteering },
      { label: "Visiting", value: l.visiting },
    ].filter((s) => s.value && s.value.trim()).forEach((s) =>
      sections.push({ key: `ngo-${s.label}`, title: s.label, iconComp: Sparkles, fields: [{ label: s.value, on: "__text__" }] })
    );
  }

  if (isListingTrades) {
    let tenureLabel: string | null = null;
    if (l.business_started_year) tenureLabel = `Since ${l.business_started_year}`;
    else if (l.years_in_business) tenureLabel = `${l.years_in_business} ${l.years_in_business === 1 ? "year" : "years"} in business`;
    if (tenureLabel) {
      sections.push({ key: "trades-tenure", title: "In business", iconComp: Calendar, fields: [{ label: tenureLabel, on: true }] });
    }
    const tradesFields: Array<{ label: string; on: any }> = [];
    if (typeof l.after_hours_available === "boolean") tradesFields.push({ label: "After hours available", on: l.after_hours_available });
    if (typeof l.callout_fee === "boolean") tradesFields.push({ label: "Callout fee", on: l.callout_fee });
    if (tradesFields.length) sections.push({ key: "trades-service", title: "Service info", iconComp: MessageCircleMore, fields: tradesFields });
    if (l.specialities && l.specialities.trim()) {
      const items = l.specialities.split(",").map((s: string) => s.trim()).filter(Boolean);
      if (items.length) {
        sections.push({ key: "trades-specialities", title: "Specialities", iconComp: Sparkles, fields: items.map((label: string) => ({ label, on: true })) });
      }
    }
  }


  if (isListingHomeGarden) {
    const services = (l.services_offered as string[] | null) ?? [];
    const plantTypes = (l.plant_types as string[] | null) ?? [];
    if (services.length) {
      sections.push({ key: "hg-services", title: "Services", iconComp: Wrench, fields: services.map((label: string) => ({ label: formatServiceLabel(label), on: true })) });
    }
    if (services.includes("Nursery") && plantTypes.length) {
      sections.push({ key: "hg-plants", title: "Plant types", iconComp: Leaf, fields: plantTypes.map((label: string) => ({ label, on: true })) });
    }
    let tenureLabel: string | null = null;
    if (l.business_started_year) tenureLabel = `Since ${l.business_started_year}`;
    else if (l.years_in_business) tenureLabel = `${l.years_in_business} ${l.years_in_business === 1 ? "year" : "years"} in business`;
    if (tenureLabel) {
      sections.push({ key: "hg-tenure", title: "In business", iconComp: Calendar, fields: [{ label: tenureLabel, on: true }] });
    }
    if (l.specialities && l.specialities.trim()) {
      const items = l.specialities.split(",").map((s: string) => s.trim()).filter(Boolean);
      if (items.length) {
        sections.push({ key: "hg-specialities", title: "Specialities", iconComp: Sparkles, fields: items.map((label: string) => ({ label, on: true })) });
      }
    }
  }

  if (isListingWeddingsEvents) {
    const eventTypes = (l.event_types as string[] | null) ?? [];
    if (eventTypes.length) {
      sections.push({ key: "we-event-types", title: "Event types supported", iconComp: Sparkles, fields: eventTypes.map((label: string) => ({ label, on: true })) });
    }

    const isEventVenue = listingSubcategories?.some((s) => /event\s*venue/i.test(s.title)) ?? false;
    if (isEventVenue) {
      const venueFields: Array<{ label: string; on: any }> = [];
      if (typeof l.venue_onsite_accommodation === "boolean") {
        if (l.venue_onsite_accommodation === true) {
          const sleeps = l.venue_accommodation_sleeps;
          venueFields.push({ label: sleeps ? `On-site accommodation (sleeps ${sleeps})` : "On-site accommodation", on: true });
        } else {
          venueFields.push({ label: "On-site accommodation", on: false });
        }
      }
      if (l.venue_guest_capacity) {
        venueFields.push({ label: `Guest capacity: ${l.venue_guest_capacity}`, on: true });
      }
      if (l.venue_indoor_outdoor && String(l.venue_indoor_outdoor).trim()) {
        venueFields.push({ label: `${l.venue_indoor_outdoor}`, on: true });
      }
      if (venueFields.length) {
        sections.push({ key: "we-venue-info", title: "Venue", iconComp: Sparkles, fields: venueFields });
      }
      const styleTags = (l.venue_style_tags as string[] | null) ?? [];
      if (styleTags.length) {
        sections.push({ key: "we-venue-style", title: "Style", iconComp: Sparkles, fields: styleTags.map((label: string) => ({ label, on: true })) });
      }
      const settingTypes = (l.venue_setting_types as string[] | null) ?? [];
      if (settingTypes.length) {
        sections.push({ key: "we-venue-setting", title: "Setting", iconComp: Sparkles, fields: settingTypes.map((label: string) => ({ label, on: true })) });
      }
    }
  }

  if (isListingWellnessBeauty) {
    const treatments = ((l as any).treatments as string[] | null) ?? [];
    if (treatments.length) {
      sections.push({ key: "wb-treatments", title: "Treatments", iconComp: Sparkles, fields: treatments.map((label: string) => ({ label, on: true })) });
    }
  }



  // Apply per-listing / global "yes only" vs "all" display mode for yes-no cards
  {
    const perListing = ((l as any).details_display_mode ?? {}) as Record<string, DisplayMode | "default">;
    const yesNoKeys = new Set(DISPLAY_SECTIONS.map((s) => s.key));
    for (let i = sections.length - 1; i >= 0; i--) {
      const s = sections[i];
      if (!yesNoKeys.has(s.key)) continue;
      const mode = resolveSectionMode(s.key, perListing, displayDefaults);
      if (mode === "yes_only") {
        s.fields = s.fields.filter((f) => f.on === true);
        if (s.fields.length === 0) sections.splice(i, 1);
      }
    }
  }

  // Sort fields within each section so "true" values appear before "false" values.
  // Strings (text values) keep their relative order before booleans.
  sections.forEach((s) => {
    const rank = (on: boolean | string): number => {
      if (typeof on === "string") return 0;
      return on === true ? 1 : 2;
    };
    s.fields = [...s.fields].sort((a, b) => rank(a.on) - rank(b.on));
  });

  // Move custom rows to the top so they appear above amenity/true-false cards
  const customSections = sections.filter(s => s.key.startsWith("custom-"));
  const otherSections = sections.filter(s => !s.key.startsWith("custom-"));
  sections.length = 0;
  sections.push(...customSections, ...otherSections);

  // Tag each section with its category group so we can build per-category sub-tabs
  type CatGroup = "restaurant" | "accommodation" | "shopping" | "ngo" | "trades" | "homegarden" | "weddings" | "wellness" | "shared";
  const sectionGroup = (key: string): CatGroup => {
    if (key.startsWith("custom-") || key === "pricing") return "shared";
    if (key.startsWith("accom-")) return "accommodation";
    if (key.startsWith("shop-")) return "shopping";
    if (key.startsWith("ngo-")) return "ngo";
    if (key.startsWith("trades-")) return "trades";
    if (key.startsWith("hg-")) return "homegarden";
    if (key.startsWith("we-")) return "weddings";
    if (key.startsWith("wb-")) return "wellness";
    return "restaurant";
  };
  const categoryToGroup = (title: string): CatGroup | null => {
    if (isRestaurantCategory(title)) return "restaurant";
    if (isAccommodationCategory(title)) return "accommodation";
    if (isShoppingCategory(title)) return "shopping";
    if (isNGOCategory(title)) return "ngo";
    if (isTradesCategory(title)) return "trades";
    if (isHomeGardenCategory(title)) return "homegarden";
    if (isWeddingsEventsCategory(title)) return "weddings";
    if (isWellnessBeautyCategory(title)) return "wellness";
    return null;
  };
  // Build category sub-tabs (in the order the listing has them) — only those
  // with actual content. Drop duplicates.
  const seenGroups = new Set<CatGroup>();
  const categoryDetailTabs: { group: CatGroup; label: string }[] = [];
  (listingCategories ?? []).forEach((c: { title: string }) => {
    const g = categoryToGroup(c.title);
    if (!g || seenGroups.has(g)) return;
    if (!sections.some((s) => sectionGroup(s.key) === g)) return;
    seenGroups.add(g);
    categoryDetailTabs.push({ group: g, label: c.title });
  });

  const activeDetailsGroup: CatGroup | null =
    categoryDetailTabs.length > 1
      ? (categoryDetailTabs.find((t) => t.group === detailsCatTab)?.group ?? categoryDetailTabs[0].group)
      : null;

  const visibleSections = activeDetailsGroup
    ? sections.filter((s) => {
        const g = sectionGroup(s.key);
        return g === "shared" || g === activeDetailsGroup;
      })
    : sections;

  const hasDetails = sections.length > 0;
  // Hours no longer has its own tab — it renders inside About.
  const hasAboutTab = hasAbout || goodToKnow.length > 0 || hasHours;
  const visibleTabs: { key: TabKey; label: string }[] = [
    ...(hasAboutTab ? [{ key: "about" as TabKey, label: "About" }] : []),
    ...(hasContact ? [{ key: "contact" as TabKey, label: "Contact" }] : []),
    ...(hasDetails ? [{ key: "details" as TabKey, label: "Details" }] : []),
    ...(hasSpecials ? [{ key: "specials" as TabKey, label: "Specials" }] : []),
    ...(hasEvents ? [{ key: "events" as TabKey, label: "Events" }] : []),
    ...(hasGallery ? [{ key: "gallery" as TabKey, label: "Gallery" }] : []),
    ...(hasLocation ? [{ key: "location" as TabKey, label: "Location" }] : []),
  ];
  // Falls back to the first available tab when the selected one has no content
  // (e.g. a listing with no description, no hours and no "good to know" chips).
  const activeTab: TabKey = visibleTabs.some((t) => t.key === tab) ? tab : (visibleTabs[0]?.key ?? "about");


  // ----- Action buttons (fixed bar above the bottom nav) -----
  // The first action is always rendered as the primary (filled brown) button,
  // matching the events detail page.
  const actions = [
    actionWhatsappClean && {
      key: "whatsapp", label: "WhatsApp", href: `https://wa.me/${actionWhatsappClean}`,
      Icon: WhatsAppIcon, ext: true,
    },
    actionPhone && { key: "call", label: "Call", href: `tel:${actionPhone}`, Icon: Phone, ext: false },
    (l.google_maps_link || listing.location) && {
      key: "directions", label: "Directions",
      href: l.google_maps_link || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.location || listing.title)}`,
      Icon: Send, ext: true,
    },
    // The website slot comes from the website column alone. A listing with no
    // website gets no button here — nothing stands in for it, so an empty
    // website column can never surface as a "Facebook" button in its place.
    (actionWebsite
      ? (websiteKind(actionWebsite) === "facebook"
          ? { key: "website", label: "Facebook", href: websiteHref(actionWebsite), Icon: FacebookIcon, ext: true }
          : websiteKind(actionWebsite) === "instagram"
            ? { key: "website", label: "Instagram", href: websiteHref(actionWebsite), Icon: InstagramIcon, ext: true }
            : { key: "website", label: "Website", href: websiteHref(actionWebsite), Icon: Globe, ext: true })
      : null),
    // If a real website is shown but there's no WhatsApp, surface Facebook (or
    // Instagram) as an extra action. Skipped when the website slot already holds
    // the social page itself, which would just repeat the same button.
    (() => {
      const showsRealWebsite = !!actionWebsite && websiteKind(actionWebsite) === "website";
      if (!showsRealWebsite || actionWhatsappClean) return null;
      if (facebookLink) {
        return { key: "facebook", label: "Facebook", href: websiteHref(facebookLink), Icon: FacebookIcon, ext: true };
      }
      if (instagramLink) {
        return { key: "instagram", label: "Instagram", href: websiteHref(instagramLink), Icon: InstagramIcon, ext: true };
      }
      return null;
    })(),
  ].filter(Boolean) as Array<{ key: string; label: string; href: string; Icon: any; ext: boolean }>;


  // ----- Sub-components -----
  // Stacked icon-over-label tile used in the fixed action bar.
  const ActionBtn = ({ a, i }: { a: typeof actions[number]; i: number }) => {
    const filled = i === 0;
    const fg = filled ? "#FFFFFF" : C.heading;
    return (
      <a
        href={a.href}
        {...(a.ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        style={{
          flex: 1, minWidth: 0,
          display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "12px 6px", borderRadius: 18,
          background: filled ? C.dark : C.surface,
          border: "none",
          color: fg, textDecoration: "none",
          ...type.tabActive,
          boxShadow: filled ? "0 6px 16px rgba(66,51,36,0.28)" : "0 4px 14px rgba(43,36,32,0.10)",
          transition: "transform 150ms ease-out",
        }}
        {...pressScale()}
      >
        <a.Icon size={20} strokeWidth={1.75} color={fg} />
        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{a.label}</span>
      </a>
    );
  };

  const TabBtn = ({ k, label, scrollable }: { k: TabKey; label: string; scrollable?: boolean }) => {
    const active = activeTab === k;
    return (
      <button
        onClick={() => setTab(k)}
        style={{
          ...(scrollable
            ? { flex: "0 0 auto", padding: "14px 12px" }
            : { flex: 1, padding: "14px 4px" }),
          background: "none", border: "none", cursor: "pointer",
          ...tabStyle(active),
          color: active ? C.heading : MUTED,
          borderBottom: `2px solid ${active ? C.heading : "transparent"}`,
          marginBottom: -1,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </button>
    );
  };

  // Card header: small icon + uppercase label, matching the About / Location cards.
  const CardHead = ({ Icon, children, right }: { Icon: IconComp; children: React.ReactNode; right?: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Icon size={17} strokeWidth={1.75} color={C.primary} />
        <h3 style={{
          ...type.eyebrow, margin: 0,
        }}>{children}</h3>
      </div>
      {right}
    </div>
  );

  // ----- Tab content -----
  const renderAbout = () => (
    <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
      {descriptionText && (
        <div style={{ ...cardStyle, padding: "20px 22px" }}>
          <div
            ref={descRef}
            className="ld-richtext"
            style={
              descExpanded || !descOverflows
                ? undefined
                : {
                    maxHeight: 148,
                    overflow: "hidden",
                    WebkitMaskImage: "linear-gradient(to bottom, #000 55%, rgba(0,0,0,0.15) 100%)",
                    maskImage: "linear-gradient(to bottom, #000 55%, rgba(0,0,0,0.15) 100%)",
                  }
            }
          >
            {renderListingRichText(descriptionText)}
          </div>
          {(descOverflows || descExpanded) && (
            <button
              onClick={() => setDescExpanded(!descExpanded)}
              style={{
                marginTop: 10, background: "none", border: "none", padding: 0, cursor: "pointer",
                fontFamily: FONT, fontSize: 15, fontWeight: 700, color: C.primary,
              }}
            >
              {descExpanded ? "Read Less" : "Read More"}
            </button>
          )}
        </div>
      )}

      {goodToKnow.length > 0 && (
        <div style={{ ...cardStyle, padding: "20px 22px" }}>
          <CardHead Icon={Sparkles}>Good to know</CardHead>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {goodToKnow.map((item) => (
              <span
                key={item}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: C.ivory, borderRadius: 999, padding: "9px 15px",
                  fontFamily: FONT, fontSize: 14, color: C.text, lineHeight: 1.2,
                }}
              >
                <Check size={15} strokeWidth={2.25} color={C.primary} style={{ flexShrink: 0 }} />
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {renderHoursCard()}

      <SuggestEditCard onClick={() => setSuggestEditOpen(true)} />
    </div>
  );

  // Opening hours now live inside the About tab rather than a tab of their own.
  const renderHoursCard = () => {
    if (!hasHours) return null;
    const alwaysOpen = openStatus?.state === "open" && openStatus?.alwaysOpen;
    const statusColor = openStatus?.state === "open" ? C.open : C.closed;
    const statusText = openStatus?.state === "open"
      ? "Open Now"
      : openStatus?.state === "temporarily_closed"
        ? "Temporarily Closed"
        : "Closed Now";
    return (
      <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
            background: C.ivory, padding: "14px 18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
            <Clock size={16} strokeWidth={1.75} color={C.heading} style={{ flexShrink: 0 }} />
            <h3 style={{
              margin: 0, fontSize: 11.5, fontWeight: 700, letterSpacing: "0.16em",
              textTransform: "uppercase", color: C.heading,
            }}>
              Opening Hours
            </h3>
          </div>
          {openStatus ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: statusColor }}>{statusText}</span>
            </span>
          ) : null}
        </div>
        <div style={{ padding: "0 18px 6px" }}>
          {DAY_LABELS.map((day, i) => {
            const v = openingHours![day.toLowerCase()] || "";
            const isAlwaysOpenValue = /always\s*open|24\s*\/?\s*7|open\s*24|24\s*hours?|24h\b/i.test(v);
            const isClosed = !alwaysOpen && !isAlwaysOpenValue && (!v || v.toLowerCase() === "closed");
            const isToday = day === todayLabel;
            const holiday = weekHolidays[day.toLowerCase()];
            const displayValue = alwaysOpen || isAlwaysOpenValue
              ? "Always Open"
              : isClosed
                ? "Closed"
                : v.replace(/\s*-\s*/g, " – ");
            return (
              <div key={day} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.divider}` }}>
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
                  padding: "13px 0",
                }}>

                  <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <span style={{ fontSize: 15, color: isToday ? C.heading : C.muted, fontWeight: isToday ? 700 : 400 }}>
                      {day}
                    </span>
                    {isToday && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                        color: C.primary,
                      }}>
                        Today
                      </span>
                    )}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 10, whiteSpace: "nowrap" }}>
                    <span style={{ fontSize: 15, color: isClosed ? C.muted : isToday ? C.heading : C.text, fontWeight: isToday ? 700 : 400 }}>
                      {displayValue}
                    </span>
                  </span>
                </div>
                {holiday && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "8px 12px", marginBottom: 12, background: C.ivory, borderRadius: 10,
                    fontSize: 12, color: C.text, lineHeight: 1.4,
                  }}>
                    <CalendarDays size={13} strokeWidth={2} color={C.primary} style={{ flexShrink: 0 }} />
                    <span>{holidayHoursNote(holiday)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderContact = () => (
    <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ ...cardStyle, padding: "4px 20px" }}>
        {(() => {
          const phones = collectContacts(listing.phone, (listing as any).additional_phones);
          const whatsapps = collectContacts(whatsappNum, (listing as any).additional_whatsapps);
          const emails = collectContacts(listing.email, (listing as any).additional_emails);
          const phoneLabels = [((listing as any).phone_label || "").trim(), ...((((listing as any).additional_phone_labels) || []) as string[]).map((s) => (s || "").trim())];
          const waLabels = [((listing as any).whatsapp_label || "").trim(), ...((((listing as any).additional_whatsapp_labels) || []) as string[]).map((s) => (s || "").trim())];
          const emailLabels = [((listing as any).email_label || "").trim(), ...((((listing as any).additional_email_labels) || []) as string[]).map((s) => (s || "").trim())];
          const rows: any[] = [];
          phones.forEach((p, i) => rows.push({ label: phoneLabels[i] || (i === 0 ? "Phone" : `Phone ${i + 1}`), custom: !!phoneLabels[i], value: formatSAPhone(p), href: `tel:${p}`, Icon: Phone }));
          // The number itself stays hidden — the row shows the listing's chat
          // call-to-action ("Chat on WhatsApp" unless the editor overrode it).
          whatsapps.forEach((w, i) => {
            const clean = w.replace(/[^0-9]/g, "");
            rows.push({ label: waLabels[i] || (i === 0 ? "WhatsApp" : `WhatsApp ${i + 1}`), custom: !!waLabels[i], value: whatsappCta, href: `https://wa.me/${clean}`, Icon: WhatsAppIcon });
          });
          emails.forEach((e, i) => rows.push({ label: emailLabels[i] || (i === 0 ? "Email" : `Email ${i + 1}`), custom: !!emailLabels[i], value: e, href: `mailto:${e}`, Icon: Mail }));
          const cleanUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
          // A Facebook or Instagram page saved in the website column reads as
          // that social page, not as a globe pointing at "facebook.com/...".
          websiteEntries.forEach(({ url, label }) => {
            const kind = websiteKind(url);
            const Icon = kind === "facebook" ? FacebookIcon : kind === "instagram" ? InstagramIcon : Globe;
            const fallback = kind === "facebook" ? "Facebook" : kind === "instagram" ? "Instagram" : cleanUrl(url);
            rows.push({ label: "", custom: false, value: label || fallback, href: websiteHref(url), Icon });
          });
          // Only when the website column isn't already showing that same page.
          const websiteKinds = new Set(websiteEntries.map(({ url }) => websiteKind(url)));
          if (facebookLink && !websiteKinds.has("facebook")) rows.push({ label: "Facebook", value: "Facebook", href: websiteHref(facebookLink), Icon: FacebookIcon });
          if (instagramLink && !websiteKinds.has("instagram")) rows.push({ label: "Instagram", value: "Instagram", href: websiteHref(instagramLink), Icon: InstagramIcon });
          return rows;
        })().map((r: any, i) => (
          <a key={`${r.label}-${i}`} href={r.href} target="_blank" rel="noopener noreferrer" style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "16px 0", textDecoration: "none",
            borderTop: i === 0 ? "none" : `1px solid ${C.divider}`,
          }}>
            <r.Icon size={20} strokeWidth={1.5} color={C.primary} />
            <div style={{ flex: 1, minWidth: 0, wordBreak: "break-word" }}>
              {r.custom && (
                <div style={{ fontFamily: FONT, fontSize: 10, fontWeight: 400, letterSpacing: "0.08em", textTransform: "uppercase", color: C.muted, marginBottom: 2 }}>
                  {r.label}
                </div>
              )}
              <div style={{ fontSize: 15, fontWeight: 400, color: C.heading }}>
                {r.value}
              </div>
            </div>
            <ArrowUpRight size={16} color={C.muted} />
          </a>
        ))}
      </div>
      <SuggestEditCard onClick={() => setSuggestEditOpen(true)} />
    </div>
  );


  const renderDetails = () => (
    <div style={{ padding: "16px 20px 20px" }}>
      {categoryDetailTabs.length > 1 && (
        <div
          role="tablist"
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 16,
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {categoryDetailTabs.map((t) => {
            const active = t.group === activeDetailsGroup;
            return (
              <button
                key={t.group}
                role="tab"
                aria-selected={active}
                onClick={() => setDetailsCatTab(t.group)}
                style={{
                  flexShrink: 0,
                  padding: "8px 14px",
                  borderRadius: 999,
                  border: `1px solid ${active ? "#423324" : C.border}`,
                  background: active ? "#423324" : "transparent",
                  color: active ? "#fff" : C.heading,
                  fontFamily: FONT,
                  fontSize: 12,
                  fontWeight: 400,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      )}
      {visibleSections.length === 0 ? (
        <p style={{ ...paraStyle, color: C.muted, textAlign: "center", marginTop: 40 }}>No additional details yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {visibleSections.map((s) => (
            <div key={s.key} style={{ ...cardStyle, padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                {s.iconComp && <s.iconComp size={17} strokeWidth={1.75} color={C.primary} />}
                <h3 style={{
                  margin: 0, fontFamily: FONT, fontWeight: 700, fontSize: 12,
                  letterSpacing: "0.1em", textTransform: "uppercase", color: C.heading,
                }}>{s.title}</h3>
              </div>
              {s.fields.length === 1 && s.fields[0].on === "__text__" ? (
                <div className="ld-richtext">{renderListingRichText(s.fields[0].label)}</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 14, rowGap: 10 }}>
                  {s.fields.map((f, i) => {
                    const on = f.on === true || typeof f.on === "string";
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {on
                          ? <Check size={16} strokeWidth={2} color={C.primary} style={{ flexShrink: 0 }} />
                          : <XIcon size={16} strokeWidth={2} color={C.muted} style={{ flexShrink: 0 }} />}
                        <span style={{ fontSize: 13, color: on ? C.text : C.muted, lineHeight: 1.4 }}>
                          {s.key === "accom-distance" || s.key === "accom-pricing" || s.key === "accom-capacity" ? f.label : formatDetailLabel(f.label)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <div style={{ marginTop: 14 }}>
        <SuggestEditCard onClick={() => setSuggestEditOpen(true)} />
      </div>
    </div>
  );

  const renderRelatedCard =(item: { id: string; title: string; image_url?: string | null; subtitle?: string | null; badge?: string | null }, to: string) => (
    <Link
      key={item.id}
      to={to}
      style={{
        display: "flex", gap: 12, alignItems: "stretch",
        padding: 0, background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 16, textDecoration: "none", color: C.heading,
        overflow: "hidden", minHeight: 88,
      }}
    >
      <div style={{ width: 96, flexShrink: 0, alignSelf: "stretch", background: C.ivory }}>
        {item.image_url && <img src={item.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />}
      </div>
      <div style={{ flex: 1, minWidth: 0, padding: "12px 14px 12px 0", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ ...type.cardTitleM, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
          {item.title}
        </div>
        {item.subtitle && (
          <div style={type.meta}>{item.subtitle}</div>
        )}
        {item.badge && (
          <div style={{ marginTop: 6, alignSelf: "flex-start", fontFamily: FONT, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "#fff", background: C.primary, padding: "3px 8px", borderRadius: 999 }}>
            {item.badge}
          </div>
        )}
      </div>
    </Link>
  );

  const renderSpecials = () => (
    <div style={{ padding: "20px" }}>
      <h2 style={headStyle}>Current Specials</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {(relatedSpecials ?? []).map((s: any) =>
          renderRelatedCard(
            { id: s.id, title: s.title, image_url: s.image_url, badge: getSpecialBadge(s) },
            `/specials/${s.id}`
          )
        )}
      </div>
    </div>
  );

  const renderEvents = () => (
    <div style={{ padding: "20px" }}>
      <h2 style={headStyle}>Upcoming Events</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {(relatedEvents ?? [])
          .slice()
          .sort((a: any, b: any) => {
            const da = getEventSortDate(a)?.getTime() ?? Infinity;
            const db = getEventSortDate(b)?.getTime() ?? Infinity;
            return da - db;
          })
          .map((e: any) => {
            const dateText = formatEventDateRange(e) || e.date || "";
            return renderRelatedCard(
              { id: e.id, title: e.title, image_url: e.image_url, subtitle: dateText },
              `/events/${e.id}`
            );
          })}
      </div>
    </div>
  );

  const renderGallery = () => (
    <div style={{ padding: "20px" }}>
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
              <img src={url} alt={`${listing.title} ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderLocation = () => {
    const directionsHref = l.google_maps_link || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.location || listing.title)}`;
    const isSurrounds = (listing.location || "").trim().toLowerCase() === "hoedspruit & surrounds";
    const addressText = listing.location || listing.title;

    const copyAddress = async () => {
      const outcome = await sharePlainText(addressText);
      if (outcome === "copied") toast.success("Address copied");
      if (outcome === "failed") toast.error("Couldn't copy the address");
    };

    // One row of the directions / address card: circled icon, label + value, arrow.
    const LocationRow = ({
      Icon, label, value, onClick, href, first,
    }: {
      Icon: IconComp; label: string; value: string; onClick?: () => void; href?: string; first?: boolean;
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
                  href={directionsHref}
                  label={listing.title}
                  pinColor={C.primary}
                />
              </div>
              <div style={{ padding: "14px 20px 16px" }}>
                {listing.location && (
                  <div style={type.cardTitleL}>
                    {listing.location}
                  </div>
                )}
                {kmFromTown && (
                  <div style={{ fontFamily: FONT, fontSize: 14, color: C.muted, marginTop: 4 }}>
                    {kmFromTown}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {!isSurrounds && (
          <div style={{ ...cardStyle, padding: "0 20px" }}>
            <LocationRow first Icon={Navigation} label="Directions" value="Open in Google Maps" href={directionsHref} />
            <LocationRow Icon={Copy} label="COPY ADDRESS" value={addressText} onClick={copyAddress} />
          </div>
        )}

        <SuggestEditCard onClick={() => setSuggestEditOpen(true)} />
      </div>
    );
  };

  const floatBtn: React.CSSProperties = {
    width: 40, height: 40, borderRadius: 999,
    background: "#FFFFFF", border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
  };

  const heroImgUrl = (listing as any).detail_image_url || listing.image_url;
  const showHero = !!heroImgUrl && !heroImgError;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, paddingBottom: actions.length > 0 ? 190 : 100, fontFamily: FONT, color: C.text }}>
      <Seo
        title={`${listing.title} — Hello Hoedspruit`}
        description={
          (listing.description ? String(listing.description).replace(/<[^>]*>/g, "").trim() : "") ||
          `${listing.title} in Hoedspruit. Find contact details, hours, location and more on Hello Hoedspruit.`
        }
        path={`/listing/${listing.id}`}
        image={listing.image_url || undefined}
        type="article"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: listing.title,
          description: listing.description
            ? String(listing.description).replace(/<[^>]*>/g, "").trim().slice(0, 500)
            : undefined,
          image: listing.image_url || undefined,
          url: `https://hello-hoedspruit-hub.lovable.app/listing/${listing.id}`,
          telephone: (listing as any).phone || undefined,
          address: (listing as any).address
            ? { "@type": "PostalAddress", streetAddress: (listing as any).address, addressLocality: "Hoedspruit", addressCountry: "ZA" }
            : { "@type": "PostalAddress", addressLocality: "Hoedspruit", addressCountry: "ZA" },
        }}
      />
      {/* Hero (4:3) with floating action buttons */}
      {showHero ? (
        <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3", background: "#DDD6C0", overflow: "hidden" }}>
          <img
            src={heroImgUrl}
            alt={listing.title}
            onError={() => setHeroImgError(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
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
              <button onClick={() => navigate(`/admin/listings?edit=${listing.id}&returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`, { replace: true })} aria-label="Edit" style={floatBtn}>
                <Pencil size={18} strokeWidth={1.6} color={C.heading} />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ position: "relative", paddingTop: "var(--safe-top)", background: C.surface }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
            <button onClick={() => navigate(-1)} aria-label="Back" style={{ ...floatBtn, position: "relative" }}>
              <BackArrowIcon size={20} color={C.heading} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={handleShare} aria-label="Share" style={floatBtn}>
                <Share2 size={20} strokeWidth={1.6} color={C.heading} />
              </button>
              <button onClick={handleToggleFavourite} aria-label={isFavourited ? "Unsave" : "Save"} style={floatBtn}>
                <Heart size={20} strokeWidth={2} color={isFavourited ? "#715a3d" : C.primary} fill={isFavourited ? "#715a3d" : "none"} />
              </button>
              {isAdmin && (
                <button onClick={() => navigate(`/admin/listings?edit=${listing.id}&returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`, { replace: true })} aria-label="Edit" style={floatBtn}>
                  <Pencil size={18} strokeWidth={1.6} color={C.heading} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Title sheet — overlaps the hero with a rounded top edge */}
      <div style={{
        position: "relative",
        zIndex: 3,
        background: C.surface,
        borderRadius: showHero ? "28px 28px 0 0" : 0,
        marginTop: showHero ? -28 : 0,
        padding: "22px 20px 0",
      }}>
        {/* Categories — small brown text above the title, dot-separated */}
        {categoryChips.length > 0 && (
          <div style={{ ...categoryLineStyle, marginTop: 0, marginBottom: 8 }}>
            {categoryChips.map((t, i) => (
              <span key={t}>
                {i > 0 && <span style={{ color: C.accent, margin: "0 6px" }}>·</span>}
                {t}
              </span>
            ))}
          </div>
        )}

        <h1
          data-no-title-case={(listing as any).title_override?.trim() ? "true" : undefined}
          style={{
            ...type.pageTitle, margin: 0,
          }}
        >
          {(listing as any).title_override?.trim()
            ? <span data-no-title-case="true">{(listing as any).title_override}</span>
            : listing.title}
        </h1>


        {hasHours && openStatus && (
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
              background: openStatus.state === "open" ? C.open : C.closed,
            }} />
            <span style={{
              fontSize: 13, fontWeight: 600, letterSpacing: "0.01em",
              color: openStatus.state === "open" ? C.open : C.closed,
            }}>
              {openStatus.state === "open" ? "Open Now" : openStatus.state === "temporarily_closed" ? "Temporarily Closed" : "Closed"}
            </span>
            {openStatus.state === "open" && openStatus.alwaysOpen && (
              <span style={{ fontSize: 13, color: MUTED }}>· Never Closes</span>
            )}
            {openStatus.state === "open" && !openStatus.alwaysOpen && openStatus.closes && (
              <span style={{ fontSize: 13, color: MUTED }}>· Closes at {openStatus.closes}</span>
            )}
            {openStatus.state === "closed" && openStatus.opensAt && (
              <span style={{ fontSize: 13, color: MUTED }}>· Opens at {openStatus.opensAt}&nbsp;{openStatus.opensDay || ""}</span>
            )}
            {todayHoliday && (
              <span style={{ fontSize: 13, color: MUTED }}>· {todayHoliday.name} — hours might differ</span>
            )}
          </div>
        )}

        {(l.google_rating != null || kmFromTown) && (
          <div style={{ marginTop: 12, display: "flex", alignItems: "flex-start", flexWrap: "wrap", gap: "10px 18px" }}>
            {l.google_rating != null && (() => {
              const reviewsHref: string | null = l.google_reviews_url || null;
              const row: React.CSSProperties = {
                ...metaRow, display: "inline-flex", gap: 5,
                ...type.meta, color: C.heading, textDecoration: "none",
              };
              const inner = (
                <>
                  <Star size={14} fill={C.accent} color={C.accent} strokeWidth={0} style={metaIconSolid()} />
                  <span style={{ fontWeight: 700 }}>{Number(l.google_rating).toFixed(1).replace(/\.0$/, "")}</span>
                  {l.google_reviews_count != null && (
                    <span style={{ color: C.muted }}>({l.google_reviews_count})</span>
                  )}
                  {/* A directional affordance rather than a glyph beside the text — it reads best optically centred. */}
                  {reviewsHref && <ChevronRight size={14} strokeWidth={2} color={C.muted} style={{ alignSelf: "center", flexShrink: 0 }} />}
                </>
              );
              return reviewsHref
                ? <a href={reviewsHref} target="_blank" rel="noopener noreferrer" style={row}>{inner}</a>
                : <div style={row}>{inner}</div>;
            })()}

            {kmFromTown && (
              <div style={{ ...metaRow, ...type.meta, alignItems: "center" }}>
                <MapPin size={14} strokeWidth={1.75} color={MUTED} style={{ ...metaIcon(), alignSelf: "center", transform: "none" }} />
                <span>{kmFromTown}</span>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Sticky tab bar */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 30,
        background: C.surface, borderBottom: `1px solid rgba(112,90,61,0.14)`,
        display: "flex",
        padding: "12px 12px 0",
        overflowX: "auto",
      }} className="scrollbar-hide">
        {visibleTabs.map(t => <TabBtn key={t.key} k={t.key} label={t.label} scrollable={visibleTabs.length > 4} />)}
      </nav>

      {/* Tab content */}
      <section style={{ background: C.bg }}>
        {activeTab === "about" && renderAbout()}
        {activeTab === "contact" && renderContact()}
        {activeTab === "details" && renderDetails()}
        {activeTab === "specials" && renderSpecials()}
        {activeTab === "events" && renderEvents()}
        {activeTab === "gallery" && renderGallery()}
        {activeTab === "location" && renderLocation()}
      </section>

      {/* Fixed action bar, parked just above the bottom nav */}
      {actions.length > 0 && (
        <div style={{
          position: "fixed", bottom: 84, left: "50%", transform: "translateX(-50%)",
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
        alt={listing.title}
      />

      <SuggestEditSheet
        open={suggestEditOpen}
        onClose={() => setSuggestEditOpen(false)}
        listingTitle={listing.title}
        currentUser={user}
      />

      <BottomNav />
    </div>
  );
};

// ----- Shared inline styles -----
const headStyle: React.CSSProperties = {
  margin: "0 0 10px",
  ...type.sectionTitle, textTransform: "none",
};
const paraStyle: React.CSSProperties = {
  ...type.body, margin: "0 0 10px",
};
const iconBtn: React.CSSProperties = {
  width: 40, height: 40, borderRadius: 999,
  background: "none", border: "none", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
};

// Small brown category line sitting directly under the listing title.
const categoryLineStyle: React.CSSProperties = {
  marginTop: 8,
  ...type.label,
  lineHeight: 1.4,
  color: "#715A3D",
};

const SuggestEditCard = ({ onClick }: { onClick: () => void }) => (
  <div style={{
    background: C.soft,
    border: `1px solid ${C.softBorder}`,
    borderRadius: 20,
    padding: "20px 22px",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      <Flag size={16} strokeWidth={1.75} color={C.primary} />
      <h3 style={{
        ...type.eyebrow, margin: 0,
      }}>
        Something out of date?
      </h3>
    </div>
    <p style={{ ...type.body, margin: 0 }}>
      Hours, numbers and prices change. Let us know if you spot anything out of date and we will review and fix accordingly.
    </p>
    <button onClick={onClick} style={{
      marginTop: 14, background: "none", border: "none", cursor: "pointer", padding: 0,
      ...type.button, fontWeight: 700, color: C.primary,
    }}>
      Suggest an Edit →
    </button>
  </div>
);

// ----- Suggest edit sheet -----
const suggestInputStyle: React.CSSProperties = {
  ...type.input,
  background: "#fff", border: `2px solid #C5C0BA`, borderRadius: 12,
  padding: "13px 14px", outline: "none", width: "100%", boxSizing: "border-box",
  lineHeight: 1.4,
};

const suggestLabelStyle: React.CSSProperties = {
  ...type.eyebrow, color: "#423324", marginBottom: 6, display: "block",
};

const SuggestEditSheet = ({
  open, onClose, listingTitle, currentUser,
}: {
  open: boolean; onClose: () => void; listingTitle: string;
  currentUser: { email?: string | null; user_metadata?: Record<string, any> } | null;
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [editType, setEditType] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isSignedIn = !!currentUser;
  const signedInName =
    (currentUser?.user_metadata?.display_name as string | undefined)?.trim() ||
    (currentUser?.user_metadata?.first_name as string | undefined)?.trim() ||
    (currentUser?.email ? currentUser.email.split("@")[0] : "");
  const signedInEmail = currentUser?.email ?? "";

  if (!open) return null;

  const submit = async () => {
    const finalName = isSignedIn ? signedInName : name.trim();
    const finalEmail = isSignedIn ? signedInEmail : email.trim();
    if (!finalName || !finalEmail || !editType.trim() || !details.trim()) {
      toast.error("Please fill in all the fields.");
      return;
    }
    setSubmitting(true);
    const composed = `[Suggest an edit]\nListing: ${listingTitle}\nWhat needs updating: ${editType.trim()}\n\nDetails:\n${details.trim()}`;
    const { error } = await supabase.from("contact_submissions").insert({
      name: finalName, email: finalEmail, message: composed,
    });
    setSubmitting(false);
    if (error) { toast.error("Couldn't send right now. Try again shortly."); return; }
    toast.success("Thanks — we'll take a look.");
    setName(""); setEmail(""); setEditType(""); setDetails("");
    onClose();
  };

  return (
    <div role="dialog" aria-modal="true"
      style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(10,10,10,0.4)", display: "flex", alignItems: "flex-end" }}
      onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        fontFamily: FONT, width: "100%", background: C.surface,
        borderRadius: "20px 20px 0 0", padding: "20px 20px 32px",
        animation: "ld-slide-up 250ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        <style>{`@keyframes ld-slide-up { from { transform: translateY(100%);} to { transform: translateY(0);} }`}</style>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.08em", color: C.muted, textTransform: "uppercase" }}>{"\n"}</div>
          <button onClick={onClose} aria-label="Close" style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4 }}>
            <XIcon size={20} color={C.heading} strokeWidth={1.75} />
          </button>
        </div>
        <h2 style={{ ...type.sectionTitle, margin: "0 0 8px" }}>Suggest an Edit</h2>
        <p style={{ fontSize: 14, lineHeight: 1.55, color: C.text, margin: "0 0 20px" }}>
          Spotted something out of date or inaccurate on <strong style={{ color: C.heading, fontWeight: 700 }}>{listingTitle}</strong>? Please let us know and we will get it updated.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {!isSignedIn && (
            <>
              <div>
                <label style={suggestLabelStyle}>Your name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jane Smith" style={suggestInputStyle} />
              </div>
              <div>
                <label style={suggestLabelStyle}>Your email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" style={suggestInputStyle} />
              </div>
            </>
          )}
          <div>
            <label style={suggestLabelStyle}>What needs updating?</label>
            <input value={editType} onChange={(e) => setEditType(e.target.value)} placeholder="e.g. Opening hours, phone number, address" style={suggestInputStyle} />
          </div>
          <div>
            <label style={suggestLabelStyle}>Details</label>
            <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Please share the correct details." rows={5} style={{ ...suggestInputStyle, resize: "none" }} />
          </div>
        </div>
        <button onClick={submit} disabled={submitting} style={{
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          marginTop: 20, width: "100%", height: 48, borderRadius: 9999,
          background: "#423324", color: "#FFFFFF", border: "none",
          fontSize: 14, fontWeight: 500, lineHeight: "20px",
          padding: "8px 16px",
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
          cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.6 : 1,
        }}>
          {submitting ? "Sending..." : "Send Suggestion"}
        </button>
      </div>
    </div>
  );
};

export default ListingDetail;
