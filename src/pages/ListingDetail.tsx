import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Star, Pencil, Heart, Share2, Check, X as XIcon, Phone, Send,
  Mail, Globe, ArrowUpRight, MapPin, Navigation,
  Sparkles, Coffee, Car, HeartPulse, BedDouble, PawPrint,
  ShoppingBag, CreditCard, Package, Info,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { isRestaurantCategory, isShoppingCategory, isAccommodationCategory, isNGOCategory } from "@/lib/categoryFields";
import BottomNav from "@/components/BottomNav";
import ImageLightbox from "@/components/ImageLightbox";
import { toast } from "sonner";
import { isSAPublicHoliday, getSADate } from "@/lib/southAfricaHolidays";
import { sanitizeDashes } from "@/lib/sanitizeListing";
import kidsFamilyIconSrc from "@/assets/kids-family-icon.svg";
import vibeIconSrc from "@/assets/vibe-icon.svg";
import seatingIconSrc from "@/assets/seating-icon.svg";
import serviceIconSrc from "@/assets/service-icon.svg";
import amenitiesIconSrc from "@/assets/amenities-icon.svg";
import accessibilityIconSrc from "@/assets/accessibility-icon.svg";
import pricingIconSrc from "@/assets/pricing-icon.svg";
import cuisineIconSrc from "@/assets/cuisine-icon.svg";
import mealsIconSrc from "@/assets/meals-icon.svg";
import BackArrowIcon from "@/components/ui/BackArrowIcon";
import { n as formatEventDate } from "@/lib/eventDates";

const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Design tokens
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

const iconImg = (src: string, size = 18): React.CSSProperties => ({
  width: size, height: size, objectFit: "contain", display: "block",
  filter: "brightness(0) saturate(100%) invert(36%) sepia(13%) saturate(1024%) hue-rotate(2deg) brightness(94%) contrast(86%)",
});

const Img = ({ src, size = 18 }: { src: string; size?: number }) => (
  <img src={src} alt="" style={iconImg(src, size)} />
);

const pressScale = (s = "0.98") => ({
  onPointerDown: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = `scale(${s})`),
  onPointerUp: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
  onPointerLeave: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
});

const toTitleCase = (s: string) =>
  s.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

type TabKey = "about" | "details" | "gallery" | "location";

const ListingDetail = () => {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<TabKey>("about");
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [suggestEditOpen, setSuggestEditOpen] = useState(false);
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

  if (isLoading || !listing) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, fontFamily: FONT, color: C.text }}>
        <div style={{ padding: "20px" }}>
          <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: C.primary, fontFamily: FONT, fontSize: 15 }}>
            <BackArrowIcon size={20} color={C.primary} />
            <span>Back</span>
          </button>
        </div>
        <div style={{ padding: "80px 20px", textAlign: "center", color: C.muted, fontSize: 14 }}>
          {isLoading ? "Loading..." : "Listing not found."}
        </div>
      </div>
    );
  }

  // ----- Derived data -----
  const firstCategory = listingCategories && listingCategories.length > 0 ? listingCategories[0] : null;
  const isListingRestaurant = listingCategories?.some((c) => isRestaurantCategory(c.title)) ?? false;
  const isListingShopping = listingCategories?.some((c) => isShoppingCategory(c.title)) ?? false;
  const isListingAccommodation = listingCategories?.some((c) => isAccommodationCategory(c.title)) ?? false;
  const isListingNGO = listingCategories?.some((c) => isNGOCategory(c.title)) ?? false;
  const l = listing as any;
  const galleryImages = (l.gallery_images as string[] | null) || [];
  const openingHours = l.opening_hours as Record<string, string> | null;
  const hasHours = !isListingAccommodation && openingHours && Object.values(openingHours).some((v) => v);
  const longDescription = l.long_description as string | null;
  const descriptionText = (longDescription || listing.description || "").trim();
  const whatsappNum = l.whatsapp as string | null;
  const waClean = whatsappNum ? whatsappNum.replace(/[^0-9]/g, "") : null;

  // ----- Open status -----
  const todayIndex = new Date().getDay();
  const todayLabel = todayIndex === 0 ? "Sunday" : DAY_LABELS[todayIndex - 1];
  const parseTimeStr = (s: string) => {
    const [h, mm] = s.replace(".", ":").trim().split(":");
    return parseInt(h, 10) * 60 + (mm ? parseInt(mm, 10) : 0);
  };
  const formatTime = (s: string) => (s.includes(":") ? s : `${s}:00`);
  type OpenStatus =
    | { state: "open"; closes?: string }
    | { state: "closed"; opensAt?: string; opensDay?: string }
    | { state: "temporarily_closed" };
  const computeOpenStatus = (): OpenStatus | null => {
    if (!openingHours) return null;
    const todayVal = openingHours[todayLabel.toLowerCase()] || "";
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
    if (/always\s*open|24\s*\/?\s*7|24\s*hours?/i.test(todayVal)) return { state: "open" };
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

  // ----- Rich text renderer: parses [label](url) markdown links + bare URLs -----
  const renderRichText = (text: string): React.ReactNode => {
    if (!text) return null;
    const nodes: React.ReactNode[] = [];
    const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s)]+)/g;
    let lastIndex = 0;
    let m: RegExpExecArray | null;
    let i = 0;
    while ((m = regex.exec(text)) !== null) {
      if (m.index > lastIndex) nodes.push(text.slice(lastIndex, m.index));
      const label = m[1] || m[3];
      const href = m[2] || m[3];
      nodes.push(
        <a key={`l-${i++}`} href={href} target="_blank" rel="noopener noreferrer"
          style={{ color: C.primary, textDecoration: "underline", textUnderlineOffset: 2, wordBreak: "break-word" }}>
          {label}
        </a>
      );
      lastIndex = m.index + m[0].length;
    }
    if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
    return nodes;
  };

  // ----- Detail sections (flattened from old accordion logic) -----
  type DField = { label: string; on: boolean | string };
  type DSection = { key: string; title: string; fields: DField[]; iconSrc?: string; iconComp?: any };
  const sections: DSection[] = [];
  const filterDefined = (arr: { label: string; value: boolean | string | null }[]): DField[] =>
    arr.filter(f => f.value === true || f.value === false || typeof f.value === "string")
      .map(f => ({ label: f.label, on: f.value as boolean | string }));

  if (l.price_level) {
    const labels: Record<number, string> = { 1: "Budget-friendly", 2: "Mid-range", 3: "Upscale", 4: "Fine dining" };
    sections.push({ key: "pricing", title: "Pricing", iconSrc: pricingIconSrc,
      fields: [{ label: `${labels[l.price_level] || ""} (${"R".repeat(l.price_level)})`, on: true }] });
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
    if (svc.length) sections.push({ key: "service", title: "Service options", iconSrc: serviceIconSrc, fields: svc });

    const kids = filterDefined([
      { label: "Good for kids", value: l.good_for_kids },
      { label: "Kids' menu", value: l.kids_menu },
      { label: "High chairs", value: l.high_chairs },
      { label: "Nappy changing station", value: l.nappy_changing_station },
      { label: "Kids playground", value: l.kids_playground },
    ]);
    if (kids.length) sections.push({ key: "kids", title: "Kids & family", iconSrc: kidsFamilyIconSrc, fields: kids });

    const access = filterDefined([
      { label: "Wheelchair friendly", value: l.wheelchair_friendly },
      { label: "Accessible entrance", value: l.wheelchair_entrance },
      { label: "Accessible seating", value: l.wheelchair_seating },
      { label: "Accessible toilet", value: l.wheelchair_toilet },
      { label: "Accessible parking", value: l.wheelchair_car_park },
    ]);
    if (access.length) sections.push({ key: "accessibility", title: "Accessibility", iconSrc: accessibilityIconSrc, fields: access });

    const amen = filterDefined([
      { label: "Toilets", value: l.has_toilet },
      { label: l.has_wifi === true && l.has_free_wifi === true ? "Wifi (Free)" : "Wifi", value: l.has_wifi },
      { label: "Smoking section", value: l.smoking_allowed },
      { label: "Pet friendly", value: l.pets_allowed },
    ]);
    if (amen.length) sections.push({ key: "amenities", title: "Amenities", iconSrc: amenitiesIconSrc, fields: amen });

    if (l.seating?.length) sections.push({ key: "seating", title: "Seating", iconSrc: seatingIconSrc, fields: l.seating.map((s: string) => ({ label: toTitleCase(s.replace(/ seating$/i, "")), on: true })) });
    if (l.meal?.length) sections.push({ key: "meals", title: "Meals served", iconSrc: mealsIconSrc, fields: l.meal.map((m: string) => ({ label: toTitleCase(m), on: true })) });
    if (l.cuisine?.length) sections.push({ key: "cuisine", title: "Cuisine", iconSrc: cuisineIconSrc, fields: l.cuisine.map((c: string) => ({ label: toTitleCase(c), on: true })) });
    if (l.vibe?.length) sections.push({ key: "vibe", title: "Vibe", iconSrc: vibeIconSrc, fields: l.vibe.map((v: string) => ({ label: toTitleCase(v), on: true })) });
  }

  if (isListingAccommodation) {
    const food = filterDefined([
      { label: "Restaurant", value: l.has_restaurant }, { label: "Bar", value: l.has_bar },
      { label: "Room service", value: l.has_room_service }, { label: "Breakfast", value: l.has_breakfast },
    ]);
    if (food.length) sections.push({ key: "accom-food", title: "Food & drink", iconComp: Coffee, fields: food });
    const shuttleLabel = l.has_airport_shuttle === true
      ? (l.airport_shuttle_free === true ? "Airport shuttle (free)"
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
      { label: "Aircon", value: l.has_aircon }, { label: "Laundry service", value: l.has_laundry }, { label: "Wi-Fi", value: l.has_wifi_accom },
    ]);
    if (rooms.length) sections.push({ key: "accom-rooms", title: "Rooms", iconComp: BedDouble, fields: rooms });
    if (l.child_friendly === true) sections.push({ key: "accom-children", title: "Children", iconSrc: kidsFamilyIconSrc, fields: [{ label: "Child friendly", on: true }] });
    if (l.pets_allowed === true) sections.push({ key: "accom-pets", title: "Pets", iconComp: PawPrint, fields: [{ label: "Pet friendly", on: true }] });
  }

  if (isListingShopping) {
    const shop = filterDefined([
      { label: "Air conditioned", value: l.air_conditioned },
      { label: "Delivery available", value: l.delivery_available },
      { label: "Order online", value: l.order_online },
      { label: "Parking available", value: l.parking_available },
      { label: "Wheelchair friendly", value: l.wheelchair_friendly },
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
    if (t && v) sections.push({ key: `custom-${i}`, title: t, iconComp: Info, fields: [{ label: v, on: "__text__" }] });
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

  // ----- Action pills -----
  const actions = [
    listing.phone && { key: "call", label: "Call", href: `tel:${listing.phone}`, Icon: Phone, ext: false },
    waClean && {
      key: "whatsapp", label: "WhatsApp", href: `https://wa.me/${waClean}`, ext: true,
      Icon: ({ size = 18 }: { size?: number }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={C.primary} aria-hidden="true">
          <path d="M19.05 4.91A10 10 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.91-7.02Z" />
        </svg>
      ),
    },
    (l.google_maps_link || listing.location) && {
      key: "directions", label: "Directions",
      href: l.google_maps_link || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.location || listing.title)}`,
      Icon: Send, ext: true,
    },
    listing.website && { key: "website", label: "Website", href: listing.website, Icon: Globe, ext: true },
  ].filter(Boolean) as Array<{ key: string; label: string; href: string; Icon: any; ext: boolean }>;

  // ----- Sub-components -----
  const PillBtn = ({ a, full }: { a: typeof actions[number]; full?: boolean }) => (
    <a
      href={a.href}
      {...(a.ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
        padding: "10px 14px", borderRadius: 999,
        background: C.surface, border: `1px solid ${C.border}`,
        color: C.primary, textDecoration: "none",
        fontFamily: FONT, fontWeight: 400, fontSize: 13,
        letterSpacing: "0.01em",
        flexShrink: 0,
        width: full ? "100%" : undefined,
        transition: "transform 150ms ease-out",
      }}
      {...pressScale()}
    >
      <a.Icon size={14} strokeWidth={1.75} color={C.primary} />
      <span>{a.label}</span>
    </a>
  );

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

  // ----- Tab content -----
  const renderAbout = () => {
    const paragraphs = descriptionText.split("\n").filter(Boolean);
    const isLong = descriptionText.length > 180;
    return (
    <div style={{ padding: "20px" }}>
      {descriptionText && (
        <>
          <h2 style={headStyle}>About</h2>
          <div style={!aboutExpanded && isLong ? {
            display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
          } : undefined}>
            {paragraphs.map((p, i) => (
              <p key={i} style={paraStyle}>{p}</p>
            ))}
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

      {hasHours && (() => {
        const holidayCheck = isSAPublicHoliday(getSADate());
        return (
          <div style={{ marginTop: 28 }}>
            <h2 style={headStyle}>Hours</h2>
            {holidayCheck.isHoliday && (
              <div style={{ marginBottom: 10, padding: "8px 12px", background: C.ivory, borderRadius: 10, fontSize: 12.5, color: C.text }}>
                Public holiday — hours might differ
              </div>
            )}
            {openStatus && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: openStatus.state === "open" ? "#5C8A4A" : "#B05B3F" }} />
                <span style={{ fontSize: 14, color: C.heading, fontWeight: 400 }}>
                  {openStatus.state === "open" ? "Open now" : openStatus.state === "temporarily_closed" ? "Temporarily closed" : "Closed"}
                </span>
                {openStatus.state === "open" && openStatus.closes && (
                  <span style={{ fontSize: 14, color: C.muted }}>· Closes {openStatus.closes}</span>
                )}
                {openStatus.state === "closed" && openStatus.opensAt && (
                  <span style={{ fontSize: 14, color: C.muted }}>· Opens {openStatus.opensAt} {openStatus.opensDay || ""}</span>
                )}
              </div>
            )}
            <div style={{ background: C.surface, borderRadius: 16, padding: "4px 16px", border: `1px solid ${C.border}` }}>
              {DAY_LABELS.map((day, i) => {
                const v = openingHours![day.toLowerCase()] || "";
                const isClosed = !v || v.toLowerCase() === "closed";
                const isToday = day === todayLabel;
                return (
                  <div key={day} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "12px 0", borderTop: i === 0 ? "none" : `1px solid ${C.divider}`,
                  }}>
                    <span style={{ fontSize: 14, color: isToday ? C.heading : C.text, fontWeight: 400 }}>
                      {day}{isToday ? " · Today" : ""}
                    </span>
                    <span style={{ fontSize: 14, color: isClosed ? C.muted : isToday ? C.heading : C.text }}>
                      {isClosed ? "Closed" : v.replace(/\s*-\s*/g, " to ")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Contact rows */}
      {(listing.email || listing.phone || waClean || listing.website) && (
        <div style={{ marginTop: 28 }}>
          <h2 style={headStyle}>Contact</h2>
          <div style={{ background: C.surface, borderRadius: 16, padding: "4px 16px", border: `1px solid ${C.border}` }}>
            {[
              listing.phone && { label: "Phone", value: listing.phone, href: `tel:${listing.phone}`, Icon: Phone },
              waClean && { label: "WhatsApp", value: whatsappNum!, href: `https://wa.me/${waClean}`, Icon: Phone },
              listing.email && { label: "Email", value: listing.email, href: `mailto:${listing.email}`, Icon: Mail },
              listing.website && { label: "Website", value: listing.website, href: listing.website, Icon: Globe },
            ].filter(Boolean).map((r: any, i, arr) => (
              <a key={r.label} href={r.href} target="_blank" rel="noopener noreferrer" style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 0", textDecoration: "none",
                borderTop: i === 0 ? "none" : `1px solid ${C.divider}`,
              }}>
                <r.Icon size={18} strokeWidth={1.5} color={C.primary} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted }}>{r.label}</div>
                  <div style={{ fontSize: 14, color: C.heading, wordBreak: "break-word" }}>{r.value}</div>
                </div>
                <ArrowUpRight size={16} color={C.muted} />
              </a>
            ))}
          </div>
        </div>
      )}

      <SuggestEditFooter onClick={() => setSuggestEditOpen(true)} />
    </div>
    );
  };

  const renderDetails = () => (
    <div style={{ padding: "20px" }}>
      {sections.length === 0 ? (
        <p style={{ ...paraStyle, color: C.muted, textAlign: "center", marginTop: 40 }}>No additional details yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {sections.map((s) => (
            <div key={s.key} style={{ background: C.surface, borderRadius: 16, padding: 18, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                {s.iconSrc ? <Img src={s.iconSrc} size={18} /> : s.iconComp ? <s.iconComp size={18} strokeWidth={1.5} color={C.primary} /> : null}
                <h3 style={{
                  margin: 0, fontFamily: FONT, fontWeight: 400, fontSize: 12,
                  letterSpacing: "0.08em", textTransform: "uppercase", color: C.heading,
                }}>{s.title}</h3>
              </div>
              {s.fields.length === 1 && s.fields[0].on === "__text__" ? (
                <p style={{ ...paraStyle, margin: 0, whiteSpace: "pre-wrap" }}>{renderRichText(s.fields[0].label)}</p>
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
                          {f.label}
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
    return (
      <div style={{ padding: "20px" }}>
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
          {listing.location && (
            <div style={{ padding: 16, display: "flex", alignItems: "flex-start", gap: 10 }}>
              <MapPin size={18} color={C.primary} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, color: C.heading }}>{listing.location}</div>
              </div>
            </div>
          )}
        </div>
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
      </div>
    );
  };

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
          <span style={{ fontFamily: FONT, fontSize: 15, color: C.heading }}>Listing Details</span>
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button onClick={() => { if (!requireAuth()) toggleFavourite.mutate(); }} aria-label={isFavourited ? "Unsave" : "Save"}
            style={iconBtn}>
            <Heart size={20} strokeWidth={1.6} color={isFavourited ? C.primary : C.heading} fill={isFavourited ? C.primary : "none"} />
          </button>
          <button onClick={handleShare} aria-label="Share" style={iconBtn}>
            <Share2 size={20} strokeWidth={1.6} color={C.heading} />
          </button>
          {isAdmin && (
            <button onClick={() => navigate(`/admin/listings?edit=${listing.id}&returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`, { replace: true })} aria-label="Edit" style={iconBtn}>
              <Pencil size={18} strokeWidth={1.6} color={C.heading} />
            </button>
          )}
        </div>
      </header>

      {/* Hero (4:3) */}
      <div style={{ width: "100%", aspectRatio: "4 / 3", background: "#DDD6C0", overflow: "hidden" }}>
        {listing.image_url && (
          <img src={listing.image_url} alt={listing.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        )}
      </div>

      {/* Title block */}
      <div style={{ background: C.surface, padding: "20px 20px 18px" }}>
        {firstCategory && (
          <div style={{
            marginBottom: 8,
            fontSize: 11, color: C.muted,
            letterSpacing: "0.12em", textTransform: "uppercase",
          }}>
            {firstCategory.title}
          </div>
        )}
        <h1 style={{
          margin: 0, fontFamily: FONT, fontWeight: 400, fontSize: 24, lineHeight: 1.2,
          color: C.heading, letterSpacing: "0.01em",
        }}>
          {listing.title}
        </h1>
        {listing.location && (
          <div style={{
            marginTop: 6, fontSize: 13, color: C.muted, letterSpacing: "0.01em",
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <MapPin size={12} color={C.muted} strokeWidth={1.6} />
            <span>{listing.location}</span>
          </div>
        )}
        {l.google_rating != null && (
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: C.heading }}>
            <Star size={14} fill={C.accent} color={C.accent} strokeWidth={0} />
            <span style={{ fontWeight: 400 }}>{Number(l.google_rating).toFixed(1)}</span>
            {l.google_reviews_count != null && (
              <span style={{ color: C.muted }}>({l.google_reviews_count})</span>
            )}
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
        display: "flex",
        padding: "0 8px",
      }}>
        <TabBtn k="about" label="About" />
        <TabBtn k="details" label="Details" />
        <TabBtn k="gallery" label="Gallery" />
        <TabBtn k="location" label="Location" />
      </nav>

      {/* Tab content */}
      <main>
        {tab === "about" && renderAbout()}
        {tab === "details" && renderDetails()}
        {tab === "gallery" && renderGallery()}
        {tab === "location" && renderLocation()}
      </main>

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
      />

      <BottomNav />
    </div>
  );
};

// ----- Shared inline styles -----
const headStyle: React.CSSProperties = {
  margin: "0 0 12px",
  fontFamily: FONT, fontWeight: 400, fontSize: 12,
  letterSpacing: "0.08em", textTransform: "uppercase",
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
      fontFamily: FONT, fontSize: 13, color: C.muted,
      textDecoration: "underline", textUnderlineOffset: 3,
    }}>
      Suggest an edit to this listing.
    </button>
  </div>
);

// ----- Suggest edit sheet (unchanged behaviour) -----
const suggestInputStyle: React.CSSProperties = {
  fontFamily: FONT, fontWeight: 400, fontSize: 14, color: C.heading,
  background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12,
  padding: "12px 14px", outline: "none", width: "100%", boxSizing: "border-box",
};

const SuggestEditSheet = ({ open, onClose, listingTitle }: { open: boolean; onClose: () => void; listingTitle: string }) => {
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
      name: name.trim(), email: email.trim(), message: composed,
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
          <div style={{ fontSize: 11, letterSpacing: "0.08em", color: C.muted, textTransform: "uppercase" }}>Help us improve</div>
          <button onClick={onClose} aria-label="Close" style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4 }}>
            <XIcon size={20} color={C.heading} strokeWidth={1.75} />
          </button>
        </div>
        <h2 style={{ fontFamily: FONT, fontWeight: 400, fontSize: 20, color: C.heading, margin: "0 0 8px" }}>Suggest an edit</h2>
        <p style={{ fontSize: 13.5, lineHeight: 1.5, color: C.muted, margin: "0 0 16px" }}>
          Spotted something out of date on <strong style={{ color: C.heading, fontWeight: 400 }}>{listingTitle}</strong>? Let us know and we'll update it.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" style={suggestInputStyle} />
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Your email" style={suggestInputStyle} />
          <input value={editType} onChange={(e) => setEditType(e.target.value)} placeholder="What needs updating?" style={suggestInputStyle} />
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Please share the correct details." rows={5} style={{ ...suggestInputStyle, resize: "none" }} />
        </div>
        <button onClick={submit} disabled={submitting} style={{
          fontFamily: FONT, marginTop: 14, width: "100%", height: 48, borderRadius: 999,
          background: C.primary, color: "#fff", border: "none", fontSize: 14,
          cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.6 : 1,
        }}>
          {submitting ? "Sending..." : "Send Suggestion"}
        </button>
      </div>
    </div>
  );
};

export default ListingDetail;
