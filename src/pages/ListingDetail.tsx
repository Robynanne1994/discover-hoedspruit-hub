import { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Star, Pencil, Heart, Share2, Check, X as XIcon, Phone, Send,
  Mail, Globe, ArrowUpRight, MapPin, Navigation,
  Sparkles, Coffee, Car, HeartPulse, BedDouble, PawPrint, Users, Banknote,
  ShoppingBag, CreditCard, Package, MessageCircleMore, Calendar, Wrench, Leaf,
  Tag, ClipboardList, Baby, Accessibility, Home, Sofa, Utensils, Soup, Music, Wine,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRequireAuth } from "@/hooks/useGuestAuth";
import { useIsFavourited, useToggleFavourite } from "@/hooks/useFavourites";
import { isRestaurantCategory, isShoppingCategory, isAccommodationCategory, isNGOCategory, isTradesCategory, isHomeGardenCategory, isWeddingsEventsCategory, isWellnessBeautyCategory } from "@/lib/categoryFields";
import BottomNav from "@/components/BottomNav";
import ImageLightbox from "@/components/ImageLightbox";
import { toast } from "sonner";
import { isSAPublicHoliday, getSADate } from "@/lib/southAfricaHolidays";
import { sanitizeDashes } from "@/lib/sanitizeListing";
import { formatSAPhone } from "@/lib/formatPhone";
import { collectContacts } from "@/lib/contacts";
import { formatServiceLabel } from "@/lib/serviceLabels";
import BackArrowIcon from "@/components/ui/BackArrowIcon";
import { formatEventDateRange, getEventSortDate } from "@/lib/eventDates";
import { DISPLAY_SECTIONS, resolveSectionMode, type DisplayMode } from "@/lib/detailsDisplayModes";
import { getCustomIcon } from "@/lib/customIcons";
import { renderListingRichText } from "@/lib/listingRichText";
import Seo from "@/components/Seo";
import { Skeleton } from "@/components/ui/skeleton";


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
const HEAD = "'Bricolage Grotesque', 'Helvetica Neue', Helvetica, Arial, sans-serif";
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
  muted: "#8A8480",
  primary: "#715a3d",
  accent: "#B8916A",
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

type TabKey = "about" | "hours" | "contact" | "details" | "specials" | "events" | "gallery" | "location";

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
  const [mapCoords, setMapCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [heroImgError, setHeroImgError] = useState(false);

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
    setMapCoords(null);
    const link: string | null = (listing as any).google_maps_link || null;
    const loc: string | null = listing.location || null;
    const tryParse = (url: string): { lat: number; lon: number } | null => {
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
    const query = loc ? `${loc}, Hoedspruit, South Africa` : `${listing.title}, Hoedspruit, South Africa`;
    let cancelled = false;
    fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((arr) => {
        if (cancelled) return;
        if (Array.isArray(arr) && arr[0]) {
          setMapCoords({ lat: parseFloat(arr[0].lat), lon: parseFloat(arr[0].lon) });
        } else setMapCoords({ lat: -24.3567, lon: 31.0 });
      })
      .catch(() => { if (!cancelled) setMapCoords({ lat: -24.3567, lon: 31.0 }); });
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
        .select("id,title,deal_label,image_url,valid_until")
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

  const handleToggleFavourite = () => {
    // Guests get a dismissable bottom sheet, not a full-screen redirect.
    if (!requireAuth("save favourites")) return;
    toggleFavourite.mutate({ itemId: id!, itemType: "listing", currentlyFavourited: isFavourited });
    toast.success(isFavourited ? "Removed from saved" : "Saved!");
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: listing?.title || "", url: shareUrl }); } catch (err) {
        if ((err as Error).name !== "AbortError") {
          try { await navigator.clipboard.writeText(shareUrl); toast.success("Link copied!"); } catch { toast.error("Could not copy link"); }
        }
      }
    } else {
      try { await navigator.clipboard.writeText(shareUrl); toast.success("Link copied!"); } catch { toast.error("Could not copy link"); }
    }
  };

  useEffect(() => {
    const hasS = (relatedSpecials?.length ?? 0) > 0;
    const hasE = (relatedEvents?.length ?? 0) > 0;
    const hasG = ((listing as any)?.gallery_images?.length ?? 0) > 0;
    const keys: TabKey[] = ["about", "hours", "contact", "details", ...(hasS ? ["specials" as TabKey] : []), ...(hasE ? ["events" as TabKey] : []), ...(hasG ? ["gallery" as TabKey] : []), "location"];
    if (!keys.includes(tab)) setTab("about");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relatedSpecials, relatedEvents, listing, tab]);

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, fontFamily: FONT, color: C.text, paddingBottom: 100 }}>
        <div style={{ padding: "calc(env(safe-area-inset-top) + 16px) 16px 0" }}>
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
        <div style={{ padding: "calc(env(safe-area-inset-top) + 16px) 16px 0" }}>
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
          <h2 style={{ fontFamily: HEAD, fontSize: 22, fontWeight: 700, color: C.heading, margin: "0 0 10px" }}>
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
        <div style={{ padding: "calc(env(safe-area-inset-top) + 16px) 16px 0" }}>
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
          <h2 style={{ fontFamily: HEAD, fontSize: 22, fontWeight: 700, color: C.heading, margin: "0 0 10px" }}>
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
  const actionWebsite = pickAction(listing.website, l.additional_websites, l.action_website_index ?? 0);

  const hasContact = !!(listing.email || listing.phone || waClean || listing.website || (l.additional_websites?.length) || (listing as any).facebook || (listing as any).instagram || ((listing as any).additional_emails?.length) || ((listing as any).additional_phones?.length) || ((listing as any).additional_whatsapps?.length));
  const hasAbout = !!descriptionText;
  const hasLocation = !!(listing.location || mapCoords);

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
        return { opensAt: formatTime(mm[1]), opensDay: i === 1 ? "tomorrow" : DAY_LABELS[idx] };
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
    if (cur < o) return { state: "closed", opensAt: formatTime(m[1]), opensDay: "today" };
    return { state: "closed", ...(findNext(1) || {}) };
  };
  const openStatus = computeOpenStatus();

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
    if (avgPrice) pricing.push({ label: `${String(avgPrice).trim()} per person per night`, on: true });
    if (l.price_range) pricing.push({ label: `${String(l.price_range).trim()}`, on: true });
    if (pricing.length) sections.push({ key: "accom-pricing", title: "Average", iconComp: Banknote, fields: pricing });

    // Capacity: sleeps & rooms
    const capacity: { label: string; on: boolean }[] = [];
    if (l.sleeps) capacity.push({ label: `Sleeps ${l.sleeps} ${Number(l.sleeps) === 1 ? "person" : "people"}`, on: true });
    if ((l as any).rooms_count) capacity.push({ label: `${(l as any).rooms_count} ${Number((l as any).rooms_count) === 1 ? "room" : "rooms"}`, on: true });
    if (capacity.length) sections.push({ key: "accom-capacity", title: "Capacity", iconComp: Users, fields: capacity });

    if (l.km_from_town) {
      const kmNum = parseFloat(String(l.km_from_town).replace(",", ".").replace(/[^0-9.]/g, ""));
      const kmLabel = Number.isFinite(kmNum)
        ? (Math.round(kmNum * 100) / 100).toString()
        : String(l.km_from_town);
      sections.push({ key: "accom-distance", title: "Distance", iconComp: MapPin, fields: [{ label: `${kmLabel}km from Town`, on: true }] });
    }


    const food = filterDefined([
      { label: "Restaurant", value: l.has_restaurant }, { label: "Bar", value: l.has_bar },
      { label: "Room service", value: l.has_room_service }, { label: "Breakfast", value: l.has_breakfast },
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
  const visibleTabs: { key: TabKey; label: string }[] = [
    ...(hasAbout ? [{ key: "about" as TabKey, label: "About" }] : []),
    ...(hasHours ? [{ key: "hours" as TabKey, label: "Hours" }] : []),
    ...(hasContact ? [{ key: "contact" as TabKey, label: "Contact" }] : []),
    ...(hasDetails ? [{ key: "details" as TabKey, label: "Details" }] : []),
    ...(hasSpecials ? [{ key: "specials" as TabKey, label: "Specials" }] : []),
    ...(hasEvents ? [{ key: "events" as TabKey, label: "Events" }] : []),
    ...(hasGallery ? [{ key: "gallery" as TabKey, label: "Gallery" }] : []),
    ...(hasLocation ? [{ key: "location" as TabKey, label: "Location" }] : []),
  ];


  // ----- Action pills -----
  const actions = [
    actionPhone && { key: "call", label: "Call", href: `tel:${actionPhone}`, Icon: Phone, ext: false },
    actionWhatsappClean && {
      key: "whatsapp", label: "WhatsApp", href: `https://wa.me/${actionWhatsappClean}`, ext: true,
      Icon: ({ size = 18, color = C.primary }: { size?: number; color?: string }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.693.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.83 9.83 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.82 11.82 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413Z" />
        </svg>
      ),
    },
    (l.google_maps_link || listing.location) && {
      key: "directions", label: "Directions",
      href: l.google_maps_link || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.location || listing.title)}`,
      Icon: Send, ext: true,
    },
    (actionWebsite
      ? (/facebook\.com/i.test(actionWebsite)
          ? { key: "website", label: "Facebook", href: actionWebsite, Icon: FacebookIcon, ext: true }
          : /instagram\.com/i.test(actionWebsite)
            ? { key: "website", label: "Instagram", href: actionWebsite, Icon: InstagramIcon, ext: true }
            : { key: "website", label: "Website", href: actionWebsite, Icon: Globe, ext: true })
      : (listing as any).facebook
        ? { key: "facebook", label: "Facebook", href: (listing as any).facebook, Icon: FacebookIcon, ext: true }
        : (listing as any).instagram
          ? { key: "instagram", label: "Instagram", href: (listing as any).instagram, Icon: InstagramIcon, ext: true }
          : null),
    // If website is shown but no WhatsApp, surface Facebook (or Instagram) as an extra action
    (actionWebsite && !actionWhatsappClean && (listing as any).facebook
      ? { key: "facebook", label: "Facebook", href: (listing as any).facebook, Icon: FacebookIcon, ext: true }
      : actionWebsite && !actionWhatsappClean && (listing as any).instagram
        ? { key: "instagram", label: "Instagram", href: (listing as any).instagram, Icon: InstagramIcon, ext: true }
        : null),
  ].filter(Boolean) as Array<{ key: string; label: string; href: string; Icon: any; ext: boolean }>;


  // ----- Sub-components -----
  const PillBtn = ({ a, full }: { a: typeof actions[number]; full?: boolean }) => (
    <a
      href={a.href}
      {...(a.ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        padding: "10px 18px", borderRadius: 999,
        background: C.surface, border: `1px solid ${C.border}`,
        color: C.heading, textDecoration: "none",
        fontFamily: FONT, fontWeight: 400, fontSize: 14,
        letterSpacing: "0.01em",
        flexShrink: 0,
        width: full ? "100%" : undefined,
        transition: "transform 150ms ease-out",
      }}
      {...pressScale()}
    >
      <a.Icon size={16} strokeWidth={1.75} color={C.heading} />
      <span>{a.label}</span>
    </a>
  );

  const TabBtn = ({ k, label, scrollable }: { k: TabKey; label: string; scrollable?: boolean }) => {
    const active = tab === k;
    return (
      <button
        onClick={() => setTab(k)}
        style={{
          ...(scrollable
            ? { flex: "0 0 auto", padding: "14px 14px" }
            : { flex: 1, padding: "14px 4px" }),
          background: "none", border: "none", cursor: "pointer",
          fontFamily: FONT, fontWeight: active ? 700 : 400, fontSize: 12,
          letterSpacing: "0.08em", textTransform: "uppercase",
          color: active ? C.heading : C.muted,
          borderBottom: `2px solid ${active ? C.heading : "transparent"}`,
          marginBottom: -1,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </button>
    );
  };

  // ----- Tab content -----
  const renderAbout = () => {
    return (
    <div style={{ padding: "20px" }}>
      {descriptionText && (
        <>
          <h2 style={headStyle}>About</h2>
          <div className="ld-richtext">
            {renderListingRichText(descriptionText)}
          </div>
        </>
      )}

      <SuggestEditFooter onClick={() => setSuggestEditOpen(true)} />
    </div>
    );
  };

  const renderHours = () => {
    if (!hasHours) return null;
    const holidayCheck = isSAPublicHoliday(getSADate());
    return (
      <div style={{ padding: "20px" }}>
        <h2 style={headStyle}>Hours</h2>
        {openStatus && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: openStatus.state === "open" ? "#5C8A4A" : "#B05B3F" }} />
            <span style={{ fontSize: 15, color: C.heading, fontWeight: 600, letterSpacing: "0.01em" }}>
              {openStatus.state === "open" ? "Open now" : openStatus.state === "temporarily_closed" ? "Temporarily closed" : "Closed"}
            </span>
            {openStatus.state === "open" && openStatus.alwaysOpen && (
              <span style={{ fontSize: 15, color: C.heading, fontWeight: 600, letterSpacing: "0.01em" }}>· Never Closes</span>
            )}
            {openStatus.state === "open" && !openStatus.alwaysOpen && openStatus.closes && (
              <span style={{ fontSize: 15, color: C.text, fontWeight: 500 }}>· Closes {openStatus.closes}</span>
            )}
            {openStatus.state === "closed" && openStatus.opensAt && (
              <span style={{ fontSize: 15, color: C.text, fontWeight: 500 }}>· Opens {openStatus.opensAt} {openStatus.opensDay || ""}</span>
            )}
          </div>
        )}
        <div style={{ background: C.surface, borderRadius: 16, padding: "4px 16px", border: `1px solid ${C.border}` }}>
          {DAY_LABELS.map((day, i) => {
            const v = openingHours![day.toLowerCase()] || "";
            const isClosed = !v || v.toLowerCase() === "closed";
            const isToday = day === todayLabel;
            return (
              <div key={day} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.divider}` }}>
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 0",
                }}>
                  <span style={{ fontSize: 14, color: isToday ? C.heading : C.text, fontWeight: isToday ? 700 : 400 }}>
                    {day}{isToday ? " · Today" : ""}
                  </span>
                  <span style={{ fontSize: 14, color: isClosed ? C.muted : isToday ? C.heading : C.text, fontWeight: isToday ? 700 : 400 }}>
                    {isClosed ? "Closed" : v.replace(/\s*-\s*/g, " - ")}
                  </span>
                </div>
                {isToday && holidayCheck.isHoliday && (
                  <div style={{ padding: "8px 12px", marginBottom: 12, background: C.ivory, borderRadius: 10, fontSize: 12.5, color: C.text }}>
                    Public holiday{holidayCheck.name ? ` (${holidayCheck.name})` : ""} — hours might differ
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <SuggestEditFooter onClick={() => setSuggestEditOpen(true)} />
      </div>
    );
  };

  const renderContact = () => (
    <div style={{ padding: "20px" }}>
      <h2 style={headStyle}>Contact</h2>
      <div style={{ background: C.surface, borderRadius: 16, padding: "4px 16px", border: `1px solid ${C.border}` }}>
        {(() => {
          const phones = collectContacts(listing.phone, (listing as any).additional_phones);
          const whatsapps = collectContacts(whatsappNum, (listing as any).additional_whatsapps);
          const emails = collectContacts(listing.email, (listing as any).additional_emails);
          const phoneLabels = [((listing as any).phone_label || "").trim(), ...((((listing as any).additional_phone_labels) || []) as string[]).map((s) => (s || "").trim())];
          const waLabels = [((listing as any).whatsapp_label || "").trim(), ...((((listing as any).additional_whatsapp_labels) || []) as string[]).map((s) => (s || "").trim())];
          const emailLabels = [((listing as any).email_label || "").trim(), ...((((listing as any).additional_email_labels) || []) as string[]).map((s) => (s || "").trim())];
          const rows: any[] = [];
          phones.forEach((p, i) => rows.push({ label: phoneLabels[i] || (i === 0 ? "Phone" : `Phone ${i + 1}`), custom: !!phoneLabels[i], value: formatSAPhone(p), href: `tel:${p}`, Icon: Phone }));
          whatsapps.forEach((w, i) => {
            const clean = w.replace(/[^0-9]/g, "");
            rows.push({ label: waLabels[i] || (i === 0 ? "WhatsApp" : `WhatsApp ${i + 1}`), custom: !!waLabels[i], value: formatSAPhone(w), href: `https://wa.me/${clean}`, Icon: WhatsAppIcon });
          });
          emails.forEach((e, i) => rows.push({ label: emailLabels[i] || (i === 0 ? "Email" : `Email ${i + 1}`), custom: !!emailLabels[i], value: e, href: `mailto:${e}`, Icon: Mail }));
          const websites = collectContacts(listing.website, (listing as any).additional_websites);
          const websiteLabels = [((listing as any).website_label || "").trim(), ...((((listing as any).additional_website_labels) || []) as string[]).map((s) => (s || "").trim())];
          const cleanUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
          websites.forEach((w, i) => rows.push({ label: "", custom: false, value: websiteLabels[i] || cleanUrl(w), href: w, Icon: Globe }));
          if ((listing as any).facebook) rows.push({ label: "Facebook", value: "Facebook", href: (listing as any).facebook, Icon: FacebookIcon });
          if ((listing as any).instagram) rows.push({ label: "Instagram", value: "Instagram", href: (listing as any).instagram, Icon: InstagramIcon });
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
      <SuggestEditFooter onClick={() => setSuggestEditOpen(true)} />
    </div>
  );


  const renderDetails = () => (
    <div style={{ padding: "20px" }}>
      <h2 style={headStyle}>Details</h2>
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
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {visibleSections.map((s) => (
            <div key={s.key} style={{ background: C.surface, borderRadius: 16, padding: 18, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${C.divider}` }}>
                {s.iconComp && <s.iconComp size={18} strokeWidth={1.5} color={C.primary} />}
                <h3 style={{
                  margin: 0, fontFamily: FONT, fontWeight: 400, fontSize: 12,
                  letterSpacing: "0.08em", textTransform: "uppercase", color: C.heading,
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
                        <span style={{ fontSize: 13.5, color: on ? C.text : C.muted, lineHeight: 1.4 }}>
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
      <SuggestEditFooter onClick={() => setSuggestEditOpen(true)} />
    </div>
  );

  const renderRelatedCard = (item: { id: string; title: string; image_url?: string | null; subtitle?: string | null; badge?: string | null }, to: string) => (
    <Link
      key={item.id}
      to={to}
      style={{
        display: "flex", gap: 12, alignItems: "center",
        padding: 12, background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 16, textDecoration: "none", color: C.heading,
      }}
    >
      <div style={{ width: 64, height: 64, flexShrink: 0, borderRadius: 12, overflow: "hidden", background: C.ivory }}>
        {item.image_url && <img src={item.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FONT, fontSize: 14, color: C.heading, lineHeight: 1.3, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
          {item.title}
        </div>
        {item.subtitle && (
          <div style={{ fontFamily: FONT, fontSize: 12, color: C.muted }}>{item.subtitle}</div>
        )}
        {item.badge && (
          <div style={{ marginTop: 6, display: "inline-block", fontFamily: FONT, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "#fff", background: C.primary, padding: "3px 8px", borderRadius: 999 }}>
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
            { id: s.id, title: s.title, image_url: s.image_url, badge: s.deal_label },
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
    return (
      <div style={{ padding: "20px" }}>
        <h2 style={headStyle}>Location</h2>
        <div style={{ background: C.surface, borderRadius: 16, overflow: "hidden", border: `1px solid ${C.border}` }}>
          {isSurrounds ? (
            <div style={{ padding: "24px 20px", textAlign: "left", fontFamily: FONT, fontSize: 14, color: C.heading }}>
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
              {listing.location && (
                <div style={{ padding: 16, display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <MapPin size={18} color={C.primary} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: C.heading }}>{listing.location}</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        {!isSurrounds && (
          <a
            href={directionsHref}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              marginTop: 14,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "8px 16px", borderRadius: 9999, height: 48,
              background: "#423324", border: "none",
              color: "#FFFFFF", textDecoration: "none",
              fontFamily: FONT, fontWeight: 500, fontSize: 14, lineHeight: "20px",
              letterSpacing: "0.01em",
              transition: "transform 150ms ease-out",
            }}
            {...pressScale()}
          >
            <Navigation size={16} strokeWidth={1.75} color="#FFFFFF" />
            <span>Get Directions</span>
          </a>
        )}
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
    <div style={{ minHeight: "100vh", background: C.bg, paddingBottom: 100, fontFamily: FONT, color: C.text }}>
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
            <button onClick={handleToggleFavourite} aria-label={isFavourited ? "Unsave" : "Save"} style={floatBtn}>
              <Heart size={20} strokeWidth={2} color={isFavourited ? "#715a3d" : C.primary} fill={isFavourited ? "#715a3d" : "none"} />
            </button>
            <button onClick={handleShare} aria-label="Share" style={floatBtn}>
              <Share2 size={20} strokeWidth={1.6} color={C.heading} />
            </button>
            {isAdmin && (
              <button onClick={() => navigate(`/admin/listings?edit=${listing.id}&returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`, { replace: true })} aria-label="Edit" style={floatBtn}>
                <Pencil size={18} strokeWidth={1.6} color={C.heading} />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ position: "relative", paddingTop: "env(safe-area-inset-top)", background: C.surface }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
            <button onClick={() => navigate(-1)} aria-label="Back" style={{ ...floatBtn, position: "relative" }}>
              <BackArrowIcon size={20} color={C.heading} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={handleToggleFavourite} aria-label={isFavourited ? "Unsave" : "Save"} style={floatBtn}>
                <Heart size={20} strokeWidth={2} color={isFavourited ? "#715a3d" : C.primary} fill={isFavourited ? "#715a3d" : "none"} />
              </button>
              <button onClick={handleShare} aria-label="Share" style={floatBtn}>
                <Share2 size={20} strokeWidth={1.6} color={C.heading} />
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

      {/* Title block */}
      <div style={{ background: C.surface, padding: "20px 20px 18px" }}>
        {listingCategories && listingCategories.length > 0 && (() => {
          const ordered = fromCategory
            ? [
                ...listingCategories.filter((c) => c.title === fromCategory),
                ...listingCategories.filter((c) => c.title !== fromCategory),
              ]
            : listingCategories;
          const titles = ordered.map((c) => c.title);
          if (titles.length === 0) return null;
          return (
            <div style={{
              marginBottom: 8,
              display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6,
            }}>
              {titles.map((t, i) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {i > 0 && (
                    <span aria-hidden style={{
                      width: 4, height: 4, borderRadius: "50%",
                      background: C.accent, flexShrink: 0,
                    }} />
                  )}
                  <span style={{
                    fontSize: 11,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: i === 0 ? C.primary : C.muted,
                    fontWeight: i === 0 ? 700 : 400,
                  }}>
                    {t}
                  </span>
                </div>
              ))}
            </div>
          );
        })()}

        <h1
          data-no-title-case={(listing as any).title_override?.trim() ? "true" : undefined}
          style={{
            margin: 0, fontFamily: HEAD, fontWeight: 700, fontSize: 28, lineHeight: 1.15,
            color: C.heading, letterSpacing: "0.01em",
          }}
        >
          {(listing as any).title_override?.trim()
            ? <span data-no-title-case="true">{(listing as any).title_override}</span>
            : listing.title}
        </h1>
        {listing.location && (() => {
          const isSurroundsLoc = listing.location.trim().toLowerCase() === "hoedspruit & surrounds";
          const mapHref = l.google_maps_link || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.location || listing.title)}`;
          if (isSurroundsLoc) {
            return (
              <div
                style={{
                  marginTop: 6, fontSize: 12, fontWeight: 400, color: C.muted, letterSpacing: "0.01em",
                  display: "flex", alignItems: "center", gap: 5,
                }}
              >
                <MapPin size={13} strokeWidth={1.75} color={C.muted} style={{ flexShrink: 0 }} />
                <span>{listing.location}</span>
              </div>
            );
          }
          return (
            <a
              href={mapHref}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                marginTop: 6, fontSize: 12, fontWeight: 400, color: C.muted, letterSpacing: "0.01em",
                display: "flex", alignItems: "center", gap: 5, textDecoration: "none",
              }}
            >
              <MapPin size={13} strokeWidth={1.75} color={C.muted} style={{ flexShrink: 0 }} />
              <span>{listing.location}</span>
            </a>
          );
        })()}
        {l.google_rating != null && (() => {
          const reviewsHref: string | null = l.google_reviews_url || null;
          const inner = (
            <>
              <Star size={12} fill={C.accent} color={C.accent} strokeWidth={0} />
              <span style={{ fontWeight: 400 }}>{Number(l.google_rating).toFixed(1).replace(/\.0$/, "")}</span>
              {l.google_reviews_count != null && (
                <span style={{ color: C.muted }}>({l.google_reviews_count})</span>
              )}
            </>
          );
          const baseStyle = {
            marginTop: 6, display: "flex", alignItems: "center", gap: 4,
            fontSize: 12, fontWeight: 400, color: C.heading, textDecoration: "none",
          } as const;
          return reviewsHref ? (
            <a href={reviewsHref} target="_blank" rel="noopener noreferrer" style={baseStyle}>
              {inner}
            </a>
          ) : (
            <div style={baseStyle}>{inner}</div>
          );
        })()}

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
        position: "sticky", top: 0, zIndex: 30,
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        display: "flex",
        padding: "0 8px",
        overflowX: "auto",
      }} className="scrollbar-hide">
        {visibleTabs.map(t => <TabBtn key={t.key} k={t.key} label={t.label} scrollable={visibleTabs.length > 4} />)}
      </nav>

      {/* Tab content */}
      <section style={{ background: C.bg }}>
        {tab === "about" && renderAbout()}
        {tab === "hours" && renderHours()}
        {tab === "contact" && renderContact()}
        {tab === "details" && renderDetails()}
        {tab === "specials" && renderSpecials()}
        {tab === "events" && renderEvents()}
        {tab === "gallery" && renderGallery()}
        {tab === "location" && renderLocation()}
      </section>


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
  fontFamily: HEAD, fontWeight: 700, fontSize: 22, lineHeight: 1.2,
  letterSpacing: 0, textTransform: "none",
  color: C.heading,
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

const SuggestEditFooter = ({ onClick }: { onClick: () => void }) => (
  <div style={{ marginTop: 32, textAlign: "center" }}>
    <button onClick={onClick} style={{
      background: "none", border: "none", cursor: "pointer", padding: 0,
      fontFamily: FONT, fontSize: 13, color: C.text,
      textDecoration: "underline", textUnderlineOffset: 3,
    }}>
      Suggest an edit to this listing.
    </button>
  </div>
);

// ----- Suggest edit sheet -----
const suggestInputStyle: React.CSSProperties = {
  fontFamily: FONT, fontWeight: 400, fontSize: 15, color: C.heading,
  background: "#fff", border: `2px solid #C5C0BA`, borderRadius: 12,
  padding: "13px 14px", outline: "none", width: "100%", boxSizing: "border-box",
  lineHeight: 1.4,
};

const suggestLabelStyle: React.CSSProperties = {
  fontFamily: FONT, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em",
  textTransform: "uppercase", color: "#423324", marginBottom: 6, display: "block",
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
        <h2 style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 22, color: C.heading, margin: "0 0 8px" }}>Suggest an Edit</h2>
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
