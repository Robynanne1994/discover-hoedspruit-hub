import { useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  MapPin, Phone, Mail, Globe, Star, Clock, Accessibility,
  Check, Minus, X, Wifi, MessageCircle, Pencil, ArrowLeft,
  Heart, Share2, CheckCircle, ChevronDown, Users, Coffee, ClipboardList,
  ShoppingBag, Navigation,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { isRestaurantCategory, isShoppingCategory, isAccommodationCategory } from "@/lib/categoryFields";
import BottomNav from "@/components/BottomNav";
import ImageLightbox from "@/components/ImageLightbox";
import { toast } from "sonner";

import { isSAPublicHoliday, getSADate } from "@/lib/southAfricaHolidays";

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const font = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const pressScale = (scale = "0.97") => ({
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
      <div style={{ minHeight: "100vh", background: "#EBEBEB", fontFamily: font }}>
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

  if (!listing) {
    return (
      <div style={{ minHeight: "100vh", background: "#EBEBEB", fontFamily: font }}>
        <div style={{ padding: "52px 24px 0" }}>
          <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer" }}>
            <ArrowLeft size={20} strokeWidth={1.8} style={{ color: "#2B2420" }} />
            <span style={{ fontSize: 15, fontWeight: 500, color: "#2B2420", fontFamily: font }}>Back</span>
          </button>
        </div>
        <div style={{ padding: "80px 20px", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "rgba(18,18,20,0.4)", marginBottom: 16, fontFamily: font }}>Listing not found.</p>
          <Link to="/" style={{ fontSize: 13, fontWeight: 600, color: "#2B2420", fontFamily: font }}>Back to Home</Link>
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

  const quickPills: { label: string }[] = [];
  if (isListingRestaurant) {
    if (priceLevel) quickPills.push({ label: "R".repeat(priceLevel) });
  }
  const showQuickPills = quickPills.length > 0;

  type BoolField = { label: string; value: boolean | null };
  type TextField = { label: string; value: string | null };
  type AccSection = { key: string; icon: React.ReactNode; title: string; fields: (BoolField | TextField)[] };
  const accordionSections: AccSection[] = [];

  if (isListingRestaurant) {
    const accessFields: BoolField[] = [
      { label: "Wheelchair friendly", value: wheelchairFriendly },
      { label: "Accessible entrance", value: wheelchairEntrance },
      { label: "Accessible seating", value: wheelchairSeating },
      { label: "Accessible toilet", value: wheelchairToilet },
      { label: "Accessible parking", value: wheelchairCarPark },
    ].filter(f => f.value != null) as BoolField[];
    if (accessFields.length > 0) accordionSections.push({ key: "accessibility", icon: <Accessibility size={22} strokeWidth={1.8} color="rgba(18,18,20,0.3)" />, title: "Accessibility", fields: accessFields });

    const kidsFields: BoolField[] = [
      { label: "Good for kids", value: goodForKids },
      { label: "Kids menu", value: kidsMenu },
      { label: "High chairs", value: highChairs },
      { label: "Playground", value: kidsPlayground },
    ].filter(f => f.value != null) as BoolField[];
    if (kidsFields.length > 0) accordionSections.push({ key: "kids", icon: <Users size={22} strokeWidth={1.8} color="rgba(18,18,20,0.3)" />, title: "Kids & Family", fields: kidsFields });

    const amenFields: BoolField[] = [
      { label: "Toilets", value: hasToilet },
      { label: "Wi-Fi", value: hasWifi },
      { label: "Free Wi-Fi", value: hasFreeWifi },
      { label: "Smoking section", value: smokingAllowed },
      { label: "Pets allowed", value: petsAllowed },
    ].filter(f => f.value != null) as BoolField[];
    if (amenFields.length > 0) accordionSections.push({ key: "amenities", icon: <Coffee size={22} strokeWidth={1.8} color="rgba(18,18,20,0.3)" />, title: "Amenities", fields: amenFields });

    if (seating && seating.length > 0) {
      const seatingFields: BoolField[] = seating.map(s => ({ label: s.replace(/ seating$/i, ""), value: true }));
      accordionSections.push({ key: "seating", icon: <ClipboardList size={22} strokeWidth={1.8} color="rgba(18,18,20,0.3)" />, title: "Seating", fields: seatingFields });
    }

    const serviceArr = serviceType || [];
    const svcFields: BoolField[] = [
      { label: "Dine-in", value: serviceArr.some(s => /sit\s*down|dine/i.test(s)) ? true : serviceArr.length > 0 ? false : null },
      { label: "Takeaway", value: serviceArr.some(s => /take\s*away|takeaway/i.test(s)) ? true : serviceArr.length > 0 ? false : null },
      { label: "Delivery", value: serviceArr.some(s => /deliver/i.test(s)) ? true : serviceArr.length > 0 ? false : null },
    ].filter(f => f.value !== null) as BoolField[];
    if (svcFields.length > 0) accordionSections.push({ key: "service", icon: <ClipboardList size={22} strokeWidth={1.8} color="rgba(18,18,20,0.3)" />, title: "Service Options", fields: svcFields });

    if (meal && meal.length > 0) {
      const mealFields: BoolField[] = meal.map(m => ({ label: m, value: true }));
      accordionSections.push({ key: "meals", icon: <Coffee size={22} strokeWidth={1.8} color="rgba(18,18,20,0.3)" />, title: "Meals Served", fields: mealFields });
    }

    if (cuisine && cuisine.length > 0) {
      const cuisineFields: BoolField[] = cuisine.map(c => ({ label: c, value: true }));
      accordionSections.push({ key: "cuisine", icon: <ShoppingBag size={22} strokeWidth={1.8} color="rgba(18,18,20,0.3)" />, title: "Cuisine", fields: cuisineFields });
    }

    if (vibe && vibe.length > 0) {
      const vibeFields: BoolField[] = vibe.map(v => ({ label: v, value: true }));
      accordionSections.push({ key: "vibe", icon: <Star size={22} strokeWidth={1.8} color="rgba(18,18,20,0.3)" />, title: "Vibe", fields: vibeFields });
    }
  }

  const hasContactInfo = listing.location || listing.phone || listing.email || listing.website || (listing as any).whatsapp;
  const descriptionText = longDescription || listing.description;

  const toggleAccordion = (key: string) => {
    setOpenAccordion(openAccordion === key ? null : key);
  };

  const overlayBtn: React.CSSProperties = {
    width: 40, height: 40, borderRadius: "50%",
    background: "rgba(255, 255, 255, 0.85)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    border: "none", cursor: "pointer",
    transition: "transform 0.12s ease",
  };

  const renderAccordionCard = (sections: AccSection[]) => (
    <div style={{ background: "#FFFFFF", borderRadius: 16, border: "1px solid rgba(18,18,20,0.06)", padding: "4px 0", overflow: "hidden", marginBottom: 24 }}>
      {sections.map((section, i) => {
        const isOpen = openAccordion === section.key;
        return (
          <div key={section.key}>
            {i > 0 && <div style={{ height: 1, background: "rgba(18,18,20,0.08)", marginLeft: 56 }} />}
            <button
              onClick={() => toggleAccordion(section.key)}
              style={{ width: "100%", display: "flex", alignItems: "center", padding: "16px 20px", background: "none", border: "none", cursor: "pointer", fontFamily: font }}
            >
              <div style={{ marginRight: 16, flexShrink: 0 }}>{section.icon}</div>
              <span style={{ fontSize: 16, fontWeight: 500, color: "#2B2420", flex: 1, textAlign: "left", fontFamily: font }}>{section.title}</span>
              <ChevronDown
                size={20} strokeWidth={1.8} color="rgba(18,18,20,0.25)"
                style={{ transition: "transform 0.2s ease", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              />
            </button>
            {isOpen && (
              <div style={{ padding: "0 20px 16px 56px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {section.fields.map((field, fi) => {
                    const isBool = typeof field.value === "boolean";
                    if (isBool && field.value) {
                      return (
                        <span key={fi} style={{ background: "rgba(18,18,20,0.06)", borderRadius: 20, padding: "6px 14px", fontSize: 13, fontWeight: 500, color: "#2B2420", fontFamily: font }}>
                          {field.label}
                        </span>
                      );
                    }
                    if (isBool && !field.value) {
                      return (
                        <span key={fi} style={{ background: "rgba(18,18,20,0.06)", borderRadius: 20, padding: "6px 14px", fontSize: 13, fontWeight: 500, color: "rgba(18,18,20,0.35)", textDecoration: "line-through", fontFamily: font }}>
                          {field.label}
                        </span>
                      );
                    }
                    return (
                      <span key={fi} style={{ background: "rgba(18,18,20,0.06)", borderRadius: 20, padding: "6px 14px", fontSize: 13, fontWeight: 500, color: "#2B2420", fontFamily: font }}>
                        {field.label}: {field.value}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // Get today for hours highlight
  const todayIndex = new Date().getDay(); // 0=Sun
  const todayLabel = todayIndex === 0 ? "Sunday" : DAY_LABELS[todayIndex - 1];

  return (
    <div style={{ minHeight: "100vh", background: "#EBEBEB", paddingBottom: 84, fontFamily: font }}>
      {/* Hero image */}
      {listing.image_url ? (
        <div style={{ position: "relative" }}>
          <div style={{ width: "100%", aspectRatio: "4/3", overflow: "hidden" }}>
            <img src={listing.image_url} alt={listing.title} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
          </div>
          <button onClick={() => navigate(-1)} style={{ ...overlayBtn, position: "absolute", top: 16, left: 16, zIndex: 10 }} {...pressScale("0.9")}>
            <ArrowLeft size={20} strokeWidth={1.8} color="#2B2420" />
          </button>
          {isAdmin && (
            <button onClick={() => navigate(`/admin/listings?edit=${listing.id}`)} style={{ ...overlayBtn, position: "absolute", top: 16, right: 16, zIndex: 10 }} title="Edit listing" {...pressScale("0.9")}>
              <Pencil size={20} strokeWidth={1.8} color="#2B2420" />
            </button>
          )}
        </div>
      ) : (
        <div style={{ padding: "48px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => navigate(-1)} style={{ ...overlayBtn, background: "rgba(18,18,20,0.06)" }} {...pressScale("0.9")}>
            <ArrowLeft size={20} strokeWidth={1.8} color="#2B2420" />
          </button>
          <div style={{ display: "flex", gap: 10 }}>
            {isAdmin && (
              <button onClick={() => navigate(`/admin/listings?edit=${listing.id}`)} style={{ ...overlayBtn, background: "rgba(18,18,20,0.06)" }} title="Edit listing" {...pressScale("0.9")}>
                <Pencil size={20} strokeWidth={1.8} color="#2B2420" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content area */}
      <div style={{ paddingTop: 20, paddingLeft: 24, paddingRight: 24 }}>
        {/* Category overline */}
        {firstCategory && (
          <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(18,18,20,0.4)", lineHeight: 1.3, marginBottom: 4, marginTop: 0, fontFamily: font }}>
            {firstCategory.title}
          </p>
        )}

        {/* Listing name */}
        <h1 style={{ fontFamily: font, fontSize: 34, fontWeight: 400, lineHeight: 1.1, letterSpacing: "0.01em", color: "#0a0a0a", textTransform: "capitalize", marginBottom: 8, marginTop: 0 }}>
          {listing.title}
        </h1>

        {/* Google rating */}
        {(listing as any).google_rating != null && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 2 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={16}
                  fill={s <= Math.round((listing as any).google_rating) ? "#D4964A" : "none"}
                  color={s <= Math.round((listing as any).google_rating) ? "#D4964A" : "rgba(18,18,20,0.15)"}
                  strokeWidth={s <= Math.round((listing as any).google_rating) ? 0 : 1.5}
                />
              ))}
            </div>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#2B2420", fontFamily: font }}>{(listing as any).google_rating}</span>
            {(listing as any).google_reviews_count != null && (
              (listing as any).google_reviews_url ? (
                <a href={(listing as any).google_reviews_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 15, fontWeight: 400, color: "rgba(18,18,20,0.4)", textDecoration: "none", fontFamily: font }}>
                  ({(listing as any).google_reviews_count} reviews)
                </a>
              ) : (
                <span style={{ fontSize: 15, fontWeight: 400, color: "rgba(18,18,20,0.4)", fontFamily: font }}>({(listing as any).google_reviews_count} reviews)</span>
              )
            )}
          </div>
        )}

        {/* Action buttons row (Share, Save, Visited) */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button
            onClick={handleShare}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              background: "transparent", border: "1.5px solid rgba(18,18,20,0.15)", borderRadius: 24,
              padding: "12px", height: 48, cursor: "pointer", transition: "transform 0.12s ease", fontFamily: font,
            }}
            {...pressScale()}
          >
            <Share2 size={14} strokeWidth={1.8} color="#2B2420" />
            <span style={{ fontSize: 13, fontWeight: 500, color: "#2B2420" }}>Share</span>
          </button>
          <button
            onClick={() => { if (!requireAuth()) toggleFavourite.mutate(); }}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              background: "transparent",
              border: isFavourited ? "1.5px solid #D4654A" : "1.5px solid rgba(18,18,20,0.15)",
              borderRadius: 24, padding: "12px", height: 48, cursor: "pointer", transition: "transform 0.12s ease", fontFamily: font,
            }}
            {...pressScale()}
          >
            <Heart size={14} strokeWidth={1.8} color={isFavourited ? "#D4654A" : "#2B2420"} fill={isFavourited ? "#D4654A" : "none"} />
            <span style={{ fontSize: 13, fontWeight: 500, color: "#2B2420" }}>{isFavourited ? "Saved" : "Save"}</span>
          </button>
          <button
            onClick={() => { if (!requireAuth()) toggleVisited.mutate(); }}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              background: "transparent",
              border: isVisited ? "1.5px solid #3B7D4F" : "1.5px solid rgba(18,18,20,0.15)",
              borderRadius: 24, padding: "12px", height: 48, cursor: "pointer", transition: "transform 0.12s ease", fontFamily: font,
            }}
            {...pressScale()}
          >
            <CheckCircle size={14} strokeWidth={1.8} color={isVisited ? "#3B7D4F" : "#2B2420"} fill={isVisited ? "#3B7D4F" : "none"} />
            <span style={{ fontSize: 13, fontWeight: 500, color: "#2B2420" }}>Visited</span>
          </button>
        </div>

        {/* Call Now & Directions */}
        {(listing.phone || (listing as any).google_maps_link) && (
          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            {listing.phone && (
              <a
                href={`tel:${listing.phone}`}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  background: "#020202", color: "#FFFFFF", border: "none", borderRadius: 16,
                  padding: "12px 20px", height: 48, fontSize: 15, fontWeight: 600,
                  textDecoration: "none", cursor: "pointer", transition: "transform 0.12s ease, opacity 0.12s ease",
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", textTransform: "capitalize",
                }}
                onPointerDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.97)"; (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
                onPointerUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                onPointerLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; (e.currentTarget as HTMLElement).style.opacity = "1"; }}
              >
                <Phone size={20} strokeWidth={1.8} color="#FFFFFF" />
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
                  background: "#020202", color: "#FFFFFF", border: "none", borderRadius: 16,
                  padding: "12px 20px", height: 48, fontSize: 15, fontWeight: 600,
                  textDecoration: "none", cursor: "pointer", transition: "transform 0.12s ease, opacity 0.12s ease",
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", textTransform: "capitalize",
                }}
                onPointerDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.97)"; (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
                onPointerUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                onPointerLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; (e.currentTarget as HTMLElement).style.opacity = "1"; }}
              >
                <Navigation size={20} strokeWidth={1.8} color="#FFFFFF" />
                Directions
              </a>
            )}
          </div>
        )}

        {/* Quick-scan pills */}
        {showQuickPills && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            {quickPills.slice(0, 4).map((pill, i) => (
              <span key={i} style={{ background: "rgba(18,18,20,0.06)", borderRadius: 20, padding: "6px 14px", fontSize: 13, fontWeight: 500, color: "#2B2420", fontFamily: font }}>
                {pill.label}
              </span>
            ))}
          </div>
        )}

        {/* Contact details card */}
        {hasContactInfo && (
          <div style={{ background: "#FFFFFF", borderRadius: 16, border: "1px solid rgba(18,18,20,0.06)", padding: "4px 0", overflow: "hidden", marginBottom: 24 }}>
            {[
              listing.location && {
                icon: <MapPin size={20} strokeWidth={1.8} color="rgba(18,18,20,0.3)" />,
                text: listing.location,
                href: (listing as any).google_maps_link || undefined,
                external: true,
              },
              listing.phone && {
                icon: <Phone size={20} strokeWidth={1.8} color="rgba(18,18,20,0.3)" />,
                text: listing.phone,
                href: `tel:${listing.phone}`,
              },
              listing.email && {
                icon: <Mail size={20} strokeWidth={1.8} color="rgba(18,18,20,0.3)" />,
                text: listing.email,
                href: `mailto:${listing.email}`,
              },
              listing.website && {
                icon: <Globe size={20} strokeWidth={1.8} color="rgba(18,18,20,0.3)" />,
                text: "Website",
                href: listing.website,
                external: true,
              },
              (listing as any).whatsapp && {
                icon: <MessageCircle size={20} strokeWidth={1.8} color="rgba(18,18,20,0.3)" />,
                text: "WhatsApp",
                href: `https://wa.me/${(listing as any).whatsapp.replace(/[^0-9]/g, "")}`,
                external: true,
              },
            ].filter(Boolean).map((row: any, i, arr) => (
              <div key={i}>
                {i > 0 && <div style={{ height: 1, background: "rgba(18,18,20,0.08)", marginLeft: 56 }} />}
                <a
                  href={row.href}
                  target={row.external ? "_blank" : undefined}
                  rel={row.external ? "noopener noreferrer" : undefined}
                  style={{
                    display: "flex", alignItems: "center", gap: 16,
                    padding: "14px 20px",
                    textDecoration: "none", cursor: row.href ? "pointer" : "default",
                    transition: "opacity 0.12s ease",
                  }}
                  {...(row.href ? pressOpacity : {})}
                >
                  {row.icon}
                  <span style={{ fontSize: 15, fontWeight: 400, color: "#2B2420", lineHeight: 1.3, fontFamily: font }}>{row.text}</span>
                </a>
              </div>
            ))}
          </div>
        )}

        {/* About section */}
        {descriptionText && (() => {
          const paragraphs = (longDescription || listing.description || "").split("\n").filter(Boolean);
          return (
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontFamily: font, fontWeight: 400, fontSize: 26, color: "#0a0a0a", textTransform: "capitalize", letterSpacing: "0.01em", lineHeight: 1.15, marginBottom: 8, marginTop: 0 }}>About</h2>
              <div style={{
                ...(!aboutExpanded ? { display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const, overflow: "hidden" } : {})
              }}>
                {paragraphs.map((paragraph: string, i: number) => (
                  <p key={i} style={{ fontSize: 16, fontWeight: 400, color: "rgba(18,18,20,0.55)", lineHeight: 1.45, marginBottom: 12, fontFamily: font }}>{paragraph}</p>
                ))}
              </div>
              {paragraphs.join(" ").length > 150 && (
                <button
                  onClick={() => setAboutExpanded(!aboutExpanded)}
                  style={{ fontSize: 15, fontWeight: 500, color: "#020202", background: "none", border: "none", padding: 0, cursor: "pointer", marginTop: 4, textDecoration: "none", fontFamily: font, transition: "opacity 0.12s ease" }}
                  {...pressOpacity}
                >
                  {aboutExpanded ? "Show less" : "Read more"}
                </button>
              )}
            </div>
          );
        })()}

        {/* Accordion sections */}
        {accordionSections.length > 0 && renderAccordionCard(accordionSections)}

        {/* Shopping attributes */}
        {isListingShopping && (() => {
          const airCon = (listing as any).air_conditioned as boolean | null;
          const paymentMethods = (listing as any).payment_methods as string[] | null;
          const deliveryAvail = (listing as any).delivery_available as boolean | null;
          const clickCollect = (listing as any).click_and_collect as boolean | null;
          const orderOnline = (listing as any).order_online as boolean | null;
          const parkingAvail = (listing as any).parking_available as boolean | null;
          const shopWheelchair = (listing as any).wheelchair_friendly as boolean | null;
          const localProds = (listing as any).local_products as boolean | null;
          const shopType = (listing as any).shop_type as string | null;
          const curioGifts = (listing as any).curio_or_gifts as boolean | null;
          const prodCats = (listing as any).product_categories as string[] | null;
          const priceRng = (listing as any).price_range as string | null;

          const items = [
            shopType && `Type: ${shopType}`,
            priceRng && `Price: ${priceRng}`,
            airCon && "Air Conditioned",
            deliveryAvail && "Delivery Available",
            clickCollect && "Click & Collect",
            orderOnline && "Order Online",
            parkingAvail && "Parking Available",
            shopWheelchair && "Wheelchair Friendly",
            localProds && "Local Products",
            curioGifts && "Curio / Gifts",
            paymentMethods && paymentMethods.length > 0 && `Payment: ${paymentMethods.join(", ")}`,
            prodCats && prodCats.length > 0 && `Products: ${prodCats.join(", ")}`,
          ].filter(Boolean) as string[];

          if (items.length === 0) return null;

          return (
            <div style={{ background: "#FFFFFF", border: "1px solid rgba(18,18,20,0.06)", borderRadius: 16, padding: 20, marginBottom: 24 }}>
              <h3 style={{ fontFamily: font, fontWeight: 400, fontSize: 26, color: "#0a0a0a", textTransform: "capitalize", letterSpacing: "0.01em", marginBottom: 12, marginTop: 0 }}>Details</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {items.map((item) => (
                  <span key={item} style={{ background: "rgba(18,18,20,0.06)", borderRadius: 20, padding: "6px 14px", fontSize: 13, fontWeight: 500, color: "#2B2420", fontFamily: font }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Accommodation sections */}
        {isListingAccommodation && (() => {
          const l = listing as any;
          const accomSections: AccSection[] = [];

          const foodFields: BoolField[] = [
            { label: "Restaurant", value: l.has_restaurant },
            { label: "Bar", value: l.has_bar },
            { label: "Room Service", value: l.has_room_service },
            { label: "Breakfast", value: l.has_breakfast },
          ].filter(f => f.value != null) as BoolField[];
          if (l.has_breakfast && l.breakfast_included != null) {
            foodFields.push({ label: l.breakfast_included ? "Breakfast Included" : "Breakfast Paid", value: true });
          }
          if (foodFields.length > 0) accomSections.push({ key: "accom-food", icon: <Coffee size={22} strokeWidth={1.8} color="rgba(18,18,20,0.3)" />, title: "Food & Drink", fields: foodFields });

          const childFields: BoolField[] = [
            { label: "Child Friendly", value: l.child_friendly },
          ].filter(f => f.value != null) as BoolField[];
          if (childFields.length > 0) accomSections.push({ key: "accom-children", icon: <Users size={22} strokeWidth={1.8} color="rgba(18,18,20,0.3)" />, title: "Children", fields: childFields });

          const transportFields: BoolField[] = [
            { label: "Airport Shuttle", value: l.has_airport_shuttle },
            { label: "Free Parking", value: l.has_free_parking },
            { label: "Secure Parking", value: l.has_secure_parking },
          ].filter(f => f.value != null) as BoolField[];
          if (transportFields.length > 0) accomSections.push({ key: "accom-transport", icon: <Navigation size={22} strokeWidth={1.8} color="rgba(18,18,20,0.3)" />, title: "Transport", fields: transportFields });

          const wellnessFields: BoolField[] = [
            { label: "Spa", value: l.has_spa },
            { label: "Fitness Centre", value: l.has_fitness_centre },
            { label: "Swimming Pool", value: l.has_swimming_pool },
          ].filter(f => f.value != null) as BoolField[];
          if (wellnessFields.length > 0) accomSections.push({ key: "accom-wellness", icon: <Heart size={22} strokeWidth={1.8} color="rgba(18,18,20,0.3)" />, title: "Wellness", fields: wellnessFields });

          const roomFields: BoolField[] = [
            { label: "Aircon", value: l.has_aircon },
            { label: "Laundry Service", value: l.has_laundry },
          ].filter(f => f.value != null) as BoolField[];
          if (roomFields.length > 0) accomSections.push({ key: "accom-rooms", icon: <ClipboardList size={22} strokeWidth={1.8} color="rgba(18,18,20,0.3)" />, title: "Rooms", fields: roomFields });

          const internetFields: BoolField[] = [
            { label: "Wi-Fi", value: l.has_wifi_accom },
          ].filter(f => f.value != null) as BoolField[];
          if (internetFields.length > 0) accomSections.push({ key: "accom-internet", icon: <Wifi size={22} strokeWidth={1.8} color="rgba(18,18,20,0.3)" />, title: "Internet", fields: internetFields });

          const petFields: BoolField[] = [
            { label: "Pet Friendly", value: l.pets_allowed },
          ].filter(f => f.value != null) as BoolField[];
          if (petFields.length > 0) accomSections.push({ key: "accom-pets", icon: <Heart size={22} strokeWidth={1.8} color="rgba(18,18,20,0.3)" />, title: "Pets", fields: petFields });

          const sleeps = l.sleeps as number | null;
          const priceRng = l.price_range as string | null;
          const kmFromTown = l.km_from_town as string | null;
          const infoItems = [
            sleeps != null && `Sleeps: ${sleeps}`,
            priceRng && `Price: ${priceRng}`,
            kmFromTown && `${kmFromTown} km from town`,
          ].filter(Boolean) as string[];

          if (accomSections.length === 0 && infoItems.length === 0) return null;

          return (
            <>
              {infoItems.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                  {infoItems.map((item) => (
                    <span key={item} style={{ background: "rgba(18,18,20,0.06)", borderRadius: 20, padding: "6px 14px", fontSize: 13, fontWeight: 500, color: "#2B2420", fontFamily: font }}>
                      {item}
                    </span>
                  ))}
                </div>
              )}
              {accomSections.length > 0 && renderAccordionCard(accomSections)}
            </>
          );
        })()}

        {/* Hours section */}
        <div ref={whatToKnowRef} />
        {hasHours && (() => {
          const saToday = getSADate();
          const holidayCheck = isSAPublicHoliday(saToday);
          return (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <Clock size={24} strokeWidth={1.8} color="rgba(18,18,20,0.3)" />
                <h2 style={{ fontFamily: font, fontWeight: 400, fontSize: 26, color: "#0a0a0a", textTransform: "capitalize", letterSpacing: "0.01em", margin: 0 }}>Hours</h2>
              </div>
              {holidayCheck.isHoliday && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, padding: "8px 12px", background: "#fef3c7", borderRadius: 10, border: "1px solid #fde68a" }}>
                  <span style={{ fontSize: 13, color: "#92400e", fontFamily: font }}>
                    <strong>Public holiday</strong> — Hours might differ
                  </span>
                </div>
              )}
              <div style={{ background: "#FFFFFF", borderRadius: 16, border: "1px solid rgba(18,18,20,0.06)", padding: "4px 0", overflow: "hidden" }}>
                {DAY_LABELS.map((day, i) => {
                  const key = day.toLowerCase();
                  const value = openingHours![key] || "";
                  const isClosed = !value || value.toLowerCase() === "closed";
                  const isToday = day === todayLabel;
                  return (
                    <div key={day}>
                      {i > 0 && <div style={{ height: 1, background: "rgba(18,18,20,0.08)" }} />}
                      <div
                        style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "12px 20px",
                          background: isToday ? "rgba(18,18,20,0.03)" : "transparent",
                        }}
                      >
                        <span style={{ fontSize: 15, fontWeight: 500, color: isToday ? "#020202" : "#2B2420", fontFamily: font }}>{day}</span>
                        <span style={{ fontSize: 15, fontWeight: 400, color: isClosed ? "rgba(18,18,20,0.35)" : "rgba(18,18,20,0.55)", fontFamily: font }}>{value || "Closed"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Suggest an edit */}
        <div style={{ marginTop: 8, marginBottom: 36, display: "flex", justifyContent: "center" }}>
          <a
            href={`mailto:info@hellohoedspruit.com?subject=${encodeURIComponent(`${listing?.title || "Listing"} – Edit Suggestion`)}`}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 14, fontWeight: 400, color: "rgba(18,18,20,0.35)",
              textDecoration: "none", cursor: "pointer", transition: "opacity 0.12s ease", fontFamily: font,
            }}
            {...pressOpacity}
          >
            <Pencil size={16} strokeWidth={1.8} color="rgba(18,18,20,0.35)" />
            Suggest an edit
          </a>
        </div>
      </div>

      {hasGallery && (
        <section style={{ marginBottom: 24, marginTop: 8 }}>
          <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", color: "rgba(43,36,32,0.5)", textTransform: "uppercase", marginBottom: 4 }}>Gallery</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#2B2420", letterSpacing: "-0.01em" }}>More photos</div>
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="inline-flex" style={{ gap: 12, paddingLeft: 24, paddingRight: 24, paddingBottom: 4 }}>
              {galleryImages!.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
                  style={{ width: 220, aspectRatio: "4/3", borderRadius: 16, overflow: "hidden", background: "#f0f0f0", flexShrink: 0, border: "none", padding: 0, cursor: "pointer" }}
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
