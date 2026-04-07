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
import { toast } from "sonner";

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "Public Holidays"];

const ListingDetail = () => {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const whatToKnowRef = useRef<HTMLDivElement>(null);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [aboutExpanded, setAboutExpanded] = useState(false);

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

  // Quick-scan pills for restaurants
  const quickPills: { label: string }[] = [];
  if (isListingRestaurant) {
    if (cuisine && cuisine.length > 0) quickPills.push({ label: cuisine.join(", ") });
    if (vibe && vibe.length > 0) quickPills.push({ label: vibe.join(", ") });
    if (priceLevel) quickPills.push({ label: "R".repeat(priceLevel) });
    
  }
  const showQuickPills = quickPills.length > 0;

  // Build accordion sections for restaurants
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
    if (accessFields.length > 0) {
      accordionSections.push({ key: "accessibility", icon: <Accessibility size={18} strokeWidth={1.5} color="#121214" />, title: "Accessibility", fields: accessFields });
    }

    const kidsFields: BoolField[] = [
      { label: "Good for kids", value: goodForKids },
      { label: "Kids menu", value: kidsMenu },
      { label: "High chairs", value: highChairs },
      { label: "Playground", value: kidsPlayground },
    ].filter(f => f.value != null) as BoolField[];
    if (kidsFields.length > 0) {
      accordionSections.push({ key: "kids", icon: <Users size={18} strokeWidth={1.5} color="#121214" />, title: "Kids & Family", fields: kidsFields });
    }

    const amenFields: (BoolField)[] = [
      { label: "Toilets", value: hasToilet },
      { label: "Wi-Fi", value: hasWifi },
      { label: "Free Wi-Fi", value: hasFreeWifi },
      { label: "Smoking section", value: smokingAllowed },
      { label: "Pets allowed", value: petsAllowed },
    ].filter(f => f.value != null) as BoolField[];
    if (amenFields.length > 0) {
      accordionSections.push({ key: "amenities", icon: <Coffee size={18} strokeWidth={1.5} color="#121214" />, title: "Amenities", fields: amenFields });
    }

    if (seating && seating.length > 0) {
      const seatingFields: BoolField[] = seating.map(s => ({
        label: s.replace(/ seating$/i, ""),
        value: true,
      }));
      if (seatingFields.length > 0) {
        accordionSections.push({ key: "seating", icon: <ClipboardList size={18} strokeWidth={1.5} color="#121214" />, title: "Seating", fields: seatingFields });
      }
    }

    // Service Options: show as booleans for dine-in/takeaway/delivery, always show all
    const serviceArr = serviceType || [];
    const svcFields: BoolField[] = [
      { label: "Dine-in", value: serviceArr.some(s => /sit\s*down|dine/i.test(s)) ? true : serviceArr.length > 0 ? false : null },
      { label: "Takeaway", value: serviceArr.some(s => /take\s*away|takeaway/i.test(s)) ? true : serviceArr.length > 0 ? false : null },
      { label: "Delivery", value: serviceArr.some(s => /deliver/i.test(s)) ? true : serviceArr.length > 0 ? false : null },
    ];
    // Also add meals as a text field if available
    const mealTextField: TextField[] = [];
    if (meal && meal.length > 0) mealTextField.push({ label: "Meals served", value: meal.join(", ") });
    const allSvcFields = [...svcFields.filter(f => f.value !== null), ...mealTextField];
    if (allSvcFields.length > 0) {
      accordionSections.push({ key: "service", icon: <ClipboardList size={18} strokeWidth={1.5} color="#121214" />, title: "Service Options", fields: allSvcFields });
    }
  }

  const hasContactInfo = listing.location || listing.phone || listing.email || listing.website || (listing as any).whatsapp;
  const descriptionText = longDescription || listing.description;

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
          <button onClick={() => navigate(-1)} style={{ ...circleBtn, position: "absolute", top: 16, left: 20, zIndex: 10 }}>
            <ArrowLeft size={18} strokeWidth={2} color="#121214" />
          </button>
          {/* Save & Share buttons */}
          <div style={{ position: "absolute", top: 16, right: 20, zIndex: 10, display: "flex", gap: 10 }}>
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
        <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
          <button
            onClick={handleShare}
            className="flex items-center justify-center transition-colors"
            style={{
              flex: 1, gap: 6, height: 40, borderRadius: 10,
              background: "rgba(18,18,20,0.04)", border: "1px solid rgba(18,18,20,0.08)",
              color: "#121214", fontSize: 12, fontWeight: 600, letterSpacing: "0.1px",
              cursor: "pointer",
            }}
          >
            <Share2 style={{ width: 14, height: 14, color: "rgba(18,18,20,0.5)" }} strokeWidth={1.9} />
            Share
          </button>
          <button
            onClick={() => { if (!requireAuth()) toggleFavourite.mutate(); }}
            className="flex items-center justify-center transition-colors"
            style={{
              flex: 1, gap: 6, height: 40, borderRadius: 10,
              background: isFavourited ? "#121214" : "rgba(18,18,20,0.04)",
              border: isFavourited ? "1px solid #121214" : "1px solid rgba(18,18,20,0.08)",
              color: isFavourited ? "#FFFFFF" : "#121214",
              fontSize: 12, fontWeight: 600, letterSpacing: "0.1px",
              cursor: "pointer",
            }}
          >
            <Heart
              style={{ width: 14, height: 14, color: isFavourited ? "#FFFFFF" : "rgba(18,18,20,0.5)", fill: isFavourited ? "#FFFFFF" : "transparent" }}
              strokeWidth={1.9}
            />
            {isFavourited ? "Saved" : "Save"}
          </button>
          <button
            onClick={() => { if (!requireAuth()) toggleVisited.mutate(); }}
            className="flex items-center justify-center transition-colors"
            style={{
              flex: 1, gap: 6, height: 40, borderRadius: 10,
              background: isVisited ? "#121214" : "rgba(18,18,20,0.04)",
              border: isVisited ? "1px solid #121214" : "1px solid rgba(18,18,20,0.08)",
              color: isVisited ? "#FFFFFF" : "#121214",
              fontSize: 12, fontWeight: 600, letterSpacing: "0.1px",
              cursor: "pointer",
            }}
          >
            <CheckCircle
              style={{ width: 14, height: 14, color: isVisited ? "#FFFFFF" : "rgba(18,18,20,0.5)", fill: isVisited ? "#FFFFFF" : "transparent" }}
              strokeWidth={1.9}
            />
            Visited
          </button>
        </div>

        {/* Call Now & Directions buttons */}
        {(listing.phone || (listing as any).google_maps_link) && (
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            {listing.phone && (
              <a
                href={`tel:${listing.phone}`}
                className="flex items-center justify-center"
                style={{
                  flex: 1, gap: 8, height: 44, borderRadius: 12,
                  background: "#7B8B6F", color: "#FFFFFF",
                  fontSize: 13, fontWeight: 600, textDecoration: "none",
                  cursor: "pointer",
                }}
              >
                <Phone style={{ width: 16, height: 16 }} strokeWidth={1.8} />
                Call Now
              </a>
            )}
            {(listing as any).google_maps_link && (
              <a
                href={(listing as any).google_maps_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center"
                style={{
                  flex: 1, gap: 8, height: 44, borderRadius: 12,
                  background: "#B8916A", color: "#FFFFFF",
                  fontSize: 13, fontWeight: 600, textDecoration: "none",
                  cursor: "pointer",
                }}
              >
                <Navigation style={{ width: 16, height: 16 }} strokeWidth={1.8} />
                Directions
              </a>
            )}
          </div>
        )}

        {/* Quick-scan pills */}
        {showQuickPills && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            {quickPills.slice(0, 4).map((pill, i) => (
              <span key={i} style={{ background: "rgba(18,18,20,0.05)", borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: "rgba(18,18,20,0.55)" }}>
                {pill.label}
              </span>
            ))}
          </div>
        )}

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
                  padding: "10px 16px",
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
        {descriptionText && (() => {
          const paragraphs = (longDescription || listing.description || "").split("\n").filter(Boolean);
          return (
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontWeight: 900, fontSize: 18, color: "#121214", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 14 }}>About</h2>
              <div style={{
                ...(!aboutExpanded ? { display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const, overflow: "hidden" } : {})
              }}>
                {paragraphs.map((paragraph: string, i: number) => (
                  <p key={i} style={{ fontSize: 14, color: "rgba(18,18,20,0.6)", lineHeight: 1.7, marginBottom: 12 }}>{paragraph}</p>
                ))}
              </div>
              {paragraphs.join(" ").length > 150 && (
                <button
                  onClick={() => setAboutExpanded(!aboutExpanded)}
                  style={{ fontSize: 13, fontWeight: 600, color: "#121214", background: "none", border: "none", padding: 0, cursor: "pointer", marginTop: 4 }}
                >
                  {aboutExpanded ? "Show less" : "Read more"}
                </button>
              )}
            </div>
          );
        })()}

        {/* Accordion sections */}
        {accordionSections.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
            {accordionSections.map((section) => {
              const isOpen = openAccordion === section.key;
              return (
                <div
                  key={section.key}
                  style={{
                    background: "#ffffff",
                    border: "1px solid rgba(18,18,20,0.08)",
                    borderRadius: 14,
                    overflow: "hidden",
                    boxShadow: isOpen ? "0 4px 16px rgba(18,18,20,0.06)" : "0 1px 3px rgba(18,18,20,0.03)",
                    transition: "box-shadow 0.25s ease",
                  }}
                >
                  <button
                    onClick={() => toggleAccordion(section.key)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "14px 16px", background: "none", border: "none", cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: "linear-gradient(135deg, rgba(123,139,111,0.12), rgba(184,145,106,0.12))",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        {section.icon}
                      </div>
                      <div style={{ textAlign: "left" }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#121214", letterSpacing: 0.2 }}>{section.title}</span>
                        {!isOpen && (
                          <div style={{ fontSize: 11, color: "rgba(18,18,20,0.35)", marginTop: 1 }}>
                            {section.fields.filter(f => typeof f.value === "boolean" ? f.value : true).length} item{section.fields.filter(f => typeof f.value === "boolean" ? f.value : true).length !== 1 ? "s" : ""}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: isOpen ? "#121214" : "rgba(18,18,20,0.05)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.25s ease",
                    }}>
                      <ChevronDown
                        size={14} strokeWidth={2.5}
                        color={isOpen ? "#ffffff" : "rgba(18,18,20,0.4)"}
                        style={{ transition: "transform 0.25s ease", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                      />
                    </div>
                  </button>
                  {isOpen && (
                    <div style={{ padding: "0 16px 14px 16px" }}>
                      <div style={{ background: "rgba(18,18,20,0.02)", borderRadius: 10, padding: "4px 0" }}>
                        {section.fields.map((field, fi) => {
                          const isBool = typeof field.value === "boolean";
                          return (
                            <div key={fi} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 14px", borderBottom: fi < section.fields.length - 1 ? "1px solid rgba(18,18,20,0.04)" : "none" }}>
                              <span style={{ fontSize: 13, color: "rgba(18,18,20,0.55)", fontWeight: 500 }}>{field.label}</span>
                              {isBool ? (
                                field.value
                                  ? <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(45,138,78,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={12} color="#2d8a4e" strokeWidth={3} /></div>
                                  : <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(226,75,74,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={12} color="#E24B4A" strokeWidth={3} /></div>
                              ) : (
                                <span style={{ fontSize: 13, fontWeight: 700, color: "#121214" }}>{field.value}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
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

        {/* Accommodation accordion sections */}
        {isListingAccommodation && (() => {
          const l = listing as any;
          type BoolField = { label: string; value: boolean | null };
          type TextField = { label: string; value: string | null };
          type AccomSection = { key: string; icon: React.ReactNode; title: string; fields: (BoolField | TextField)[] };
          const accomSections: AccomSection[] = [];

          // Food & Drink
          const foodFields: BoolField[] = [
            { label: "Restaurant", value: l.has_restaurant },
            { label: "Bar", value: l.has_bar },
            { label: "Room Service", value: l.has_room_service },
            { label: "Breakfast", value: l.has_breakfast },
          ].filter(f => f.value != null) as BoolField[];
          if (l.has_breakfast && l.breakfast_included != null) {
            foodFields.push({ label: l.breakfast_included ? "Breakfast Included" : "Breakfast Paid", value: true });
          }
          if (foodFields.length > 0) accomSections.push({ key: "accom-food", icon: <Coffee size={18} strokeWidth={1.5} color="#121214" />, title: "Food & Drink", fields: foodFields });

          // Children
          const childFields: BoolField[] = [
            { label: "Child Friendly", value: l.child_friendly },
          ].filter(f => f.value != null) as BoolField[];
          if (childFields.length > 0) accomSections.push({ key: "accom-children", icon: <Users size={18} strokeWidth={1.5} color="#121214" />, title: "Children", fields: childFields });

          // Transport
          const transportFields: BoolField[] = [
            { label: "Airport Shuttle", value: l.has_airport_shuttle },
            { label: "Free Parking", value: l.has_free_parking },
            { label: "Secure Parking", value: l.has_secure_parking },
          ].filter(f => f.value != null) as BoolField[];
          if (transportFields.length > 0) accomSections.push({ key: "accom-transport", icon: <Navigation size={18} strokeWidth={1.5} color="#121214" />, title: "Transport", fields: transportFields });

          // Wellness
          const wellnessFields: BoolField[] = [
            { label: "Spa", value: l.has_spa },
            { label: "Fitness Centre", value: l.has_fitness_centre },
            { label: "Swimming Pool", value: l.has_swimming_pool },
          ].filter(f => f.value != null) as BoolField[];
          if (wellnessFields.length > 0) accomSections.push({ key: "accom-wellness", icon: <Heart size={18} strokeWidth={1.5} color="#121214" />, title: "Wellness", fields: wellnessFields });

          // Rooms
          const roomFields: BoolField[] = [
            { label: "Aircon", value: l.has_aircon },
            { label: "Laundry Service", value: l.has_laundry },
          ].filter(f => f.value != null) as BoolField[];
          if (roomFields.length > 0) accomSections.push({ key: "accom-rooms", icon: <ClipboardList size={18} strokeWidth={1.5} color="#121214" />, title: "Rooms", fields: roomFields });

          // Internet
          const internetFields: BoolField[] = [
            { label: "Wi-Fi", value: l.has_wifi_accom },
          ].filter(f => f.value != null) as BoolField[];
          if (internetFields.length > 0) accomSections.push({ key: "accom-internet", icon: <Wifi size={18} strokeWidth={1.5} color="#121214" />, title: "Internet", fields: internetFields });

          // Pets
          const petFields: BoolField[] = [
            { label: "Pet Friendly", value: l.pets_allowed },
          ].filter(f => f.value != null) as BoolField[];
          if (petFields.length > 0) accomSections.push({ key: "accom-pets", icon: <Heart size={18} strokeWidth={1.5} color="#121214" />, title: "Pets", fields: petFields });

          // General info pills
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
                    <span key={item} style={{ background: "rgba(18,18,20,0.05)", borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: "rgba(18,18,20,0.55)" }}>
                      {item}
                    </span>
                  ))}
                </div>
              )}
              {accomSections.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  {accomSections.map((section, i) => {
                    const isOpen = openAccordion === section.key;
                    return (
                      <div
                        key={section.key}
                        style={{
                          background: "rgba(18,18,20,0.03)",
                          borderLeft: "1px solid rgba(18,18,20,0.06)",
                          borderRight: "1px solid rgba(18,18,20,0.06)",
                          borderTop: "1px solid rgba(18,18,20,0.06)",
                          borderBottom: i === accomSections.length - 1 ? "1px solid rgba(18,18,20,0.06)" : "none",
                          borderRadius: i === 0 ? "16px 16px 0 0" : i === accomSections.length - 1 ? "0 0 16px 16px" : 0,
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
                          <div style={{ borderTop: "1px solid rgba(18,18,20,0.06)", marginTop: 12, padding: "12px 16px 16px 16px" }}>
                            {section.fields.map((field, fi) => {
                              const isBool = typeof field.value === "boolean";
                              return (
                                <div key={fi} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: fi < section.fields.length - 1 ? "1px solid rgba(18,18,20,0.04)" : "none" }}>
                                  <span style={{ fontSize: 14, color: "rgba(18,18,20,0.5)" }}>{field.label}</span>
                                  {isBool ? (
                                    field.value ? <Check size={14} color="#2d8a4e" /> : <X size={14} color="#E24B4A" />
                                  ) : (
                                    <span style={{ fontSize: 14, fontWeight: 600, color: "#121214" }}>{field.value}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          );
        })()}

        {/* Hours section */}
        <div ref={whatToKnowRef} />
        {hasHours && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Clock size={18} strokeWidth={1.5} color="#121214" />
              <h2 style={{ fontWeight: 900, fontSize: 18, color: "#121214", textTransform: "uppercase", letterSpacing: 0.5 }}>Hours</h2>
            </div>
            <div style={{ background: "rgba(18,18,20,0.03)", border: "1px solid rgba(18,18,20,0.06)", borderRadius: 16, overflow: "hidden" }}>
              {DAY_LABELS.map((day, i) => {
                const key = day === "Public Holidays" ? "public_holidays" : day.toLowerCase();
                const rawValue = openingHours[key] || "";
                const isPublicHoliday = day === "Public Holidays";
                const value = isPublicHoliday && !rawValue ? "Hours might differ" : rawValue;
                const isClosed = !value || value.toLowerCase() === "closed";
                return (
                  <div
                    key={day}
                    style={{
                      display: "flex", justifyContent: "space-between", padding: "9px 16px",
                      borderBottom: i < DAY_LABELS.length - 1 ? "1px solid rgba(18,18,20,0.06)" : "none",
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#121214" }}>{day}</span>
                    <span style={{ fontSize: 13, color: isClosed ? "rgba(18,18,20,0.3)" : "rgba(18,18,20,0.5)", fontStyle: isPublicHoliday && !rawValue ? "italic" : "normal" }}>{value || "Closed"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Suggest an Edit */}
        <div style={{ marginTop: 8, marginBottom: 100 }}>
          <a
            href={`mailto:info@hellohoedspruit.com?subject=${encodeURIComponent(`${listing?.title || "Listing"} – Edit Suggestion`)}`}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              width: "100%", padding: "14px 0", borderRadius: 12,
              background: "rgba(18,18,20,0.05)", border: "1px solid rgba(18,18,20,0.08)",
              fontSize: 14, fontWeight: 600, color: "#121214", letterSpacing: "0.2px",
              textDecoration: "none", cursor: "pointer",
            }}
          >
            <Pencil size={15} strokeWidth={2} color="#121214" />
            Suggest an Edit
          </a>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default ListingDetail;
