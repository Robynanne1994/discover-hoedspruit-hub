import { useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  MapPin, Phone, Mail, Globe, Star, Clock, Baby, PawPrint, Accessibility,
  DollarSign, UtensilsCrossed, Palette, ChefHat, Armchair, Cigarette,
  ShoppingBag, Check, Wifi, Ban, MessageCircle, Pencil, ArrowLeft,
  Heart, Share2, CheckCircle, ChevronDown,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { isRestaurantCategory, isShoppingCategory, isAccommodationCategory } from "@/lib/categoryFields";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const ListingDetail = () => {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const whatToKnowRef = useRef<HTMLDivElement>(null);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

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

  // Favourite state
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

  // Visited state
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
      <div style={{ minHeight: "100vh", background: "#ffffff" }}>
        <div style={{ padding: "52px 24px 0" }}>
          <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "rgba(18,18,20,0.4)", fontSize: 15, fontWeight: 500 }}>
            <ArrowLeft size={18} strokeWidth={2} /> Back
          </button>
        </div>
        <div style={{ padding: "48px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(18,18,20,0.04)", animation: "pulse 2s infinite" }} />
          <p style={{ fontSize: 13, color: "rgba(18,18,20,0.35)" }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div style={{ minHeight: "100vh", background: "#ffffff" }}>
        <div style={{ padding: "52px 24px 0" }}>
          <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "rgba(18,18,20,0.4)", fontSize: 15, fontWeight: 500 }}>
            <ArrowLeft size={18} strokeWidth={2} /> Back
          </button>
        </div>
        <div style={{ padding: "80px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "rgba(18,18,20,0.4)", marginBottom: 16 }}>Listing not found.</p>
          <Link to="/" style={{ fontSize: 13, fontWeight: 600, color: "#121214" }}>Back to Home</Link>
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
  const hasHours = openingHours && Object.values(openingHours).some((v) => v);
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

  const kidsItems = [
    { label: "Good for Kids", value: goodForKids },
    { label: "Kids Playground", value: kidsPlayground },
    { label: "Kids Menu", value: kidsMenu },
    { label: "High Chairs", value: highChairs },
  ].filter((item) => item.value === true);
  const hasKidsInfo = kidsItems.length > 0;

  const accessibilityItems = [
    { label: "Wheelchair Friendly", value: wheelchairFriendly },
    { label: "Wheelchair-accessible Car Park", value: wheelchairCarPark },
    { label: "Wheelchair-accessible Entrance", value: wheelchairEntrance },
    { label: "Wheelchair-accessible Seating", value: wheelchairSeating },
    { label: "Wheelchair-accessible Toilet", value: wheelchairToilet },
  ].filter((item) => item.value === true);
  const hasAccessibilityInfo = accessibilityItems.length > 0;

  const amenitiesItems = [
    { label: "Toilet", value: hasToilet },
    { label: "Wi-Fi", value: hasWifi },
    { label: "Free Wi-Fi", value: hasFreeWifi },
  ].filter((item) => item.value === true);
  const hasAmenitiesInfo = amenitiesItems.length > 0;

  const hasSitDown = serviceType?.includes("Sit down") || serviceType?.includes("Dine-in") || false;
  const hasTakeaway = serviceType?.includes("Takeaway") || serviceType?.includes("Take away") || false;
  const hasDelivery = serviceType?.includes("Delivery") || false;
  const serviceItems = [
    ...(hasSitDown ? [{ label: "Sit down", available: true }] : []),
    ...(hasTakeaway ? [{ label: "Takeaway", available: true }] : []),
    { label: "Delivery", available: hasDelivery },
  ];
  const hasServiceInfo = hasSitDown || hasTakeaway || true;

  const seatingItems = [
    ...(seating?.includes("Bar seating") ? [{ label: "Bar seating" }] : []),
    ...(seating?.includes("Indoor seating") ? [{ label: "Indoor seating" }] : []),
    ...(seating?.includes("Outdoor seating") ? [{ label: "Outdoor seating" }] : []),
  ];
  const hasSeatingInfo = seatingItems.length > 0;

  const diningDetails: { label: string; value: string }[] = [];
  if (cuisine && cuisine.length > 0) diningDetails.push({ label: "Cuisine", value: cuisine.join(", ") });
  if (vibe && vibe.length > 0) diningDetails.push({ label: "Vibe", value: vibe.join(", ") });
  if (meal && meal.length > 0) diningDetails.push({ label: "Meal types", value: meal.join(", ") });
  const hasDiningInfo = diningDetails.length > 0;

  const hasContactInfo = listing.location || listing.phone || listing.email || listing.website || (listing as any).whatsapp;

  const descriptionText = longDescription || listing.description;

  // Build accordion sections
  type AccSection = { key: string; icon: React.ReactNode; title: string; content: React.ReactNode };
  const accordionSections: AccSection[] = [];

  if (isListingRestaurant) {
    // Kids
    if (hasKidsInfo) {
      accordionSections.push({
        key: "kids", icon: <Baby size={18} strokeWidth={1.5} color="rgba(18,18,20,0.3)" />, title: "Kids",
        content: (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {kidsItems.map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#121214" }}>
                <Check size={14} color="#121214" /> <span>{item.label}</span>
              </div>
            ))}
          </div>
        ),
      });
    }
    // Services
    if (hasServiceInfo) {
      accordionSections.push({
        key: "service", icon: <ShoppingBag size={18} strokeWidth={1.5} color="rgba(18,18,20,0.3)" />, title: "Services",
        content: (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {serviceItems.map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: item.available ? "#121214" : "rgba(18,18,20,0.35)" }}>
                {item.available ? <Check size={14} color="#121214" /> : <Ban size={14} color="rgba(18,18,20,0.3)" />}
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        ),
      });
    }
    // Cuisines
    if (cuisine && cuisine.length > 0) {
      accordionSections.push({
        key: "cuisines", icon: <ChefHat size={18} strokeWidth={1.5} color="rgba(18,18,20,0.3)" />, title: "Cuisines",
        content: (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {cuisine.map((c) => (
              <div key={c} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#121214" }}>
                <Check size={14} color="#121214" /> <span>{c}</span>
              </div>
            ))}
          </div>
        ),
      });
    }
    // Amenities
    if (hasAmenitiesInfo) {
      accordionSections.push({
        key: "amenities", icon: <Wifi size={18} strokeWidth={1.5} color="rgba(18,18,20,0.3)" />, title: "Amenities",
        content: (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {amenitiesItems.map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#121214" }}>
                <Check size={14} color="#121214" /> <span>{item.label}</span>
              </div>
            ))}
          </div>
        ),
      });
    }
    // Meals
    if (meal && meal.length > 0) {
      accordionSections.push({
        key: "meals", icon: <UtensilsCrossed size={18} strokeWidth={1.5} color="rgba(18,18,20,0.3)" />, title: "Meals",
        content: (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {meal.map((m) => (
              <div key={m} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#121214" }}>
                <Check size={14} color="#121214" /> <span>{m}</span>
              </div>
            ))}
          </div>
        ),
      });
    }
    // Accessibility
    if (hasAccessibilityInfo) {
      accordionSections.push({
        key: "accessibility", icon: <Accessibility size={18} strokeWidth={1.5} color="rgba(18,18,20,0.3)" />, title: "Accessibility",
        content: (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {accessibilityItems.map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#121214" }}>
                <Check size={14} color="#121214" /> <span>{item.label}</span>
              </div>
            ))}
          </div>
        ),
      });
    }
    // Seating
    if (hasSeatingInfo) {
      accordionSections.push({
        key: "seating", icon: <Armchair size={18} strokeWidth={1.5} color="rgba(18,18,20,0.3)" />, title: "Seating",
        content: (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {seatingItems.map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#121214" }}>
                <Check size={14} color="#121214" /> <span>{item.label}</span>
              </div>
            ))}
          </div>
        ),
      });
    }
    // Vibe
    if (vibe && vibe.length > 0) {
      accordionSections.push({
        key: "vibe", icon: <Palette size={18} strokeWidth={1.5} color="rgba(18,18,20,0.3)" />, title: "Vibe",
        content: (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {vibe.map((v) => (
              <div key={v} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#121214" }}>
                <Check size={14} color="#121214" /> <span>{v}</span>
              </div>
            ))}
          </div>
        ),
      });
    }
  }

  const toggleAccordion = (key: string) => {
    setOpenAccordion(openAccordion === key ? null : key);
  };

  const circleBtn: React.CSSProperties = {
    width: 38, height: 38, borderRadius: "50%", background: "#ffffff",
    display: "flex", alignItems: "center", justifyContent: "center",
    border: "none", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", paddingBottom: 72 }}>
      {/* Hero image */}
      {listing.image_url ? (
        <div style={{ position: "relative" }}>
          <div style={{ height: 280, overflow: "hidden" }}>
            <img src={listing.image_url} alt={listing.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          {/* Back button */}
          <button onClick={() => navigate(-1)} style={{ ...circleBtn, position: "absolute", top: 48, left: 20, zIndex: 10 }}>
            <ArrowLeft size={18} strokeWidth={2} color="#121214" />
          </button>
          {/* Save & Share buttons */}
          <div style={{ position: "absolute", top: 48, right: 20, zIndex: 10, display: "flex", gap: 10 }}>
            <button onClick={() => { if (!requireAuth()) toggleFavourite.mutate(); }} style={circleBtn}>
              <Heart size={18} strokeWidth={1.5} color="#121214" fill={isFavourited ? "#121214" : "none"} />
            </button>
            <button onClick={handleShare} style={circleBtn}>
              <Share2 size={18} strokeWidth={1.5} color="#121214" />
            </button>
            {isAdmin && (
              <button onClick={() => navigate(`/admin/listings?edit=${listing.id}`)} style={circleBtn} title="Edit listing">
                <Pencil size={18} strokeWidth={1.5} color="#121214" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ padding: "48px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => navigate(-1)} style={{ ...circleBtn, background: "rgba(18,18,20,0.04)" }}>
            <ArrowLeft size={18} strokeWidth={2} color="#121214" />
          </button>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { if (!requireAuth()) toggleFavourite.mutate(); }} style={{ ...circleBtn, background: "rgba(18,18,20,0.04)" }}>
              <Heart size={18} strokeWidth={1.5} color="#121214" fill={isFavourited ? "#121214" : "none"} />
            </button>
            <button onClick={handleShare} style={{ ...circleBtn, background: "rgba(18,18,20,0.04)" }}>
              <Share2 size={18} strokeWidth={1.5} color="#121214" />
            </button>
            {isAdmin && (
              <button onClick={() => navigate(`/admin/listings?edit=${listing.id}`)} style={{ ...circleBtn, background: "rgba(18,18,20,0.04)" }} title="Edit listing">
                <Pencil size={18} strokeWidth={1.5} color="#121214" />
              </button>
            )}
          </div>
        </div>
      )}

      <div style={{ padding: "24px 24px 0" }}>
        {/* Category label */}
        {firstCategory && (
          <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(18,18,20,0.3)", textTransform: "uppercase", letterSpacing: 3, marginBottom: 8 }}>
            {firstCategory.title}
          </div>
        )}

        {/* Title */}
        <h1 style={{ fontWeight: 900, fontSize: 32, color: "#121214", lineHeight: 1.0, letterSpacing: -0.3, marginBottom: 14 }}>
          {listing.title}
        </h1>

        {/* Star rating */}
        {(listing as any).google_rating != null && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 2 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={14}
                  fill={s <= Math.round((listing as any).google_rating) ? "#E8A83E" : "none"}
                  color={s <= Math.round((listing as any).google_rating) ? "#E8A83E" : "rgba(18,18,20,0.15)"}
                  strokeWidth={s <= Math.round((listing as any).google_rating) ? 0 : 1.5}
                />
              ))}
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#121214" }}>{(listing as any).google_rating}</span>
            {(listing as any).google_reviews_count != null && (
              (listing as any).google_reviews_url ? (
                <a href={(listing as any).google_reviews_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "rgba(18,18,20,0.35)", textDecoration: "none" }}>
                  ({(listing as any).google_reviews_count} reviews)
                </a>
              ) : (
                <span style={{ fontSize: 13, color: "rgba(18,18,20,0.35)" }}>({(listing as any).google_reviews_count} reviews)</span>
              )
            )}
          </div>
        )}

        {/* Action buttons row */}
        <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
          {[
            { label: isFavourited ? "Saved" : "Save", icon: <Heart size={16} strokeWidth={1.5} color="rgba(18,18,20,0.4)" fill={isFavourited ? "rgba(18,18,20,0.4)" : "none"} />, onClick: () => { if (!requireAuth()) toggleFavourite.mutate(); } },
            { label: "Share", icon: <Share2 size={16} strokeWidth={1.5} color="rgba(18,18,20,0.4)" />, onClick: handleShare },
            { label: isVisited ? "Visited" : "Visited", icon: <CheckCircle size={16} strokeWidth={1.5} color="rgba(18,18,20,0.4)" fill={isVisited ? "rgba(18,18,20,0.4)" : "none"} />, onClick: () => { if (!requireAuth()) toggleVisited.mutate(); } },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={btn.onClick}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "rgba(18,18,20,0.04)", border: "1px solid rgba(18,18,20,0.08)",
                borderRadius: 10, padding: "10px 16px", cursor: "pointer",
                fontSize: 13, fontWeight: 600, color: "rgba(18,18,20,0.6)",
              }}
            >
              {btn.icon} {btn.label}
            </button>
          ))}
        </div>

        {/* Contact details block */}
        {hasContactInfo && (
          <div style={{ background: "rgba(18,18,20,0.03)", border: "1px solid rgba(18,18,20,0.06)", borderRadius: 16, overflow: "hidden", marginBottom: 28 }}>
            {[
              listing.location && {
                icon: <MapPin size={18} strokeWidth={1.5} color="#121214" />,
                text: listing.location,
                href: (listing as any).google_maps_link || undefined,
                external: true,
              },
              listing.phone && {
                icon: <Phone size={18} strokeWidth={1.5} color="#121214" />,
                text: listing.phone,
                href: `tel:${listing.phone}`,
              },
              listing.email && {
                icon: <Mail size={18} strokeWidth={1.5} color="#121214" />,
                text: listing.email,
                href: `mailto:${listing.email}`,
              },
              listing.website && {
                icon: <Globe size={18} strokeWidth={1.5} color="#121214" />,
                text: "Website",
                href: listing.website,
                external: true,
              },
              (listing as any).whatsapp && {
                icon: <MessageCircle size={18} strokeWidth={1.5} color="#121214" />,
                text: "WhatsApp",
                href: `https://wa.me/${(listing as any).whatsapp.replace(/[^0-9]/g, "")}`,
                external: true,
              },
            ].filter(Boolean).map((row: any, i, arr) => (
              <a
                key={i}
                href={row.href}
                target={row.external ? "_blank" : undefined}
                rel={row.external ? "noopener noreferrer" : undefined}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 16px",
                  borderBottom: i < arr.length - 1 ? "1px solid rgba(18,18,20,0.06)" : "none",
                  textDecoration: "none", cursor: row.href ? "pointer" : "default",
                }}
              >
                {row.icon}
                <span style={{ fontSize: 14, color: "rgba(18,18,20,0.4)" }}>{row.text}</span>
              </a>
            ))}
          </div>
        )}

        {/* About section */}
        {descriptionText && (
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontWeight: 900, fontSize: 18, color: "#121214", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 14 }}>About</h2>
            {(longDescription || listing.description || "").split("\n").map((paragraph: string, i: number) => (
              <p key={i} style={{ fontSize: 14, color: "rgba(18,18,20,0.6)", lineHeight: 1.7, marginBottom: 12 }}>{paragraph}</p>
            ))}
          </div>
        )}

        {/* Accordion sections */}
        {accordionSections.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            {accordionSections.map((section, i) => {
              const isOpen = openAccordion === section.key;
              return (
                <div
                  key={section.key}
                  style={{
                    background: "rgba(18,18,20,0.03)",
                    border: "1px solid rgba(18,18,20,0.06)",
                    borderRadius: 16,
                    marginBottom: i < accordionSections.length - 1 ? 10 : 0,
                    overflow: "hidden",
                  }}
                >
                  <button
                    onClick={() => toggleAccordion(section.key)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: 16, background: "none", border: "none", cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {section.icon}
                      <span style={{ fontSize: 15, fontWeight: 600, color: "#121214" }}>{section.title}</span>
                    </div>
                    <ChevronDown
                      size={16} strokeWidth={2} color="rgba(18,18,20,0.3)"
                      style={{ transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                    />
                  </button>
                  {isOpen && (
                    <div style={{ padding: "0 16px 16px 16px" }}>
                      {section.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Shopping attributes as accordion-style cards */}
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
            <div style={{ background: "rgba(18,18,20,0.03)", border: "1px solid rgba(18,18,20,0.06)", borderRadius: 16, padding: 16, marginBottom: 28 }}>
              <h3 style={{ fontWeight: 900, fontSize: 18, color: "#121214", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 14 }}>Details</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {items.map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#121214" }}>
                    <Check size={14} color="#121214" /> <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Accommodation attributes */}
        {isListingAccommodation && (() => {
          const petsAllowedAccom = (listing as any).pets_allowed as boolean | null;
          const amenities = (listing as any).amenities as string[] | null;
          const sleeps = (listing as any).sleeps as number | null;
          const priceRng = (listing as any).price_range as string | null;
          const kmFromTown = (listing as any).km_from_town as string | null;

          const items = [
            petsAllowedAccom && "Pets Allowed",
            sleeps != null && `Sleeps: ${sleeps}`,
            priceRng && `Price: ${priceRng}`,
            kmFromTown && `${kmFromTown} km from town`,
            ...(amenities || []),
          ].filter(Boolean) as string[];

          if (items.length === 0) return null;

          return (
            <div style={{ background: "rgba(18,18,20,0.03)", border: "1px solid rgba(18,18,20,0.06)", borderRadius: 16, padding: 16, marginBottom: 28 }}>
              <h3 style={{ fontWeight: 900, fontSize: 18, color: "#121214", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 14 }}>Details</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {items.map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#121214" }}>
                    <Check size={14} color="#121214" /> <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Hours section */}
        <div ref={whatToKnowRef} />
        {hasHours && (
          <div style={{ marginBottom: 100 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Clock size={18} strokeWidth={1.5} color="rgba(18,18,20,0.3)" />
              <h2 style={{ fontWeight: 900, fontSize: 18, color: "#121214", textTransform: "uppercase", letterSpacing: 0.5 }}>Hours</h2>
            </div>
            <div style={{ background: "rgba(18,18,20,0.03)", border: "1px solid rgba(18,18,20,0.06)", borderRadius: 16, overflow: "hidden" }}>
              {DAY_LABELS.map((day, i) => {
                const value = openingHours[day.toLowerCase()] || "";
                const isClosed = !value || value.toLowerCase() === "closed";
                return (
                  <div
                    key={day}
                    style={{
                      display: "flex", justifyContent: "space-between", padding: "13px 16px",
                      borderBottom: i < DAY_LABELS.length - 1 ? "1px solid rgba(18,18,20,0.06)" : "none",
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#121214" }}>{day}</span>
                    <span style={{ fontSize: 14, color: isClosed ? "rgba(18,18,20,0.3)" : "rgba(18,18,20,0.5)" }}>{value || "Closed"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* If no hours, add bottom margin */}
        {!hasHours && <div style={{ marginBottom: 100 }} />}
      </div>

      <BottomNav />
    </div>
  );
};

export default ListingDetail;
