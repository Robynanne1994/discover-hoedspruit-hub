import { useRef, useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Star, Pencil, ChevronLeft, ChevronDown, ChevronRight,
  Heart, Share2, Check, X as XIcon, Phone, Navigation,
  MapPin, Mail, Globe, ArrowUpRight,
  ConciergeBell, Baby, Accessibility, Sparkles, Armchair,
  UtensilsCrossed, Soup, Music, Coffee, Car, HeartPulse,
  BedDouble, PawPrint, ShoppingBag, CreditCard, Package, Banknote, Info,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { isRestaurantCategory, isShoppingCategory, isAccommodationCategory } from "@/lib/categoryFields";
import BottomNav from "@/components/BottomNav";
import ImageLightbox from "@/components/ImageLightbox";
import { toast } from "sonner";
import { isSAPublicHoliday, getSADate } from "@/lib/southAfricaHolidays";
import { sanitizeDashes } from "@/lib/sanitizeListing";

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const FONT_BODY = "'Helvetica Neue', 'Helvetica World', Helvetica, Arial, sans-serif";
const FONT_HEAD = "'Helvetica World', 'Helvetica Neue', Helvetica, Arial, sans-serif";

// Design tokens
const C = {
  bg: "#EBEBEB",
  card: "#FFFFFF",
  coral: "#F26A48",
  panel: "#F2EFEC",
  border: "#E8E4DF",
  text: "#0A0A0A",
  muted: "#8A8480",
  xMuted: "#B8B3AE",
  mapBg: "#D8D3CB",
  mapGrid: "#CFC9C0",
};

const SHADOW_MD = "0 2px 8px rgba(0,0,0,0.06)";

const pressScale = (scale = "0.98") => ({
  onPointerDown: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = `scale(${scale})`),
  onPointerUp: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
  onPointerLeave: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
});

const pressOpacity = {
  onPointerDown: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.opacity = "0.6"),
  onPointerUp: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.opacity = "1"),
  onPointerLeave: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.opacity = "1"),
};

// Title-case helper for category names / labels (preserve & and short words like Wi-Fi)
const toTitleCase = (s: string) =>
  s.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

// Section heading (H2) — Helvetica World 500, 22px / 22px, -0.66px tracking
const SectionHeading = ({ children, mt = 18 }: { children: React.ReactNode; mt?: number }) => (
  <h2 style={{
    fontFamily: FONT_HEAD, fontWeight: 500, fontSize: 22, lineHeight: "22px",
    letterSpacing: "-0.66px", color: "#0A0A0A", margin: 0, marginTop: mt, marginBottom: 10,
    textTransform: "none",
  }}>
    {children}
  </h2>
);

const ListingDetail = () => {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const whatToKnowRef = useRef<HTMLDivElement>(null);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [suggestEditOpen, setSuggestEditOpen] = useState(false);
  const [galleryHintVisible, setGalleryHintVisible] = useState(true);
  const [mapCoords, setMapCoords] = useState<{ lat: number; lon: number } | null>(null);

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("listings").select("*").eq("id", id!).single();
      if (error) throw error;
      return sanitizeDashes(data);
    },
    enabled: !!id,
  });

  // Resolve map coordinates: parse from google_maps_link, else geocode location string via Nominatim
  useEffect(() => {
    if (!listing) return;
    setMapCoords(null);
    const link: string | null = (listing as any).google_maps_link || null;
    const loc: string | null = listing.location || null;

    // Try to parse @lat,lng or !3dlat!4dlng or q=lat,lng from a Google Maps URL
    const tryParse = (url: string): { lat: number; lon: number } | null => {
      const at = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (at) return { lat: parseFloat(at[1]), lon: parseFloat(at[2]) };
      const d = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
      if (d) return { lat: parseFloat(d[1]), lon: parseFloat(d[2]) };
      const q = url.match(/[?&]query=(-?\d+\.\d+),(-?\d+\.\d+)/) || url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
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
        } else {
          // Fallback: Hoedspruit town center
          setMapCoords({ lat: -24.3567, lon: 31.0 });
        }
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

  const { data: linkedSpecials } = useQuery({
    queryKey: ["listing-specials", id],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("specials")
        .select("*")
        .eq("business_id", id!)
        .eq("is_active", true)
        .or(`valid_from.is.null,valid_from.lte.${today}`)
        .or(`valid_until.is.null,valid_until.gte.${today}`)
        .order("sort_order", { ascending: true });
      return data || [];
    },
    enabled: !!id,
  });

  const { data: isFavourited } = useQuery({
    queryKey: ["favourite", "listing", id, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.from("favourites").select("id").eq("user_id", user.id).eq("item_id", id!).eq("item_type", "listing").maybeSingle();
      return !!data;
    },
    enabled: !!user && !!id,
  });

  const toggleFavourite = useMutation({
    mutationFn: async () => {
      if (!user) return;
      if (isFavourited) {
        await supabase.from("favourites").delete().eq("user_id", user.id).eq("item_id", id!).eq("item_type", "listing");
      } else {
        await supabase.from("favourites").insert({ user_id: user.id, item_id: id!, item_type: "listing" });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favourite", "listing", id] });
      queryClient.invalidateQueries({ queryKey: ["favourites"] });
      queryClient.invalidateQueries({ queryKey: ["saved-listings-page"] });
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
      try { await navigator.share({ title: listing?.title || "", url: shareUrl }); } catch (err) {
        if ((err as Error).name !== "AbortError") {
          try { await navigator.clipboard.writeText(shareUrl); toast.success("Link copied!"); } catch { toast.error("Could not copy link"); }
        }
      }
    } else {
      try { await navigator.clipboard.writeText(shareUrl); toast.success("Link copied!"); } catch { toast.error("Could not copy link"); }
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "transparent", fontFamily: FONT_BODY }}>
        <div style={{ padding: "52px 24px 0" }}>
          <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer" }}>
            <ChevronLeft size={20} strokeWidth={1.5} color={C.text} />
            <span style={{ fontSize: 15, color: C.text, fontFamily: FONT_BODY }}>Back</span>
          </button>
        </div>
        <div style={{ padding: "48px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <p style={{ fontSize: 13, color: C.muted, fontFamily: FONT_BODY }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div style={{ minHeight: "100vh", background: "transparent", fontFamily: FONT_BODY }}>
        <div style={{ padding: "52px 24px 0" }}>
          <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer" }}>
            <ChevronLeft size={20} strokeWidth={1.5} color={C.text} />
            <span style={{ fontSize: 15, color: C.text, fontFamily: FONT_BODY }}>Back</span>
          </button>
        </div>
        <div style={{ padding: "80px 20px", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: C.muted, marginBottom: 16, fontFamily: FONT_BODY }}>Listing not found.</p>
          <Link to="/" style={{ fontSize: 13, fontWeight: 500, color: C.text, fontFamily: FONT_BODY }}>Back to Home</Link>
        </div>
      </div>
    );
  }

  const firstCategory = listingCategories && listingCategories.length > 0 ? listingCategories[0] : null;
  const isListingRestaurant = listingCategories?.some((cat) => isRestaurantCategory(cat.title)) ?? false;
  const isListingShopping = listingCategories?.some((cat) => isShoppingCategory(cat.title)) ?? false;
  const isListingAccommodation = listingCategories?.some((cat) => isAccommodationCategory(cat.title)) ?? false;
  const galleryImages = (listing as any).gallery_images as string[] | null;
  const longDescription = (listing as any).long_description as string | null;
  const openingHours = (listing as any).opening_hours as Record<string, string> | null;
  const hasGallery = galleryImages && galleryImages.length > 0;
  const hasHours = !isListingAccommodation && openingHours && Object.values(openingHours).some((v) => v);
  const goodForKids = (listing as any).good_for_kids as boolean | null;
  const petsAllowed = (listing as any).pets_allowed as boolean | null;
  const wheelchairFriendly = (listing as any).wheelchair_friendly as boolean | null;
  const priceLevel = (listing as any).price_level as number | null;
  const meal = (listing as any).meal as string[] | null;
  const vibe = (listing as any).vibe as string[] | null;
  const cuisine = (listing as any).cuisine as string[] | null;
  const seating = (listing as any).seating as string[] | null;
  const kidsPlayground = (listing as any).kids_playground as boolean | null;
  const smokingAllowed = (listing as any).smoking_allowed as boolean | null;
  const serviceType = (listing as any).service_type as string[] | null;
  const kidsMenu = (listing as any).kids_menu as boolean | null;
  const highChairs = (listing as any).high_chairs as boolean | null;
  const wheelchairCarPark = (listing as any).wheelchair_car_park as boolean | null;
  const wheelchairEntrance = (listing as any).wheelchair_entrance as boolean | null;
  const wheelchairSeating = (listing as any).wheelchair_seating as boolean | null;
  const wheelchairToilet = (listing as any).wheelchair_toilet as boolean | null;
  const hasToilet = (listing as any).has_toilet as boolean | null;
  const hasWifi = (listing as any).has_wifi as boolean | null;
  const hasFreeWifi = (listing as any).has_free_wifi as boolean | null;

  type AccField = { label: string; value: boolean | string | null };
  type AccSection = { key: string; title: string; fields: AccField[] };
  const accordionSections: AccSection[] = [];

  const filterDefined = (arr: AccField[]) => arr.filter(f => f.value === true || f.value === false);

  // Pricing accordion (shown for any listing with price_level)
  if (priceLevel) {
    const pricingLabels: Record<number, string> = { 1: "Budget-friendly", 2: "Mid-range", 3: "Upscale", 4: "Fine dining" };
    accordionSections.push({
      key: "pricing",
      title: "Pricing",
      fields: [{ label: pricingLabels[priceLevel] || "R".repeat(priceLevel), value: "R".repeat(priceLevel) }],
    });
  }

  if (isListingRestaurant) {
    const serviceArr = serviceType || [];
    const knownServices = ["Dine-in", "Takeaway", "Delivery", "Reservations"];
    const normalizedService = serviceArr.map(s => s === "Take Away" ? "Takeaway" : s === "Sit Down" || s === "Sit down" ? "Dine-in" : s);
    const serviceFields: AccField[] = knownServices.map(opt => ({
      label: opt,
      value: normalizedService.some(s => s.toLowerCase() === opt.toLowerCase()),
    }));
    normalizedService.forEach(s => {
      if (!knownServices.some(k => k.toLowerCase() === s.toLowerCase())) {
        serviceFields.push({ label: s, value: true });
      }
    });
    if (serviceFields.length > 0) accordionSections.push({ key: "service", title: "Service options", fields: serviceFields });

    const kidsFields = filterDefined([
      { label: "Good for kids", value: goodForKids },
      { label: "Kids' menu", value: kidsMenu },
      { label: "High chairs", value: highChairs },
      { label: "Kids playground", value: kidsPlayground },
    ]);
    if (kidsFields.length > 0) accordionSections.push({ key: "kids", title: "Kids & family", fields: kidsFields });

    const accessFields = filterDefined([
      { label: "Wheelchair friendly", value: wheelchairFriendly },
      { label: "Accessible entrance", value: wheelchairEntrance },
      { label: "Accessible seating", value: wheelchairSeating },
      { label: "Accessible toilet", value: wheelchairToilet },
      { label: "Accessible parking", value: wheelchairCarPark },
    ]);
    if (accessFields.length > 0) accordionSections.push({ key: "accessibility", title: "Accessibility", fields: accessFields });

    const amenFields = filterDefined([
      { label: "Toilets", value: hasToilet },
      { label: "Wi-Fi", value: hasWifi },
      { label: "Free Wi-Fi", value: hasFreeWifi },
      { label: "Smoking section", value: smokingAllowed },
      { label: "Pet friendly", value: petsAllowed },
    ]);
    if (amenFields.length > 0) accordionSections.push({ key: "amenities", title: "Amenities", fields: amenFields });

    if (seating && seating.length > 0) {
      accordionSections.push({ key: "seating", title: "Seating", fields: seating.map(s => ({ label: toTitleCase(s.replace(/ seating$/i, "")), value: true })) });
    }
    if (meal && meal.length > 0) accordionSections.push({ key: "meals", title: "Meals served", fields: meal.map(m => ({ label: toTitleCase(m), value: true })) });
    if (cuisine && cuisine.length > 0) accordionSections.push({ key: "cuisine", title: "Cuisine", fields: cuisine.map(c => ({ label: toTitleCase(c), value: true })) });
    if (vibe && vibe.length > 0) accordionSections.push({ key: "vibe", title: "Vibe", fields: vibe.map(v => ({ label: toTitleCase(v), value: true })) });
  }

  if (isListingAccommodation) {
    const l = listing as any;
    const food = filterDefined([
      { label: "Restaurant", value: l.has_restaurant },
      { label: "Bar", value: l.has_bar },
      { label: "Room service", value: l.has_room_service },
      { label: "Breakfast", value: l.has_breakfast },
    ]);
    if (food.length > 0) accordionSections.push({ key: "accom-food", title: "Food & drink", fields: food });

    const transport = filterDefined([
      { label: "Airport shuttle", value: l.has_airport_shuttle },
      { label: "Free parking", value: l.has_free_parking },
      { label: "Secure parking", value: l.has_secure_parking },
    ]);
    if (transport.length > 0) accordionSections.push({ key: "accom-transport", title: "Transport", fields: transport });

    const wellness = filterDefined([
      { label: "Spa", value: l.has_spa },
      { label: "Fitness centre", value: l.has_fitness_centre },
      { label: "Swimming pool", value: l.has_swimming_pool },
    ]);
    if (wellness.length > 0) accordionSections.push({ key: "accom-wellness", title: "Wellness", fields: wellness });

    const rooms = filterDefined([
      { label: "Aircon", value: l.has_aircon },
      { label: "Laundry service", value: l.has_laundry },
      { label: "Wi-Fi", value: l.has_wifi_accom },
    ]);
    if (rooms.length > 0) accordionSections.push({ key: "accom-rooms", title: "Rooms", fields: rooms });

    if (l.child_friendly === true) accordionSections.push({ key: "accom-children", title: "Children", fields: [{ label: "Child friendly", value: true }] });
    if (l.pets_allowed === true) accordionSections.push({ key: "accom-pets", title: "Pets", fields: [{ label: "Pet friendly", value: true }] });
  }

  if (isListingShopping) {
    const l = listing as any;
    const shop = filterDefined([
      { label: "Air conditioned", value: l.air_conditioned },
      { label: "Delivery available", value: l.delivery_available },
      { label: "Click & collect", value: l.click_and_collect },
      { label: "Order online", value: l.order_online },
      { label: "Parking available", value: l.parking_available },
      { label: "Wheelchair friendly", value: l.wheelchair_friendly },
      { label: "Local products", value: l.local_products },
      { label: "Curio / gifts", value: l.curio_or_gifts },
    ]);
    if (shop.length > 0) accordionSections.push({ key: "shop-amenities", title: "Amenities", fields: shop });
    if (l.payment_methods && l.payment_methods.length > 0) {
      accordionSections.push({ key: "shop-payment", title: "Payment", fields: l.payment_methods.map((p: string) => ({ label: toTitleCase(p), value: true })) });
    }
    if (l.product_categories && l.product_categories.length > 0) {
      accordionSections.push({ key: "shop-products", title: "Products", fields: l.product_categories.map((p: string) => ({ label: toTitleCase(p), value: true })) });
    }
  }

  // Custom detail rows (up to 3) — always last in the Details card
  {
    const l = listing as any;
    for (let i = 1; i <= 3; i++) {
      const t = (l[`custom_title_${i}`] || "").toString().trim();
      const v = (l[`custom_text_${i}`] || "").toString().trim();
      if (t && v) {
        accordionSections.push({
          key: `custom-${i}`,
          title: t,
          fields: [{ label: v, value: "__custom_text__" }],
        });
      }
    }
  }

  const descriptionText = longDescription || listing.description;

  const toggleAccordion = (key: string) => {
    setOpenAccordion(openAccordion === key ? null : key);
  };

  const todayIndex = new Date().getDay();
  const todayLabel = todayIndex === 0 ? "Sunday" : DAY_LABELS[todayIndex - 1];

  const parseTimeStr = (s: string) => {
    const norm = s.replace(".", ":").trim();
    const [h, mm] = norm.split(":");
    return parseInt(h, 10) * 60 + (mm ? parseInt(mm, 10) : 0);
  };
  const formatTime = (s: string) => (s.includes(":") ? s : `${s}:00`);

  type OpenStatus =
    | { state: "open"; closes: string }
    | { state: "closed"; opensAt?: string; opensDay?: string }
    | { state: "temporarily_closed" };

  const computeOpenStatus = (): OpenStatus | null => {
    if (!openingHours) return null;
    const todayKey = todayLabel.toLowerCase();
    const todayVal = openingHours[todayKey] || "";
    if (todayVal && /temporarily\s*closed/i.test(todayVal)) return { state: "temporarily_closed" };

    const findNextOpen = (startOffset: number): { opensAt: string; opensDay: string } | null => {
      for (let i = startOffset; i < startOffset + 7; i++) {
        const idx = (DAY_LABELS.indexOf(todayLabel) + i) % 7;
        const dayName = DAY_LABELS[idx];
        const v = openingHours[dayName.toLowerCase()] || "";
        if (!v || v.toLowerCase() === "closed") continue;
        const mm = v.match(/(\d{1,2}[:.]?\d{0,2})\s*[-–]\s*(\d{1,2}[:.]?\d{0,2})/);
        if (!mm) continue;
        const label = i === 1 ? "tomorrow" : dayName;
        return { opensAt: formatTime(mm[1]), opensDay: label };
      }
      return null;
    };

    if (!todayVal || todayVal.toLowerCase() === "closed") {
      const next = findNextOpen(1);
      return { state: "closed", ...(next || {}) };
    }
    const m = todayVal.match(/(\d{1,2}[:.]?\d{0,2})\s*[-–]\s*(\d{1,2}[:.]?\d{0,2})/);
    if (!m) return { state: "open", closes: todayVal };
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    const o = parseTimeStr(m[1]);
    const c = parseTimeStr(m[2]);
    if (cur >= o && cur <= c) return { state: "open", closes: formatTime(m[2]) };
    if (cur < o) return { state: "closed", opensAt: formatTime(m[1]), opensDay: "today" };
    const next = findNextOpen(1);
    return { state: "closed", ...(next || {}) };
  };
  const openStatus = computeOpenStatus();

  const circleBtn: React.CSSProperties = {
    width: 44, height: 44, borderRadius: 999,
    background: C.card,
    boxShadow: SHADOW_MD,
    display: "flex", alignItems: "center", justifyContent: "center",
    border: "none", cursor: "pointer",
    transition: "transform 150ms ease-out",
  };

  const whatsappNum = (listing as any).whatsapp as string | null;
  const waCleanNum = whatsappNum ? whatsappNum.replace(/[^0-9]/g, "") : null;
  const formatWhatsappDisplay = (raw: string, clean: string) => {
    if (clean.startsWith("27") && clean.length === 11) {
      const local = "0" + clean.slice(2);
      return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
    }
    return raw;
  };
  const WhatsappIcon = ({ color }: { color: string }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.057 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.889-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.887 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.47 3.488"/>
    </svg>
  );
  const contactRows = [
    listing.location && {
      label: "Address",
      value: listing.location,
      icon: MapPin,
      href: (listing as any).google_maps_link || undefined,
    },
    listing.phone && {
      label: "Phone",
      value: listing.phone,
      icon: Phone,
      href: `tel:${listing.phone.replace(/\s/g, "")}`,
    },
    listing.email && {
      label: "Email",
      value: listing.email,
      icon: Mail,
      href: `mailto:${listing.email}`,
    },
    listing.website && {
      label: "Website",
      value: ((listing as any).website_label && String((listing as any).website_label).trim())
        ? String((listing as any).website_label).trim()
        : listing.website.replace(/^https?:\/\//, "").replace(/\/$/, ""),
      icon: Globe,
      href: listing.website,
    },
    waCleanNum && {
      label: "WhatsApp",
      value: formatWhatsappDisplay(whatsappNum!, waCleanNum),
      icon: WhatsappIcon,
      href: `https://wa.me/${waCleanNum}`,
      isCustomIcon: true,
    },
  ].filter(Boolean) as Array<{ label: string; value: string; icon: any; href: string; isCustomIcon?: boolean }>;

  const aboutText = (longDescription || listing.description || "").trim();
  const aboutParagraphs = aboutText.split("\n").filter(Boolean);
  const isAboutLong = aboutText.length > 120;

  return (
    <div style={{ minHeight: "100vh", background: "transparent", paddingBottom: 140, fontFamily: FONT_BODY, color: C.text }}>
      <style>{`
        @keyframes hh-acc-open {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ position: "relative", borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: "hidden" }}>
        {listing.image_url ? (
          <img
            src={listing.image_url}
            alt={listing.title}
            style={{ width: "100%", height: 360, objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{ width: "100%", height: 360, background: C.panel }} />
        )}

        <button
          onClick={() => navigate(-1)}
          style={{ ...circleBtn, position: "absolute", top: 12, left: 12 }}
          aria-label="Back"
          {...pressScale("0.94")}
        >
          <ChevronLeft size={20} strokeWidth={1.5} color={C.text} />
        </button>

        <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 8 }}>
          <button
            onClick={handleShare}
            style={circleBtn}
            aria-label="Share"
            {...pressScale("0.94")}
          >
            <Share2 size={20} strokeWidth={1.5} color={C.text} />
          </button>
          <button
            onClick={() => { if (!requireAuth()) toggleFavourite.mutate(); }}
            style={circleBtn}
            aria-label={isFavourited ? "Remove from saved" : "Save"}
            {...pressScale("0.94")}
          >
            <Heart size={20} strokeWidth={1.5} color={isFavourited ? "#5b4632" : C.text} fill={isFavourited ? "#5b4632" : "none"} />
          </button>
          {isAdmin && (
            <button
              onClick={() => navigate(`/admin/listings?edit=${listing.id}&returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`, { replace: true })}
              style={circleBtn}
              aria-label="Edit listing"
              {...pressScale("0.94")}
            >
              <Pencil size={20} strokeWidth={1.5} color={C.text} />
            </button>
          )}
        </div>
      </div>

      <div style={{
        position: "relative",
        marginTop: 16,
        background: "transparent",
        paddingLeft: 24, paddingRight: 24,
      }}>
        {firstCategory && (
          <p style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontWeight: 400, fontSize: 12, lineHeight: "14.4px",
            letterSpacing: "0.24px", color: "#0a0a0a", margin: 0, marginBottom: 4,
            textTransform: "none",
          }}>
            {firstCategory.title}
          </p>
        )}

        <h1 style={{
          fontFamily: '"Helvetica World", Helvetica, Arial, sans-serif', fontWeight: 500, fontSize: 28, lineHeight: "28px",
          letterSpacing: "-0.84px", color: "#0A0A0A", margin: 0, marginBottom: 8,
        }}>
          {listing.title}
        </h1>

        <div style={{
          marginTop: 20, display: "flex", flexWrap: "wrap", alignItems: "center",
          gap: 0,
          fontFamily: FONT_BODY, fontSize: 13, letterSpacing: "0.13px", color: C.muted,
        }}>
          {(listing as any).google_rating != null && (
            <>
              <span style={{ color: C.text, display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Star size={13} fill="#5b4632" color="#5b4632" strokeWidth={1.5} />
                <span>{(listing as any).google_rating}</span>
              </span>
              {(listing as any).google_reviews_count != null && (
                <span style={{ marginLeft: 4, color: "#0a0a0a" }}>({(listing as any).google_reviews_count})</span>
              )}
            </>
          )}
          {/* Price level moved to Details > Pricing accordion */}
          {openStatus && (
            <>
              <span style={{ margin: "0 8px" }}>·</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.text }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: openStatus.state === "open" ? "#1f9d55" : "#d23f3f", display: "inline-block" }} />
                {openStatus.state === "open" ? "Open Now" : openStatus.state === "temporarily_closed" ? "Temporarily Closed" : "Closed"}
              </span>
            </>
          )}
        </div>

        {(listing.phone || (listing as any).google_maps_link) && (
          <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
            {listing.phone && (
              <a
                href={`tel:${listing.phone}`}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  height: 48, borderRadius: 999, padding: "0 24px",
                  background: "#5b4632", color: "#FFFFFF",
                  textDecoration: "none", cursor: "pointer",
                  transition: "transform 150ms ease-out",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  fontFamily: FONT_BODY, fontSize: 15, fontWeight: 400,
                  lineHeight: "18px", letterSpacing: 0,
                }}
                {...pressScale()}
              >
                <Phone size={18} strokeWidth={1.5} color="#FFFFFF" />
                <span>Call Now</span>
              </a>
            )}
            {(listing as any).google_maps_link && (
              <a
                href={(listing as any).google_maps_link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  height: 48, borderRadius: 999, padding: "0 24px",
                  background: "#5b4632", color: "#FFFFFF",
                  textDecoration: "none", cursor: "pointer",
                  transition: "transform 150ms ease-out",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  fontFamily: FONT_BODY, fontSize: 15, fontWeight: 400,
                  lineHeight: "18px", letterSpacing: 0,
                }}
                {...pressScale()}
              >
                <Navigation size={18} strokeWidth={1.5} color="#FFFFFF" />
                <span>Directions</span>
              </a>
            )}
          </div>
        )}

        {hasGallery && (
          <div style={{ position: "relative", marginTop: 24, marginLeft: -24, marginRight: -24 }}>
            <div
              style={{
                overflowX: "auto", WebkitOverflowScrolling: "touch",
              }}
              className="scrollbar-hide"
              onScroll={(e) => {
                if (e.currentTarget.scrollLeft > 8 && galleryHintVisible) setGalleryHintVisible(false);
              }}
            >
              <div style={{ display: "inline-flex", gap: 10, paddingLeft: 24, paddingRight: 24 }}>
                {galleryImages!.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
                    style={{
                      width: 120, height: 120, borderRadius: 16, overflow: "hidden",
                      background: C.panel, flexShrink: 0, border: "none", padding: 0, cursor: "pointer",
                    }}
                    aria-label={`Open image ${i + 1}`}
                  >
                    <img src={url} alt={`${listing.title} ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                  </button>
                ))}
              </div>
            </div>
            {galleryImages && galleryImages.length > 3 && (
              <div
                aria-hidden="true"
                style={{
                  position: "absolute", top: "50%", right: 12, transform: "translateY(-50%)",
                  width: 32, height: 32, borderRadius: 999,
                  background: "rgba(255,255,255,0.92)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  pointerEvents: "none",
                  opacity: galleryHintVisible ? 1 : 0,
                  transition: "opacity 200ms ease-out",
                }}
              >
                <ChevronRight size={18} strokeWidth={1.75} color={C.text} />
              </div>
            )}
          </div>
        )}

        {contactRows.length > 0 && (
          <>
            <SectionHeading mt={32}>Contact</SectionHeading>
            <div style={{ background: C.card, borderRadius: 24, paddingLeft: 20, paddingRight: 20 }}>
              {contactRows.map((row, idx) => {
                const Wrapper: any = row.href ? "a" : "div";
                const wrapperProps = row.href ? { href: row.href, target: "_blank", rel: "noopener noreferrer" } : {};
                return (
                  <div key={row.label} style={{
                    borderTop: idx > 0 ? `1px solid ${C.border}` : "none",
                  }}>
                    <Wrapper
                      {...wrapperProps}
                      style={{
                        display: "flex", alignItems: "center", height: 56, textDecoration: "none",
                      }}
                    >
                      <div style={{ marginRight: 14, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 18 }}>
                        {row.isCustomIcon
                          ? <row.icon color="#898480" />
                          : <row.icon size={18} strokeWidth={1.5} color="#898480" className="text-[#898480]" />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontFamily: FONT_BODY, fontSize: 14, fontWeight: 400, color: C.text,
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
          </>
        )}

        {aboutText && (
          <>
            <SectionHeading mt={32}>About</SectionHeading>
            <div style={{
              ...(!aboutExpanded && isAboutLong ? { display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const, overflow: "hidden" } : {})
            }}>
              {aboutParagraphs.map((p, i) => (
                <p key={i} style={{
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                  fontWeight: 400,
                  fontSize: 14,
                  lineHeight: "20.3px",
                  letterSpacing: 0,
                  color: "#0A0A0A",
                  margin: 0,
                  marginBottom: i < aboutParagraphs.length - 1 ? 12 : 0,
                }}>
                  {p}
                </p>
              ))}
            </div>
            {isAboutLong && (
              <button
                onClick={() => setAboutExpanded(!aboutExpanded)}
                style={{
                  marginTop: 6,
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                  fontWeight: 400,
                  fontSize: 14,
                  color: "#0A0A0A",
                  textTransform: "none",
                  textDecoration: "underline",
                  textUnderlineOffset: "3px",
                  transition: "opacity 0.12s ease",
                }}
                {...pressOpacity}
              >
                {aboutExpanded ? "Show Less" : "Read More"}
              </button>
            )}
          </>
        )}

        {accordionSections.length > 0 && (
          <>
            <SectionHeading mt={32}>Details</SectionHeading>
            <div style={{
              background: C.card, borderRadius: 24, paddingLeft: 20, paddingRight: 20, overflow: "hidden",
            }}>
              {accordionSections.map((section, i) => {
                const isOpen = openAccordion === section.key;
                const sectionIconMap: Record<string, any> = {
                  pricing: Banknote,
                  service: ConciergeBell,
                  kids: Baby,
                  accessibility: Accessibility,
                  amenities: Sparkles,
                  seating: Armchair,
                  meals: UtensilsCrossed,
                  cuisine: Soup,
                  vibe: Music,
                  "accom-food": Coffee,
                  "accom-transport": Car,
                  "accom-wellness": HeartPulse,
                  "accom-rooms": BedDouble,
                  "accom-children": Baby,
                  "accom-pets": PawPrint,
                  "shop-amenities": ShoppingBag,
                  "shop-payment": CreditCard,
                  "shop-products": Package,
                  "custom-1": Info,
                  "custom-2": Info,
                  "custom-3": Info,
                };
                const SectionIcon = sectionIconMap[section.key] || Sparkles;
                return (
                  <div key={section.key} style={{
                    borderTop: i > 0 ? `1px solid ${C.border}` : "none",
                  }}>
                    <button
                      onClick={() => toggleAccordion(section.key)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                        height: 56,
                        background: "none", border: "none", cursor: "pointer", fontFamily: FONT_BODY,
                        padding: 0,
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
                        <span style={{ marginRight: 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 20 }}>
                          <SectionIcon size={20} strokeWidth={1.5} color="#8A8480" />
                        </span>
                        <span
                          ref={(el) => { if (el) el.style.setProperty("text-transform", "none", "important"); }}
                          style={{
                            fontFamily: FONT_BODY, fontWeight: 400, fontSize: 14, lineHeight: 1.35, letterSpacing: 0,
                            color: C.text,
                          }}
                        >
                          {section.title}
                        </span>
                      </span>
                      <ChevronDown
                        size={20}
                        strokeWidth={1.5}
                        color={C.text}
                        style={{
                          transition: "transform 300ms cubic-bezier(0.2, 0.8, 0.2, 1)",
                          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        }}
                      />
                    </button>
                    {isOpen && (() => {
                      const isCustomText = section.key.startsWith("custom-");
                      if (isCustomText) {
                        const textValue = section.fields[0]?.label || "";
                        // Parse [text](url) markdown links and bare URLs
                        const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s]+)/g;
                        const parts: Array<string | { text: string; url: string }> = [];
                        let lastIndex = 0;
                        let m: RegExpExecArray | null;
                        while ((m = linkRegex.exec(textValue)) !== null) {
                          if (m.index > lastIndex) parts.push(textValue.slice(lastIndex, m.index));
                          if (m[1] && m[2]) parts.push({ text: m[1], url: m[2] });
                          else if (m[3]) parts.push({ text: m[3], url: m[3] });
                          lastIndex = m.index + m[0].length;
                        }
                        if (lastIndex < textValue.length) parts.push(textValue.slice(lastIndex));
                        return (
                          <div style={{
                            paddingBottom: 20, paddingTop: 4,
                            animation: "hh-acc-open 300ms cubic-bezier(0.2, 0.8, 0.2, 1)",
                          }}>
                            <div style={{
                              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                              fontWeight: 400, fontSize: 14, lineHeight: 1.45, letterSpacing: 0,
                              color: "#0A0A0A",
                              textTransform: "none",
                              whiteSpace: "pre-wrap",
                              overflowWrap: "anywhere",
                              wordBreak: "break-word",
                              maxWidth: "100%",
                            }}>
                              {parts.map((p, idx) => typeof p === "string" ? (
                                <span key={idx}>{p}</span>
                              ) : (
                                <a
                                  key={idx}
                                  href={p.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    color: "#5b4632",
                                    textDecoration: "underline",
                                    textUnderlineOffset: 2,
                                    display: "inline",
                                  }}
                                >
                                  {p.text}
                                  <ArrowUpRight size={14} strokeWidth={2} color="#5b4632" style={{ display: "inline", verticalAlign: "-2px", marginLeft: 2 }} />
                                </a>
                              ))}
                            </div>
                          </div>
                        );
                      }
                              {textValue}
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div style={{
                          paddingBottom: 20, paddingTop: 4,
                          display: "grid", gridTemplateColumns: "1fr 1fr",
                          columnGap: 16, rowGap: 12,
                          animation: "hh-acc-open 300ms cubic-bezier(0.2, 0.8, 0.2, 1)",
                        }}>
                          {section.fields.map((f, fi) => {
                            const isOn = f.value === true || (typeof f.value === "string");
                            const labelText = typeof f.value === "string" ? `${f.label}: ${f.value}` : f.label;
                            return (
                              <div key={fi} style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                                {isOn ? (
                                  <Check size={18} strokeWidth={2} color={C.coral} style={{ flexShrink: 0 }} />
                                ) : (
                                  <XIcon size={18} strokeWidth={2} color={C.xMuted} style={{ flexShrink: 0 }} />
                                )}
                                <span style={{
                                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                                  fontWeight: 400, fontSize: 16, lineHeight: "20px", letterSpacing: 0,
                                  color: "#0A0A0A",
                                  textTransform: "none",
                                }}>
                                  {labelText}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div ref={whatToKnowRef} />
        {hasHours && (() => {
          const saToday = getSADate();
          const holidayCheck = isSAPublicHoliday(saToday);
          return (
            <>
              <SectionHeading mt={32}>Hours</SectionHeading>
              {holidayCheck.isHoliday && (
                <div style={{
                  marginBottom: 12, padding: "10px 14px", background: C.panel, borderRadius: 12,
                  fontFamily: FONT_BODY, fontSize: 13, color: C.text,
                }}>
                  Public holiday — hours might differ
                </div>
              )}
              <div style={{
                background: C.card, borderRadius: 24, overflow: "hidden",
              }}>
                {openStatus && (
                  <div style={{
                    background: C.panel,
                    paddingTop: 20, paddingBottom: 22, paddingLeft: 24, paddingRight: 24,
                  }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <span style={{
                        width: 10, height: 10, borderRadius: "50%",
                        background: openStatus.state === "open" ? "#1f9d55" : "#d23f3f",
                        display: "inline-block", marginRight: 12, flexShrink: 0,
                      }} />
                      <span style={{
                        fontFamily: FONT_BODY, fontWeight: 400, fontSize: 22,
                        lineHeight: "25.3px", letterSpacing: "-0.22px", color: C.text,
                      }}>
                        {openStatus.state === "open"
                          ? "Open Now"
                          : openStatus.state === "temporarily_closed"
                          ? "Temporarily Closed"
                          : "Closed"}
                      </span>
                    </div>
                    {openStatus.state === "open" && (
                      <div style={{
                        marginTop: 4, marginLeft: 22,
                        fontFamily: FONT_BODY, fontWeight: 400, fontSize: 14,
                        lineHeight: "20.3px", color: C.muted,
                      }}>
                        Closes {openStatus.closes}
                      </div>
                    )}
                    {openStatus.state === "closed" && openStatus.opensAt && (
                      <div style={{
                        marginTop: 4,
                        fontFamily: FONT_BODY, fontWeight: 400, fontSize: 14,
                        lineHeight: "20.3px", color: C.muted,
                      }}>
                        Opens {openStatus.opensAt} {openStatus.opensDay}
                      </div>
                    )}
                  </div>
                )}
                <div style={{ paddingLeft: 20, paddingRight: 20 }}>
                {DAY_LABELS.map((day, i) => {
                  const key = day.toLowerCase();
                  const value = openingHours![key] || "";
                  const isClosed = !value || value.toLowerCase() === "closed";
                  const isToday = day === todayLabel;
                  return (
                    <div key={day} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      height: 48,
                      borderTop: i === 0 ? "none" : `1px solid ${C.border}`,
                    }}>
                      <span style={{ display: "inline-flex", alignItems: "center" }}>
                        {isToday && (
                          <span style={{
                            width: 6, height: 6, borderRadius: "50%",
                            background: C.coral, display: "inline-block", marginRight: 8,
                          }} />
                        )}
                        <span style={{
                          fontFamily: FONT_BODY,
                          fontWeight: 400,
                          fontSize: 14,
                          color: isToday ? C.text : C.muted,
                        }}>
                          {day}{isToday ? " · Today" : ""}
                        </span>
                      </span>
                      <span style={{
                        fontFamily: FONT_BODY, fontWeight: 400, fontSize: 14,
                        color: isToday ? C.text : C.muted,
                      }}>
                        {isClosed ? "Closed" : value}
                      </span>
                    </div>
                  );
                })}
                </div>
              </div>
            </>
          );
        })()}

        {(listing.location || (listing as any).google_maps_link) && (
          <>
            <SectionHeading mt={32}>Location</SectionHeading>
            <a
              href={(listing as any).google_maps_link || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.location || listing.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "block", textDecoration: "none" }}
              {...pressScale("0.99")}
            >
              <div style={{
                position: "relative", height: 200, borderRadius: 24, overflow: "hidden",
                background: C.mapBg,
              }}>
                {mapCoords && (() => {
                  const d = 0.006; // ~600m bbox for a tight neighbourhood view
                  const bbox = `${mapCoords.lon - d}%2C${mapCoords.lat - d}%2C${mapCoords.lon + d}%2C${mapCoords.lat + d}`;
                  return (
                    <iframe
                      title="Map"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${mapCoords.lat}%2C${mapCoords.lon}`}
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0, pointerEvents: "none" }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  );
                })()}
                <div style={{
                  position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -100%)",
                  pointerEvents: "none",
                }}>
                  <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 0C6.27 0 0 6.06 0 13.55c0 9.7 12.6 21.45 13.13 21.95a1.27 1.27 0 0 0 1.74 0C15.4 35 28 23.25 28 13.55 28 6.06 21.73 0 14 0z" fill={C.coral}/>
                    <circle cx="14" cy="13" r="4.5" fill="#FFFFFF"/>
                  </svg>
                </div>
              </div>
              {listing.location && (
              <div style={{
                marginTop: 12,
                background: C.card, borderRadius: 16, boxShadow: SHADOW_MD,
                minHeight: 48, display: "flex", alignItems: "center",
                paddingLeft: 16, paddingRight: 12, paddingTop: 10, paddingBottom: 10,
              }}>
                <span style={{
                  flex: 1, fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.4, color: C.text,
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
                }}>
                  {listing.location}
                </span>
                  <ArrowUpRight size={18} strokeWidth={1.5} color="#5b4632" style={{ flexShrink: 0, marginLeft: 8 }} />
                </div>
              )}
            </a>
          </>
        )}

        {linkedSpecials && linkedSpecials.length > 0 && (
          <>
            <SectionHeading mt={32}>Current Specials</SectionHeading>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {linkedSpecials.map((sp: any) => (
                <Link
                  key={sp.id}
                  to={`/specials/${sp.id}`}
                  style={{
                    background: C.card, borderRadius: 24, padding: 16,
                    display: "flex", alignItems: "center", gap: 14,
                    textDecoration: "none",
                    transition: "transform 0.15s ease-out",
                  }}
                  {...pressScale("0.99")}
                >
                  <div style={{
                    width: 56, height: 56, borderRadius: 16, overflow: "hidden",
                    background: C.panel, flexShrink: 0,
                  }}>
                    {sp.image_url && (
                      <img src={sp.image_url} alt={sp.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {sp.deal_label && (
                      <p style={{
                        fontFamily: FONT_BODY, fontSize: 11, color: "#5b4632", margin: 0, marginBottom: 2,
                        textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 400,
                      }}>
                        {sp.deal_label}
                      </p>
                    )}
                    <p style={{
                      fontFamily: FONT_BODY, fontSize: 15, color: C.text, margin: 0, fontWeight: 400,
                      overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box",
                      WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const,
                    }}>
                      {sp.title}
                    </p>
                    {(sp.day_of_week || sp.valid_until) && (
                      <p style={{
                        fontFamily: FONT_BODY, fontSize: 12, color: C.muted, margin: 0, marginTop: 2,
                      }}>
                        {sp.day_of_week && sp.day_of_week.length > 0 ? sp.day_of_week.join(", ") : `Until ${sp.valid_until}`}
                      </p>
                    )}
                  </div>
                  <ArrowUpRight size={18} strokeWidth={1.5} color={C.text} style={{ flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          </>
        )}

        <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
          <button
            onClick={() => setSuggestEditOpen(true)}
            style={{
              fontFamily: FONT_BODY, fontSize: 13, color: "#5b4632",
              textDecoration: "underline", textUnderlineOffset: "3px",
              background: "transparent", border: "none", cursor: "pointer", padding: 0,
            }}
          >
            Suggest an edit to this listing
          </button>
        </div>

        <SuggestEditSheet
          open={suggestEditOpen}
          onClose={() => setSuggestEditOpen(false)}
          listingTitle={listing.title}
        />
      </div>

      <ImageLightbox
        images={galleryImages ?? []}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        alt={listing.title}
      />

      <BottomNav />
    </div>
  );
};

const suggestInputStyle: React.CSSProperties = {
  fontFamily: FONT_BODY,
  fontWeight: 400,
  fontSize: 14,
  color: C.text,
  background: C.panel,
  border: "none",
  borderRadius: 14,
  padding: "14px 16px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const SuggestEditSheet = ({
  open, onClose, listingTitle,
}: { open: boolean; onClose: () => void; listingTitle: string }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [editType, setEditType] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const submit = async () => {
    if (!name.trim() || !email.trim() || !editType.trim() || !details.trim()) {
      toast.error("Please fill in all the fields.");
      return;
    }
    setSubmitting(true);
    const composed = `[Suggest an edit]\nListing: ${listingTitle}\nWhat needs updating: ${editType.trim()}\n\nDetails:\n${details.trim()}`;
    const { error } = await supabase.from("contact_submissions").insert({
      name: name.trim(),
      email: email.trim(),
      message: composed,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Couldn't send right now. Try again shortly.");
      return;
    }
    toast.success("Thanks — we'll take a look.");
    setName(""); setEmail(""); setEditType(""); setDetails("");
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(10,10,10,0.4)", display: "flex", alignItems: "flex-end" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          fontFamily: FONT_BODY,
          width: "100%",
          background: C.card,
          borderRadius: "24px 24px 0 0",
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          padding: "20px 24px 32px",
          animation: "ld-slide-up 250ms cubic-bezier(0.2, 0.8, 0.2, 1)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <style>{`@keyframes ld-slide-up { from { transform: translateY(100%);} to { transform: translateY(0);} }`}</style>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontFamily: FONT_BODY, fontWeight: 500, fontSize: 12, lineHeight: "14.4px", letterSpacing: "0.24px", color: C.muted, textTransform: "uppercase" }}>Help Us Improve</div>
          <button onClick={onClose} aria-label="Close" style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4 }}>
            <XIcon size={20} color={C.text} strokeWidth={1.75} />
          </button>
        </div>
        <h2 style={{ fontFamily: FONT_HEAD, fontWeight: 500, fontSize: 28, lineHeight: "30px", letterSpacing: "-0.84px", color: C.text, margin: "0 0 16px", textTransform: "none" }}>Suggest an edit</h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: "20.3px", color: C.muted, margin: "0 0 20px" }}>
          Spotted something out of date or incorrect on <strong style={{ color: C.text, fontWeight: 500 }}>{listingTitle}</strong>? Please let us know and we will update it ASAP. We always strive to provide you with the most accurate listing information as possible.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" style={suggestInputStyle} />
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Your email" style={suggestInputStyle} />
          <input value={editType} onChange={(e) => setEditType(e.target.value)} placeholder="What needs updating?" style={suggestInputStyle} />
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Please share the correct details based on your feedback above; or describe what is wrong o we can investigate and update accordingly. " rows={5} style={{ ...suggestInputStyle, resize: "none", paddingTop: 14 }} />
        </div>
        <button
          onClick={submit}
          disabled={submitting}
          style={{
            fontFamily: FONT_BODY,
            marginTop: 16,
            width: "100%",
            height: 52,
            borderRadius: 999,
            background: C.text,
            color: "#FFFFFF",
            border: "none",
            fontSize: 14,
            cursor: submitting ? "default" : "pointer",
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? "Sending..." : "Send Suggestion"}
        </button>
      </div>
    </div>
  );
};

export default ListingDetail;
