import { useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Star, Pencil, ChevronLeft, ChevronDown, Menu,
  Heart, Share2, Check, Phone, Navigation,
  MapPin, Mail, Globe, MessageCircle, ArrowUpRight,
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { isRestaurantCategory, isShoppingCategory, isAccommodationCategory } from "@/lib/categoryFields";
import BottomNav from "@/components/BottomNav";
import ImageLightbox from "@/components/ImageLightbox";
import { toast } from "sonner";
import { isSAPublicHoliday, getSADate } from "@/lib/southAfricaHolidays";

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const font = "'Helvetica Neue', 'Helvetica World', Helvetica, Arial, sans-serif";

// Design tokens
const C = {
  bg: "#EBEBEB",
  card: "#FFFFFF",
  coral: "#F26A48",
  panel: "#F2EFEC",
  border: "#E8E4DF",
  text: "#0A0A0A",
  muted: "#8A8480",
};

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

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("listings").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

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

  const { data: linkedEvents } = useQuery({
    queryKey: ["listing-events", id],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data } = await (supabase as any)
        .from("events")
        .select("*")
        .eq("business_id", id!);
      // Filter: keep events whose ISO date is today/future, OR non-ISO/recurring (always upcoming)
      return (data || []).filter((e: any) => {
        const isRecurring = e.recurrence && e.recurrence.trim() !== "" && e.recurrence.trim().toLowerCase() !== "none";
        if (isRecurring) return true;
        const clean = String(e.date || "").replace(/<[^>]*>/g, "").trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
          const d = new Date(clean);
          if (!isNaN(d.getTime())) return d >= today;
          return true;
        }
        return true; // free-text date — keep
      });
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

  const { data: isVisited } = useQuery({
    queryKey: ["been-here", id, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.from("been_here").select("id").eq("user_id", user.id).eq("listing_id", id!).maybeSingle();
      return !!data;
    },
    enabled: !!user && !!id,
  });

  const toggleVisited = useMutation({
    mutationFn: async () => {
      if (!user) return;
      if (isVisited) {
        await supabase.from("been_here").delete().eq("user_id", user.id).eq("listing_id", id!);
      } else {
        await supabase.from("been_here").insert({ user_id: user.id, listing_id: id! });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["been-here", id] });
      queryClient.invalidateQueries({ queryKey: ["been-here"] });
      toast.success(isVisited ? "Removed from visited" : "Marked as visited!");
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
      <div style={{ minHeight: "100vh", background: C.bg, fontFamily: font }}>
        <div style={{ padding: "52px 24px 0" }}>
          <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer" }}>
            <ChevronLeft size={20} strokeWidth={1.5} color={C.text} />
            <span style={{ fontSize: 15, color: C.text, fontFamily: font }}>Back</span>
          </button>
        </div>
        <div style={{ padding: "48px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <p style={{ fontSize: 13, color: C.muted, fontFamily: font }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, fontFamily: font }}>
        <div style={{ padding: "52px 24px 0" }}>
          <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer" }}>
            <ChevronLeft size={20} strokeWidth={1.5} color={C.text} />
            <span style={{ fontSize: 15, color: C.text, fontFamily: font }}>Back</span>
          </button>
        </div>
        <div style={{ padding: "80px 20px", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: C.muted, marginBottom: 16, fontFamily: font }}>Listing not found.</p>
          <Link to="/" style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: font }}>Back to Home</Link>
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
  const showAttributes = isListingRestaurant && ((listing as any).show_attributes as boolean);
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

  const tagPills: string[] = [];
  if (isListingRestaurant && priceLevel) tagPills.push("R".repeat(priceLevel));

  type AccField = { label: string; value: boolean | string | null };
  type AccSection = { key: string; title: string; fields: AccField[] };
  const accordionSections: AccSection[] = [];

  if (isListingRestaurant) {
    const accessFields = [
      { label: "Wheelchair friendly", value: wheelchairFriendly },
      { label: "Accessible entrance", value: wheelchairEntrance },
      { label: "Accessible seating", value: wheelchairSeating },
      { label: "Accessible toilet", value: wheelchairToilet },
      { label: "Accessible parking", value: wheelchairCarPark },
    ].filter(f => f.value === true) as AccField[];
    if (accessFields.length > 0) accordionSections.push({ key: "accessibility", title: "Accessibility", fields: accessFields });

    const kidsFields = [
      { label: "Good for kids", value: goodForKids },
      { label: "Kids menu", value: kidsMenu },
      { label: "High Chairs", value: highChairs },
      { label: "Kids playground", value: kidsPlayground },
    ].filter(f => f.value === true) as AccField[];
    if (kidsFields.length > 0) accordionSections.push({ key: "kids", title: "Kids & Family", fields: kidsFields });

    const amenFields = [
      { label: "Toilets", value: hasToilet },
      { label: "Wi-Fi", value: hasWifi },
      { label: "Free Wi-Fi", value: hasFreeWifi },
      { label: "Smoking section", value: smokingAllowed },
      { label: "Pets friendly", value: petsAllowed },
    ].filter(f => f.value === true) as AccField[];
    if (amenFields.length > 0) accordionSections.push({ key: "amenities", title: "Amenities", fields: amenFields });

    if (seating && seating.length > 0) {
      accordionSections.push({ key: "seating", title: "Seating", fields: seating.map(s => ({ label: s.replace(/ seating$/i, ""), value: true })) });
    }

    const serviceArr = serviceType || [];
    if (serviceArr.length > 0) {
      accordionSections.push({ key: "service", title: "Service Options", fields: serviceArr.map(s => ({ label: s === "Take Away" ? "Take away" : s, value: true })) });
    }

    if (meal && meal.length > 0) accordionSections.push({ key: "meals", title: "Meals Served", fields: meal.map(m => ({ label: m, value: true })) });
    if (cuisine && cuisine.length > 0) accordionSections.push({ key: "cuisine", title: "Cuisine", fields: cuisine.map(c => ({ label: c, value: true })) });
    if (vibe && vibe.length > 0) accordionSections.push({ key: "vibe", title: "Vibe", fields: vibe.map(v => ({ label: v, value: true })) });
  }

  // Accommodation accordion
  if (isListingAccommodation) {
    const l = listing as any;
    const food = [
      { label: "Restaurant", value: l.has_restaurant },
      { label: "Bar", value: l.has_bar },
      { label: "Room Service", value: l.has_room_service },
      { label: "Breakfast", value: l.has_breakfast },
    ].filter(f => f.value === true) as AccField[];
    if (food.length > 0) accordionSections.push({ key: "accom-food", title: "Food & Drink", fields: food });

    const transport = [
      { label: "Airport Shuttle", value: l.has_airport_shuttle },
      { label: "Free Parking", value: l.has_free_parking },
      { label: "Secure Parking", value: l.has_secure_parking },
    ].filter(f => f.value === true) as AccField[];
    if (transport.length > 0) accordionSections.push({ key: "accom-transport", title: "Transport", fields: transport });

    const wellness = [
      { label: "Spa", value: l.has_spa },
      { label: "Fitness Centre", value: l.has_fitness_centre },
      { label: "Swimming Pool", value: l.has_swimming_pool },
    ].filter(f => f.value === true) as AccField[];
    if (wellness.length > 0) accordionSections.push({ key: "accom-wellness", title: "Wellness", fields: wellness });

    const rooms = [
      { label: "Aircon", value: l.has_aircon },
      { label: "Laundry Service", value: l.has_laundry },
      { label: "Wi-Fi", value: l.has_wifi_accom },
    ].filter(f => f.value === true) as AccField[];
    if (rooms.length > 0) accordionSections.push({ key: "accom-rooms", title: "Rooms", fields: rooms });

    if (l.child_friendly === true) accordionSections.push({ key: "accom-children", title: "Children", fields: [{ label: "Child Friendly", value: true }] });
    if (l.pets_allowed === true) accordionSections.push({ key: "accom-pets", title: "Pets", fields: [{ label: "Pets friendly", value: true }] });
  }

  // Shopping accordion
  if (isListingShopping) {
    const l = listing as any;
    const shop = [
      { label: "Air Conditioned", value: l.air_conditioned },
      { label: "Delivery Available", value: l.delivery_available },
      { label: "Click & Collect", value: l.click_and_collect },
      { label: "Order Online", value: l.order_online },
      { label: "Parking Available", value: l.parking_available },
      { label: "Wheelchair friendly", value: l.wheelchair_friendly },
      { label: "Local Products", value: l.local_products },
      { label: "Curio / Gifts", value: l.curio_or_gifts },
    ].filter(f => f.value === true) as AccField[];
    if (shop.length > 0) accordionSections.push({ key: "shop-amenities", title: "Amenities", fields: shop });
    if (l.payment_methods && l.payment_methods.length > 0) {
      accordionSections.push({ key: "shop-payment", title: "Payment", fields: l.payment_methods.map((p: string) => ({ label: p, value: true })) });
    }
    if (l.product_categories && l.product_categories.length > 0) {
      accordionSections.push({ key: "shop-products", title: "Products", fields: l.product_categories.map((p: string) => ({ label: p, value: true })) });
    }
  }

  const descriptionText = longDescription || listing.description;

  const toggleAccordion = (key: string) => {
    setOpenAccordion(openAccordion === key ? null : key);
  };

  // Today
  const todayIndex = new Date().getDay(); // 0=Sun
  const todayLabel = todayIndex === 0 ? "Sunday" : DAY_LABELS[todayIndex - 1];

  // Floating circle button style
  const circleBtn: React.CSSProperties = {
    width: 44, height: 44, borderRadius: "50%",
    background: C.card,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    display: "flex", alignItems: "center", justifyContent: "center",
    border: "none", cursor: "pointer",
    transition: "transform 0.15s ease-out",
  };

  // Contact rows
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
    <svg width="20" height="20" viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.057 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.889-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.887 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.47 3.488"/>
    </svg>
  );
  const contactRows = [
    listing.location && {
      label: "Location",
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
      value: listing.website.replace(/^https?:\/\//, "").replace(/\/$/, ""),
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

  return (
    <div style={{ minHeight: "100vh", background: C.bg, paddingBottom: 140, fontFamily: font, color: C.text }}>
      {/* Hero image, full-bleed 360px, bottom rounded 24px */}
      <div style={{ position: "relative" }}>
        {listing.image_url ? (
          <img
            src={listing.image_url}
            alt={listing.title}
            style={{
              width: "100%", height: 360, objectFit: "cover", display: "block",
              borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
            }}
          />
        ) : (
          <div style={{
            width: "100%", height: 360, background: C.panel,
            borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
          }} />
        )}

        {/* Floating circle buttons */}
        <button
          onClick={() => navigate(-1)}
          style={{ ...circleBtn, position: "absolute", top: 36, left: 20 }}
          aria-label="Back"
          {...pressScale("0.94")}
        >
          <ChevronLeft size={20} strokeWidth={1.5} color={C.text} />
        </button>
        {/* Top-right action cluster: Share / Save / Visited (+ Edit if admin) */}
        <div style={{ position: "absolute", top: 36, right: 20, display: "flex", gap: 8 }}>
          <button
            onClick={handleShare}
            style={circleBtn}
            aria-label="Share"
            {...pressScale("0.94")}
          >
            <Share2 size={18} strokeWidth={1.5} color={C.text} />
          </button>
          <button
            onClick={() => { if (!requireAuth()) toggleFavourite.mutate(); }}
            style={circleBtn}
            aria-label={isFavourited ? "Remove from saved" : "Save"}
            {...pressScale("0.94")}
          >
            <Heart size={18} strokeWidth={1.5} color={C.text} fill={isFavourited ? C.text : "none"} />
          </button>
          <button
            onClick={() => { if (!requireAuth()) toggleVisited.mutate(); }}
            style={circleBtn}
            aria-label={isVisited ? "Remove from visited" : "Mark as visited"}
            {...pressScale("0.94")}
          >
            <Check size={18} strokeWidth={1.5} color={isVisited ? C.coral : C.text} />
          </button>
          {isAdmin && (
            <button
              onClick={() => navigate(`/admin/listings?edit=${listing.id}`)}
              style={circleBtn}
              aria-label="Edit listing"
              {...pressScale("0.94")}
            >
              <Pencil size={18} strokeWidth={1.5} color={C.text} />
            </button>
          )}
        </div>
      </div>

      {/* Title block */}
      <div style={{ paddingTop: 32, paddingLeft: 24, paddingRight: 24 }}>
        {firstCategory && (
          <p style={{
            fontFamily: font, fontWeight: 400, fontSize: 12, lineHeight: "14.4px",
            letterSpacing: "0.24px", color: C.muted, margin: 0, marginBottom: 10,
            textTransform: "uppercase",
          }}>
            {firstCategory.title}
          </p>
        )}

        <h1 style={{
          fontFamily: '"Helvetica World", Helvetica, Arial, sans-serif', fontWeight: 500, fontSize: 35, lineHeight: 1.05,
          letterSpacing: "-0.5px", color: C.text, margin: 0, marginBottom: 20,
        }}>
          {listing.title}
        </h1>

        {/* Rating row */}
        {(listing as any).google_rating != null && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <div style={{ display: "flex", gap: 2 }}>
              {[1, 2, 3, 4, 5].map((s) => {
                const filled = s <= Math.round((listing as any).google_rating);
                return (
                  <Star
                    key={s}
                    size={14}
                    fill={filled ? C.text : "transparent"}
                    color={filled ? C.text : C.border}
                    strokeWidth={1.5}
                  />
                );
              })}
            </div>
            <span style={{ fontFamily: font, fontWeight: 700, fontSize: 14, color: C.text }}>
              {(listing as any).google_rating}
            </span>
            {(listing as any).google_reviews_count != null && (
              (listing as any).google_reviews_url ? (
                <a
                  href={(listing as any).google_reviews_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontFamily: font, fontWeight: 400, fontSize: 14, color: C.muted, textDecoration: "none" }}
                >
                  ({(listing as any).google_reviews_count} reviews)
                </a>
              ) : (
                <span style={{ fontFamily: font, fontWeight: 400, fontSize: 14, color: C.muted }}>
                  ({(listing as any).google_reviews_count} reviews)
                </span>
              )
            )}
          </div>
        )}

        {/* Primary CTAs: Call Now / Directions */}
        {(listing.phone || (listing as any).google_maps_link) && (
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            {listing.phone && (
              <a
                href={`tel:${listing.phone}`}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  height: 48, borderRadius: 999,
                  background: C.text, color: "#FFFFFF",
                  textDecoration: "none", cursor: "pointer",
                  transition: "transform 0.15s ease-out",
                  fontFamily: font, fontSize: 15, lineHeight: "18px", fontWeight: 400,
                }}
                {...pressScale()}
              >
                Call Now
              </a>
            )}
            {(listing as any).google_maps_link && (
              <a
                href={(listing as any).google_maps_link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  height: 48, borderRadius: 999,
                  background: C.text, color: "#FFFFFF",
                  textDecoration: "none", cursor: "pointer",
                  transition: "transform 0.15s ease-out",
                  fontFamily: font, fontSize: 15, lineHeight: "18px", fontWeight: 400,
                }}
                {...pressScale()}
              >
                Directions
              </a>
            )}
          </div>
        )}

        {/* Tag chips */}
        {tagPills.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 20 }}>
            {tagPills.map((p, i) => (
              <span
                key={i}
                style={{
                  background: C.panel, borderRadius: 999, padding: "8px 14px",
                  fontFamily: font, fontWeight: 400, fontSize: 13, color: C.text,
                }}
              >
                {p}
              </span>
            ))}
          </div>
        )}

        {/* Contact card — matches Events / Specials */}
        {contactRows.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <h2 style={{
              fontFamily: '"Helvetica World", Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: 28, lineHeight: 1.15,
              letterSpacing: "-0.01em", color: "#020202", textTransform: "none", margin: 0, marginBottom: 12,
            }}>
              Contact
            </h2>
            <div style={{ background: "#FFFFFF", border: "1px solid rgba(18,18,20,0.06)", borderRadius: 16, padding: "4px 0", overflow: "hidden" }}>
              {contactRows.map((row, idx) => {
                const Wrapper: any = row.href ? "a" : "div";
                const wrapperProps = row.href ? { href: row.href, target: "_blank", rel: "noopener noreferrer" } : {};
                return (
                  <div key={row.label}>
                    {idx > 0 && <div style={{ height: 1, background: "rgba(18,18,20,0.08)", marginLeft: 56 }} />}
                    <Wrapper
                      {...wrapperProps}
                      style={{ display: "flex", alignItems: "center", padding: "14px 20px", textDecoration: "none" }}
                    >
                      <div style={{ marginRight: 16, flexShrink: 0, display: "flex", alignItems: "center" }}>
                        {row.isCustomIcon
                          ? <row.icon color="rgba(18,18,20,0.3)" />
                          : <row.icon size={20} strokeWidth={1.8} style={{ color: "rgba(18,18,20,0.3)" }} />}
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
          </div>
        )}

        {/* About section */}
        {descriptionText && (() => {
          const text = (longDescription || listing.description || "").trim();
          const paragraphs = text.split("\n").filter(Boolean);
          const isLong = text.length > 220;
          return (
            <div style={{ marginTop: 40 }}>
              <h2 style={{
                fontFamily: '"Helvetica World", Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: 28, lineHeight: 1.15,
                letterSpacing: "-0.01em", color: "#020202", textTransform: "none", margin: 0, marginBottom: 16,
              }}>
                About
              </h2>
              <div style={{
                ...(!aboutExpanded && isLong ? { display: "-webkit-box", WebkitLineClamp: 5, WebkitBoxOrient: "vertical" as const, overflow: "hidden" } : {})
              }}>
                {paragraphs.map((p, i) => (
                  <p key={i} style={{
                    fontFamily: '"Helvetica World", Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: 1.45,
                    color: "#737373", margin: 0, marginBottom: i < paragraphs.length - 1 ? 12 : 0,
                  }}>
                    {p}
                  </p>
                ))}
              </div>
              {isLong && (
                <button
                  onClick={() => setAboutExpanded(!aboutExpanded)}
                  style={{
                    marginTop: 10, background: "none", border: "none", padding: 0, cursor: "pointer",
                    fontFamily: font, fontWeight: 400, fontSize: 14, color: C.text,
                    textDecoration: "underline", textUnderlineOffset: "3px",
                    transition: "opacity 0.12s ease",
                  }}
                  {...pressOpacity}
                >
                  {aboutExpanded ? "Show Less" : "Read More"}
                </button>
              )}
            </div>
          );
        })()}

        {/* Details section */}
        {accordionSections.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <h2 style={{
              fontFamily: '"Helvetica World", Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: 28, lineHeight: 1.15,
              letterSpacing: "-0.01em", color: "#020202", textTransform: "none", margin: 0, marginBottom: 16,
            }}>
              Details
            </h2>
            <div style={{
              background: "#FFFFFF", border: "1px solid rgba(18,18,20,0.06)", borderRadius: 16,
              paddingLeft: 20, paddingRight: 20, overflow: "hidden",
            }}>
              {accordionSections.map((section, i) => {
                const isOpen = openAccordion === section.key;
                return (
                  <div key={section.key} style={{
                    borderBottom: i < accordionSections.length - 1 ? "1px solid rgba(18,18,20,0.08)" : "none",
                  }}>
                    <button
                      onClick={() => toggleAccordion(section.key)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                        paddingTop: 14, paddingBottom: 14,
                        background: "none", border: "none", cursor: "pointer", fontFamily: font,
                      }}
                    >
                      <span style={{
                        fontFamily: font, fontWeight: 400, fontSize: 14, lineHeight: 1.3,
                        color: "#2B2420",
                      }}>
                        {section.title}
                      </span>
                      <ChevronDown
                        size={18}
                        strokeWidth={1.8}
                        color="#2B2420"
                        style={{ transition: "transform 0.2s ease-out", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                      />
                    </button>
                    {isOpen && (
                      <div style={{ paddingBottom: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {section.fields.map((f, fi) => (
                          <span
                            key={fi}
                            style={{
                              background: "rgba(18,18,20,0.04)", border: "1px solid rgba(18,18,20,0.06)",
                              borderRadius: 999, padding: "6px 12px",
                              fontFamily: font, fontWeight: 400, fontSize: 12, color: "#2B2420",
                              textTransform: "none",
                            }}
                          >
                            {typeof f.value === "string" ? `${f.label}: ${f.value}` : f.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Hours section */}
        <div ref={whatToKnowRef} />
        {hasHours && (() => {
          const saToday = getSADate();
          const holidayCheck = isSAPublicHoliday(saToday);
          return (
            <div style={{ marginTop: 40 }}>
              <h2 style={{
                fontFamily: '"Helvetica World", Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: 28, lineHeight: 1.15,
                letterSpacing: "-0.01em", color: "#020202", textTransform: "none", margin: 0, marginBottom: 16,
              }}>
                Hours
              </h2>
              {holidayCheck.isHoliday && (
                <div style={{
                  marginBottom: 12, padding: "10px 14px", background: C.panel, borderRadius: 12,
                  fontFamily: font, fontSize: 13, color: C.text,
                }}>
                  Public holiday — hours might differ
                </div>
              )}
              <div style={{
                background: "#FFFFFF",
                border: "1px solid rgba(18,18,20,0.06)",
                borderRadius: 16,
                paddingLeft: 20, paddingRight: 20, overflow: "hidden",
              }}>
                {DAY_LABELS.map((day, i) => {
                  const key = day.toLowerCase();
                  const value = openingHours![key] || "";
                  const isClosed = !value || value.toLowerCase() === "closed";
                  const isToday = day === todayLabel;
                  return (
                    <div key={day} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      paddingTop: 14, paddingBottom: 14,
                      borderBottom: i < DAY_LABELS.length - 1 ? "1px solid rgba(18,18,20,0.08)" : "none",
                    }}>
                      <span style={{ display: "inline-flex", alignItems: "center" }}>
                        {isToday && (
                          <span style={{
                            width: 6, height: 6, borderRadius: "50%",
                            background: C.coral, display: "inline-block", marginRight: 8,
                          }} />
                        )}
                        <span style={{
                          fontFamily: font,
                          fontWeight: isToday ? 700 : 400,
                          fontSize: 14, lineHeight: "20px",
                          color: "#2B2420",
                        }}>
                          {day}{isToday ? " · Today" : ""}
                        </span>
                      </span>
                      <span style={{
                        fontFamily: font, fontWeight: 400, fontSize: 14, lineHeight: "20px",
                        color: isToday ? "#2B2420" : "rgba(43,36,32,0.6)",
                      }}>
                        {isClosed ? "Closed" : value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Gallery */}
      {hasGallery && (
        <section style={{ marginTop: 40 }}>
          <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 16 }}>
            <h2 style={{
              fontFamily: '"Helvetica World", Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: 28, lineHeight: 1.15,
              letterSpacing: "-0.01em", color: "#020202", textTransform: "none", margin: 0,
            }}>
              Gallery
            </h2>
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="inline-flex" style={{ gap: 12, paddingLeft: 24, paddingRight: 24, paddingBottom: 4 }}>
              {galleryImages!.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
                  style={{
                    width: 240, aspectRatio: "4/3", borderRadius: 24, overflow: "hidden",
                    background: C.panel, flexShrink: 0, border: "none", padding: 0, cursor: "pointer",
                  }}
                  aria-label={`Open image ${i + 1}`}
                >
                  <img src={url} alt={`${listing.title} ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

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

export default ListingDetail;
