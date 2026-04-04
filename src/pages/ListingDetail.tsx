import { useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ListingActions from "@/components/listing/ListingActions";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  Clock,
  Baby,
  PawPrint,
  Accessibility,
  DollarSign,
  UtensilsCrossed,
  Palette,
  ChefHat,
  Armchair,
  Cigarette,
  ShoppingBag,
  Check,
  Wifi,
  MessageCircle,
  Pencil,
  ChevronLeft,
} from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { useAuth } from "@/hooks/useAuth";
import { isRestaurantCategory, isShoppingCategory, isAccommodationCategory } from "@/lib/categoryFields";

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const COLORS = {
  bg: "#F7F2EA",
  surface: "#FFFDF8",
  text: "#121214",
  primary: "#7C5C3B",
  accent: "#D98F39",
  green: "#6E8B63",
  border: "rgba(18,18,20,0.08)",
  borderSoft: "rgba(18,18,20,0.06)",
  muted: "rgba(18,18,20,0.46)",
  mutedSoft: "rgba(18,18,20,0.32)",
};

const cardShadow = "0 8px 30px rgba(18,18,20,0.04)";

const ListingDetail = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const whatToKnowRef = useRef<HTMLDivElement>(null);

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

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24" style={{ background: COLORS.bg }}>
        <div style={{ paddingTop: 52, paddingLeft: 24, paddingRight: 24 }}>
          <button onClick={() => navigate(-1)} className="flex items-center" style={{ gap: 6 }}>
            <ChevronLeft
              style={{
                width: 18,
                height: 18,
                color: COLORS.muted,
                strokeWidth: 2.2,
              }}
            />
            <span
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: COLORS.muted,
                letterSpacing: "0.2px",
              }}
            >
              Back
            </span>
          </button>
        </div>

        <div className="flex flex-col items-center justify-center" style={{ paddingTop: 120, gap: 14 }}>
          <div
            className="animate-pulse"
            style={{
              width: 54,
              height: 54,
              borderRadius: 999,
              background: "rgba(18,18,20,0.06)",
            }}
          />
          <p style={{ fontSize: 14, color: COLORS.muted }}>Loading listing…</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen pb-24" style={{ background: COLORS.bg }}>
        <div style={{ paddingTop: 52, paddingLeft: 24, paddingRight: 24 }}>
          <button onClick={() => navigate(-1)} className="flex items-center" style={{ gap: 6 }}>
            <ChevronLeft
              style={{
                width: 18,
                height: 18,
                color: COLORS.muted,
                strokeWidth: 2.2,
              }}
            />
            <span
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: COLORS.muted,
                letterSpacing: "0.2px",
              }}
            >
              Back
            </span>
          </button>
        </div>

        <div className="text-center" style={{ paddingTop: 120, paddingInline: 24 }}>
          <p
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 24,
              lineHeight: 1,
              fontWeight: 800,
              color: COLORS.text,
              textTransform: "uppercase",
              letterSpacing: "-0.4px",
              marginBottom: 10,
            }}
          >
            Listing not found
          </p>
          <p
            style={{
              fontSize: 14,
              color: COLORS.muted,
              lineHeight: 1.6,
              marginBottom: 18,
            }}
          >
            This place may have been removed or is no longer available.
          </p>
          <Link
            to="/"
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: COLORS.primary,
            }}
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const isListingRestaurant = listingCategories?.some((cat: any) => isRestaurantCategory(cat.title)) ?? false;
  const isListingShopping = listingCategories?.some((cat: any) => isShoppingCategory(cat.title)) ?? false;
  const isListingAccommodation = listingCategories?.some((cat: any) => isAccommodationCategory(cat.title)) ?? false;

  const galleryImages = (listing as any).gallery_images as string[] | null;
  const longDescription = (listing as any).long_description as string | null;
  const openingHours = (listing as any).opening_hours as Record<string, string> | null;

  const hasGallery = !!galleryImages?.length;
  const hasHours = !!openingHours && Object.values(openingHours).some((v) => !!v);

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

  const accessibilityItems = [
    { label: "Wheelchair Friendly", value: wheelchairFriendly },
    { label: "Wheelchair-accessible Car Park", value: wheelchairCarPark },
    { label: "Wheelchair-accessible Entrance", value: wheelchairEntrance },
    { label: "Wheelchair-accessible Seating", value: wheelchairSeating },
    { label: "Wheelchair-accessible Toilet", value: wheelchairToilet },
  ].filter((item) => item.value === true);

  const amenitiesItems = [
    { label: "Toilet", value: hasToilet },
    { label: "Wi-Fi", value: hasWifi },
    { label: "Free Wi-Fi", value: hasFreeWifi },
  ].filter((item) => item.value === true);

  const hasSitDown = serviceType?.includes("Sit down") || serviceType?.includes("Dine-in") || false;
  const hasTakeaway = serviceType?.includes("Takeaway") || serviceType?.includes("Take away") || false;
  const hasDelivery = serviceType?.includes("Delivery") || false;

  const serviceItems = [
    ...(hasSitDown ? [{ label: "Sit down", available: true }] : []),
    ...(hasTakeaway ? [{ label: "Takeaway", available: true }] : []),
    { label: "Delivery", available: hasDelivery },
  ];

  const seatingItems = [
    ...(seating?.includes("Bar seating") ? [{ label: "Bar seating" }] : []),
    ...(seating?.includes("Indoor seating") ? [{ label: "Indoor seating" }] : []),
    ...(seating?.includes("Outdoor seating") ? [{ label: "Outdoor seating" }] : []),
  ];

  const diningDetails: { label: string; value: string }[] = [];
  if (cuisine?.length) diningDetails.push({ label: "Cuisine", value: cuisine.join(", ") });
  if (vibe?.length) diningDetails.push({ label: "Vibe", value: vibe.join(", ") });
  if (meal?.length) diningDetails.push({ label: "Meal types", value: meal.join(", ") });

  const hasDiningInfo = diningDetails.length > 0;
  const hasServiceInfo = serviceItems.length > 0;
  const hasKidsInfo = kidsItems.length > 0;
  const hasAccessibilityInfo = accessibilityItems.length > 0;
  const hasAmenitiesInfo = amenitiesItems.length > 0;
  const hasSeatingInfo = seatingItems.length > 0;

  const priceLabel = priceLevel ? "$".repeat(priceLevel) : null;
  const priceName =
    priceLevel === 1
      ? "Budget"
      : priceLevel === 2
        ? "Moderate"
        : priceLevel === 3
          ? "Upscale"
          : priceLevel === 4
            ? "Fine Dining"
            : null;

  const topPills: {
    icon: React.ReactNode;
    label: string;
    tone?: "warm" | "green" | "neutral";
  }[] = [];

  if (showAttributes) {
    if (goodForKids) {
      topPills.push({
        icon: <Baby className="h-3.5 w-3.5" />,
        label: "Good for Kids",
        tone: "warm",
      });
    }
    if (petsAllowed) {
      topPills.push({
        icon: <PawPrint className="h-3.5 w-3.5" />,
        label: "Pets Allowed",
        tone: "green",
      });
    }
    if (smokingAllowed) {
      topPills.push({
        icon: <Cigarette className="h-3.5 w-3.5" />,
        label: "Smoking Allowed",
        tone: "neutral",
      });
    }
    if (wheelchairFriendly) {
      topPills.push({
        icon: <Accessibility className="h-3.5 w-3.5" />,
        label: "Wheelchair Friendly",
        tone: "green",
      });
    }
  }

  const hasContactInfo =
    !!listing.location || !!listing.phone || !!listing.email || !!listing.website || !!(listing as any).whatsapp;

  const handleWhatToKnow = () => {
    whatToKnowRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <p
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: COLORS.mutedSoft,
        textTransform: "uppercase",
        letterSpacing: "2px",
        marginBottom: 8,
      }}
    >
      {children}
    </p>
  );

  const SectionHeading = ({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) => (
    <div style={{ marginBottom: 18 }}>
      <h2
        className="flex items-center"
        style={{
          gap: 10,
          fontFamily: "var(--font-heading)",
          fontWeight: 800,
          fontSize: 22,
          lineHeight: 1,
          letterSpacing: "-0.3px",
          color: COLORS.text,
          textTransform: "uppercase",
          margin: 0,
        }}
      >
        {icon && <span style={{ color: "rgba(124,92,59,0.45)" }}>{icon}</span>}
        {children}
      </h2>
    </div>
  );

  const Pill = ({
    children,
    tone = "neutral",
    muted = false,
  }: {
    children: React.ReactNode;
    tone?: "neutral" | "warm" | "green";
    muted?: boolean;
  }) => {
    const styles =
      tone === "warm"
        ? {
            background: "rgba(217,143,57,0.10)",
            border: "1px solid rgba(217,143,57,0.16)",
            color: COLORS.primary,
          }
        : tone === "green"
          ? {
              background: "rgba(110,139,99,0.10)",
              border: "1px solid rgba(110,139,99,0.18)",
              color: COLORS.green,
            }
          : {
              background: "rgba(18,18,20,0.04)",
              border: `1px solid ${COLORS.border}`,
              color: COLORS.text,
            };

    return (
      <span
        className="inline-flex items-center"
        style={{
          gap: 6,
          borderRadius: 999,
          padding: "8px 12px",
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: "0.15px",
          lineHeight: 1,
          opacity: muted ? 0.55 : 1,
          textDecoration: muted ? "line-through" : "none",
          ...styles,
        }}
      >
        {children}
      </span>
    );
  };

  const InfoRow = ({ icon, children, href }: { icon: React.ReactNode; children: React.ReactNode; href?: string }) => {
    const content = (
      <div
        className="flex items-center"
        style={{
          gap: 14,
          padding: "18px 20px",
          color: COLORS.primary,
          fontSize: 14,
          lineHeight: 1.45,
        }}
      >
        <span style={{ color: "rgba(124,92,59,0.55)", flexShrink: 0 }}>{icon}</span>
        <span style={{ minWidth: 0, wordBreak: "break-word" }}>{children}</span>
      </div>
    );

    if (href) {
      return (
        <a
          href={href}
          target={href.startsWith("tel:") || href.startsWith("mailto:") ? undefined : "_blank"}
          rel={href.startsWith("tel:") || href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
          className="block transition-opacity active:scale-[0.99]"
          style={{ textDecoration: "none" }}
        >
          {content}
        </a>
      );
    }

    return content;
  };

  const accordionTriggerClass = "px-5 py-4 hover:no-underline [&[data-state=open]>svg]:rotate-180";

  return (
    <div className="min-h-screen pb-24" style={{ background: COLORS.bg }}>
      {listing.image_url ? (
        <div className="relative">
          <div
            className="relative overflow-hidden"
            style={{ height: 312, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
          >
            <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" />
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(to top, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.10) 42%, rgba(0,0,0,0.05) 100%)",
              }}
            />
          </div>

          <button
            onClick={() => navigate(-1)}
            className="absolute left-5 active:scale-[0.97] transition-transform"
            style={{
              top: 48,
              width: 40,
              height: 40,
              borderRadius: 999,
              background: "rgba(255,253,248,0.92)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(18,18,20,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            }}
          >
            <ChevronLeft style={{ width: 18, height: 18, color: COLORS.text, strokeWidth: 2.2 }} />
          </button>

          {isAdmin && (
            <button
              onClick={() => navigate(`/admin/listings?edit=${listing.id}`)}
              className="absolute right-5 active:scale-[0.97] transition-transform"
              style={{
                top: 48,
                width: 40,
                height: 40,
                borderRadius: 999,
                background: "rgba(255,253,248,0.92)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(18,18,20,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
              }}
              title="Edit listing"
            >
              <Pencil style={{ width: 16, height: 16, color: COLORS.text }} />
            </button>
          )}
        </div>
      ) : (
        <div style={{ paddingTop: 52, paddingLeft: 24, paddingRight: 24 }}>
          <div className="flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="flex items-center" style={{ gap: 6 }}>
              <ChevronLeft
                style={{
                  width: 18,
                  height: 18,
                  color: COLORS.muted,
                  strokeWidth: 2.2,
                }}
              />
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: COLORS.muted,
                  letterSpacing: "0.2px",
                }}
              >
                Back
              </span>
            </button>

            {isAdmin && (
              <button
                onClick={() => navigate(`/admin/listings?edit=${listing.id}`)}
                className="active:scale-[0.97] transition-transform"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 999,
                  border: `1px solid ${COLORS.border}`,
                  background: COLORS.surface,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title="Edit listing"
              >
                <Pencil style={{ width: 16, height: 16, color: COLORS.primary }} />
              </button>
            )}
          </div>
        </div>
      )}

      <div style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 22, paddingBottom: 40 }}>
        <div style={{ marginBottom: 24 }}>
          {listing.is_featured && (
            <p
              className="flex items-center"
              style={{
                gap: 6,
                fontSize: 11,
                fontWeight: 700,
                color: COLORS.accent,
                textTransform: "uppercase",
                letterSpacing: "1.8px",
                marginBottom: 10,
              }}
            >
              <Star style={{ width: 12, height: 12, fill: "currentColor" }} />
              Featured
            </p>
          )}

          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 900,
              fontSize: 36,
              lineHeight: 0.98,
              letterSpacing: "-0.6px",
              color: COLORS.text,
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            {listing.title}
          </h1>

          {listingCategories && listingCategories.length > 0 && (
            <div className="flex flex-wrap" style={{ gap: 8, marginTop: 16 }}>
              {listingCategories.map((cat: any) => (
                <Link
                  key={cat.id}
                  to={`/category/${cat.id}`}
                  className="transition-transform active:scale-[0.98]"
                  style={{
                    borderRadius: 999,
                    background: "rgba(18,18,20,0.04)",
                    border: `1px solid ${COLORS.border}`,
                    padding: "8px 12px",
                    fontSize: 12,
                    fontWeight: 500,
                    color: COLORS.muted,
                    textDecoration: "none",
                  }}
                >
                  {cat.title}
                </Link>
              ))}
            </div>
          )}

          {((listing as any).google_rating != null || showAttributes || topPills.length > 0) && (
            <div style={{ marginTop: 16 }}>
              {(listing as any).google_rating != null && (
                <div className="flex items-center flex-wrap" style={{ gap: 8, marginBottom: 12 }}>
                  <div className="flex items-center" style={{ gap: 2 }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        style={{
                          width: 14,
                          height: 14,
                          color: star <= Math.round((listing as any).google_rating) ? "#D98F39" : "rgba(18,18,20,0.14)",
                          fill: star <= Math.round((listing as any).google_rating) ? "#D98F39" : "none",
                        }}
                      />
                    ))}
                  </div>

                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: COLORS.text,
                    }}
                  >
                    {(listing as any).google_rating}
                  </span>

                  {(listing as any).google_reviews_count != null && (
                    <>
                      {(listing as any).google_reviews_url ? (
                        <a
                          href={(listing as any).google_reviews_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: 13,
                            color: COLORS.muted,
                            textDecoration: "underline",
                          }}
                        >
                          ({(listing as any).google_reviews_count} reviews)
                        </a>
                      ) : (
                        <span style={{ fontSize: 13, color: COLORS.muted }}>
                          ({(listing as any).google_reviews_count} reviews)
                        </span>
                      )}
                    </>
                  )}
                </div>
              )}

              {showAttributes && priceLabel && (
                <p
                  className="flex items-center"
                  style={{
                    gap: 6,
                    fontSize: 13,
                    color: COLORS.muted,
                    marginBottom: topPills.length > 0 ? 12 : 0,
                  }}
                >
                  <DollarSign
                    style={{
                      width: 14,
                      height: 14,
                      color: "rgba(124,92,59,0.55)",
                    }}
                  />
                  <span style={{ color: COLORS.text, fontWeight: 600 }}>{priceLabel}</span>
                  {priceName && <span>· {priceName}</span>}
                </p>
              )}

              {topPills.length > 0 && (
                <div className="flex flex-wrap" style={{ gap: 8 }}>
                  {topPills.slice(0, 4).map((pill) => (
                    <Pill key={pill.label} tone={pill.tone ?? "neutral"}>
                      {pill.icon}
                      {pill.label}
                    </Pill>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ marginBottom: 28 }}>
          <ListingActions listingId={listing.id} onWhatToKnow={handleWhatToKnow} />
        </div>

        {hasContactInfo && (
          <div
            style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 24,
              overflow: "hidden",
              boxShadow: cardShadow,
              marginBottom: 34,
            }}
          >
            <div style={{ borderTop: "none" }}>
              {listing.location && (
                <div style={{ borderBottom: `1px solid ${COLORS.borderSoft}` }}>
                  <InfoRow
                    icon={<MapPin style={{ width: 22, height: 22 }} />}
                    href={(listing as any).google_maps_link || undefined}
                  >
                    {listing.location}
                  </InfoRow>
                </div>
              )}

              {listing.phone && (
                <div style={{ borderBottom: `1px solid ${COLORS.borderSoft}` }}>
                  <InfoRow icon={<Phone style={{ width: 22, height: 22 }} />} href={`tel:${listing.phone}`}>
                    {listing.phone}
                  </InfoRow>
                </div>
              )}

              {listing.email && (
                <div style={{ borderBottom: `1px solid ${COLORS.borderSoft}` }}>
                  <InfoRow icon={<Mail style={{ width: 22, height: 22 }} />} href={`mailto:${listing.email}`}>
                    {listing.email}
                  </InfoRow>
                </div>
              )}

              {listing.website && (
                <div style={{ borderBottom: (listing as any).whatsapp ? `1px solid ${COLORS.borderSoft}` : "none" }}>
                  <InfoRow icon={<Globe style={{ width: 22, height: 22 }} />} href={listing.website}>
                    Website
                  </InfoRow>
                </div>
              )}

              {(listing as any).whatsapp && (
                <InfoRow
                  icon={<MessageCircle style={{ width: 22, height: 22 }} />}
                  href={`https://wa.me/${(listing as any).whatsapp.replace(/[^0-9]/g, "")}`}
                >
                  WhatsApp
                </InfoRow>
              )}
            </div>
          </div>
        )}

        {showAttributes && (
          <section style={{ marginBottom: 34 }}>
            <SectionLabel>Snapshot</SectionLabel>
            <SectionHeading>Details</SectionHeading>

            <div className="flex flex-wrap" style={{ gap: 8 }}>
              {priceLabel && (
                <Pill tone="warm">
                  <DollarSign className="h-3.5 w-3.5" />
                  {priceLabel}
                  {priceName && <span style={{ color: COLORS.muted }}>· {priceName}</span>}
                </Pill>
              )}

              {meal?.length ? (
                <Pill>
                  <UtensilsCrossed className="h-3.5 w-3.5" />
                  {meal.join(", ")}
                </Pill>
              ) : null}

              {vibe?.length ? (
                <Pill>
                  <Palette className="h-3.5 w-3.5" />
                  {vibe.join(", ")}
                </Pill>
              ) : null}

              {cuisine?.length ? (
                <Pill>
                  <ChefHat className="h-3.5 w-3.5" />
                  {cuisine.join(", ")}
                </Pill>
              ) : null}

              {seating?.length ? (
                <Pill>
                  <Armchair className="h-3.5 w-3.5" />
                  {seating.join(", ")}
                </Pill>
              ) : null}

              {serviceType?.length ? (
                <Pill>
                  <ShoppingBag className="h-3.5 w-3.5" />
                  {serviceType.join(", ")}
                </Pill>
              ) : null}
            </div>
          </section>
        )}

        {isListingShopping &&
          (() => {
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

            const boolItems = [
              { label: "Air Conditioned", value: airCon },
              { label: "Delivery Available", value: deliveryAvail },
              { label: "Click & Collect", value: clickCollect },
              { label: "Order Online", value: orderOnline },
              { label: "Parking Available", value: parkingAvail },
              { label: "Wheelchair Friendly", value: shopWheelchair },
              { label: "Local Products", value: localProds },
              { label: "Curio / Gifts", value: curioGifts },
            ].filter((item) => item.value === true);

            const hasAnyShopInfo =
              boolItems.length > 0 || !!paymentMethods?.length || !!shopType || !!prodCats?.length || !!priceRng;

            if (!hasAnyShopInfo) return null;

            return (
              <section style={{ marginBottom: 34 }}>
                <SectionLabel>Snapshot</SectionLabel>
                <SectionHeading>Details</SectionHeading>

                <div className="flex flex-wrap" style={{ gap: 8 }}>
                  {shopType ? (
                    <Pill>
                      <ShoppingBag className="h-3.5 w-3.5" />
                      {shopType}
                    </Pill>
                  ) : null}

                  {priceRng ? (
                    <Pill tone="warm">
                      <DollarSign className="h-3.5 w-3.5" />
                      {priceRng}
                    </Pill>
                  ) : null}

                  {boolItems.map((item) => (
                    <Pill key={item.label} tone="green">
                      <Check className="h-3.5 w-3.5" />
                      {item.label}
                    </Pill>
                  ))}

                  {paymentMethods?.length ? (
                    <Pill>
                      <span style={{ color: COLORS.muted }}>Payment:</span>
                      {paymentMethods.join(", ")}
                    </Pill>
                  ) : null}

                  {prodCats?.length ? (
                    <Pill>
                      <span style={{ color: COLORS.muted }}>Products:</span>
                      {prodCats.join(", ")}
                    </Pill>
                  ) : null}
                </div>
              </section>
            );
          })()}

        {isListingAccommodation &&
          (() => {
            const accomPetsAllowed = (listing as any).pets_allowed as boolean | null;
            const amenities = (listing as any).amenities as string[] | null;
            const sleeps = (listing as any).sleeps as number | null;
            const priceRng = (listing as any).price_range as string | null;
            const kmFromTown = (listing as any).km_from_town as string | null;

            const hasAnyAccomInfo =
              accomPetsAllowed != null || !!amenities?.length || sleeps != null || !!priceRng || !!kmFromTown;

            if (!hasAnyAccomInfo) return null;

            return (
              <section style={{ marginBottom: 34 }}>
                <SectionLabel>Snapshot</SectionLabel>
                <SectionHeading>Details</SectionHeading>

                <div className="flex flex-wrap" style={{ gap: 8 }}>
                  {accomPetsAllowed != null && (
                    <Pill tone={accomPetsAllowed ? "green" : "neutral"} muted={!accomPetsAllowed}>
                      <PawPrint className="h-3.5 w-3.5" />
                      {accomPetsAllowed ? "Pets Allowed" : "No Pets"}
                    </Pill>
                  )}

                  {sleeps != null && (
                    <Pill>
                      <span style={{ color: COLORS.muted }}>Sleeps:</span>
                      {sleeps}
                    </Pill>
                  )}

                  {priceRng && (
                    <Pill tone="warm">
                      <DollarSign className="h-3.5 w-3.5" />
                      {priceRng}
                    </Pill>
                  )}

                  {kmFromTown && (
                    <Pill>
                      <MapPin className="h-3.5 w-3.5" />
                      {kmFromTown} km from town
                    </Pill>
                  )}

                  {amenities?.length
                    ? amenities.map((a) => (
                        <Pill key={a} tone="green">
                          <Check className="h-3.5 w-3.5" />
                          {a}
                        </Pill>
                      ))
                    : null}
                </div>
              </section>
            );
          })()}

        {listing.description && !longDescription && (
          <section style={{ marginBottom: 34 }}>
            <SectionLabel>Story</SectionLabel>
            <SectionHeading>About</SectionHeading>
            <p
              style={{
                fontSize: 16,
                lineHeight: 1.75,
                color: COLORS.primary,
                margin: 0,
              }}
            >
              {listing.description}
            </p>
          </section>
        )}

        {longDescription && (
          <section style={{ marginBottom: 34 }}>
            <SectionLabel>Story</SectionLabel>
            <SectionHeading>About</SectionHeading>

            <div style={{ display: "grid", gap: 14 }}>
              {longDescription
                .split("\n")
                .filter((paragraph) => paragraph.trim())
                .map((paragraph, i) => (
                  <p
                    key={i}
                    style={{
                      fontSize: 16,
                      lineHeight: 1.78,
                      color: COLORS.primary,
                      margin: 0,
                    }}
                  >
                    {paragraph}
                  </p>
                ))}
            </div>
          </section>
        )}

        {hasGallery && (
          <section style={{ marginBottom: 34 }}>
            <SectionLabel>Moments</SectionLabel>
            <SectionHeading>Gallery</SectionHeading>

            <div className="grid grid-cols-2" style={{ gap: 10 }}>
              {galleryImages!.map((url, i) => (
                <div
                  key={i}
                  style={{
                    aspectRatio: "3 / 4",
                    borderRadius: 18,
                    overflow: "hidden",
                    background: "rgba(18,18,20,0.06)",
                  }}
                >
                  <img src={url} alt={`${listing.title} gallery ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </section>
        )}

        <div ref={whatToKnowRef} className="scroll-mt-4" />

        {hasHours && (
          <section style={{ marginBottom: 34 }}>
            <SectionLabel>Plan your visit</SectionLabel>
            <SectionHeading icon={<Clock className="h-5 w-5" />}>Hours</SectionHeading>

            <div
              style={{
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 24,
                overflow: "hidden",
                boxShadow: cardShadow,
              }}
            >
              {DAY_LABELS.map((day, index) => {
                const value = openingHours?.[day.toLowerCase()] || "";
                const isLast = index === DAY_LABELS.length - 1;

                return (
                  <div
                    key={day}
                    className="flex items-center justify-between"
                    style={{
                      padding: "18px 20px",
                      borderBottom: isLast ? "none" : `1px solid ${COLORS.borderSoft}`,
                      gap: 16,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: COLORS.text,
                      }}
                    >
                      {day}
                    </span>

                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 400,
                        color: value ? COLORS.muted : COLORS.primary,
                      }}
                    >
                      {value || "Closed"}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {isListingRestaurant &&
          (hasDiningInfo ||
            hasServiceInfo ||
            hasKidsInfo ||
            hasAccessibilityInfo ||
            hasAmenitiesInfo ||
            hasSeatingInfo) && (
            <section style={{ marginBottom: 12 }}>
              <div
                style={{
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 24,
                  overflow: "hidden",
                  boxShadow: cardShadow,
                }}
              >
                <Accordion type="single" collapsible>
                  {hasDiningInfo && (
                    <AccordionItem value="dining" style={{ borderBottom: `1px solid ${COLORS.borderSoft}` }}>
                      <AccordionTrigger className={accordionTriggerClass}>
                        <span
                          className="flex items-center"
                          style={{
                            gap: 10,
                            fontSize: 15,
                            fontWeight: 600,
                            color: COLORS.text,
                          }}
                        >
                          <UtensilsCrossed
                            style={{
                              width: 18,
                              height: 18,
                              color: "rgba(124,92,59,0.55)",
                            }}
                          />
                          Dining Details
                        </span>
                      </AccordionTrigger>
                      <AccordionContent style={{ padding: "0 20px 18px 20px" }}>
                        <div style={{ display: "grid", gap: 12 }}>
                          {diningDetails.map((item) => (
                            <div key={item.label}>
                              <p
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: COLORS.mutedSoft,
                                  textTransform: "uppercase",
                                  letterSpacing: "1.5px",
                                  marginBottom: 4,
                                }}
                              >
                                {item.label}
                              </p>
                              <p
                                style={{
                                  fontSize: 14,
                                  lineHeight: 1.6,
                                  color: COLORS.primary,
                                  margin: 0,
                                }}
                              >
                                {item.value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {hasServiceInfo && (
                    <AccordionItem value="service" style={{ borderBottom: `1px solid ${COLORS.borderSoft}` }}>
                      <AccordionTrigger className={accordionTriggerClass}>
                        <span
                          className="flex items-center"
                          style={{
                            gap: 10,
                            fontSize: 15,
                            fontWeight: 600,
                            color: COLORS.text,
                          }}
                        >
                          <ShoppingBag
                            style={{
                              width: 18,
                              height: 18,
                              color: "rgba(124,92,59,0.55)",
                            }}
                          />
                          Service Options
                        </span>
                      </AccordionTrigger>
                      <AccordionContent style={{ padding: "0 20px 18px 20px" }}>
                        <div style={{ display: "grid", gap: 10 }}>
                          {serviceItems.map((item) => (
                            <div
                              key={item.label}
                              className="flex items-center"
                              style={{
                                gap: 10,
                                fontSize: 14,
                                color: item.available ? COLORS.text : COLORS.muted,
                                opacity: item.available ? 1 : 0.6,
                              }}
                            >
                              <Check
                                style={{
                                  width: 16,
                                  height: 16,
                                  color: item.available ? COLORS.green : COLORS.mutedSoft,
                                  flexShrink: 0,
                                }}
                              />
                              <span
                                style={{
                                  textDecoration: item.available ? "none" : "line-through",
                                }}
                              >
                                {item.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {hasSeatingInfo && (
                    <AccordionItem value="seating" style={{ borderBottom: `1px solid ${COLORS.borderSoft}` }}>
                      <AccordionTrigger className={accordionTriggerClass}>
                        <span
                          className="flex items-center"
                          style={{
                            gap: 10,
                            fontSize: 15,
                            fontWeight: 600,
                            color: COLORS.text,
                          }}
                        >
                          <Armchair
                            style={{
                              width: 18,
                              height: 18,
                              color: "rgba(124,92,59,0.55)",
                            }}
                          />
                          Seating
                        </span>
                      </AccordionTrigger>
                      <AccordionContent style={{ padding: "0 20px 18px 20px" }}>
                        <div style={{ display: "grid", gap: 10 }}>
                          {seatingItems.map((item) => (
                            <div
                              key={item.label}
                              className="flex items-center"
                              style={{ gap: 10, fontSize: 14, color: COLORS.text }}
                            >
                              <Check
                                style={{
                                  width: 16,
                                  height: 16,
                                  color: COLORS.green,
                                  flexShrink: 0,
                                }}
                              />
                              <span>{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {hasAmenitiesInfo && (
                    <AccordionItem value="amenities" style={{ borderBottom: `1px solid ${COLORS.borderSoft}` }}>
                      <AccordionTrigger className={accordionTriggerClass}>
                        <span
                          className="flex items-center"
                          style={{
                            gap: 10,
                            fontSize: 15,
                            fontWeight: 600,
                            color: COLORS.text,
                          }}
                        >
                          <Wifi
                            style={{
                              width: 18,
                              height: 18,
                              color: "rgba(124,92,59,0.55)",
                            }}
                          />
                          Amenities
                        </span>
                      </AccordionTrigger>
                      <AccordionContent style={{ padding: "0 20px 18px 20px" }}>
                        <div style={{ display: "grid", gap: 10 }}>
                          {amenitiesItems.map((item) => (
                            <div
                              key={item.label}
                              className="flex items-center"
                              style={{ gap: 10, fontSize: 14, color: COLORS.text }}
                            >
                              <Check
                                style={{
                                  width: 16,
                                  height: 16,
                                  color: COLORS.green,
                                  flexShrink: 0,
                                }}
                              />
                              <span>{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {hasKidsInfo && (
                    <AccordionItem value="kids" style={{ borderBottom: `1px solid ${COLORS.borderSoft}` }}>
                      <AccordionTrigger className={accordionTriggerClass}>
                        <span
                          className="flex items-center"
                          style={{
                            gap: 10,
                            fontSize: 15,
                            fontWeight: 600,
                            color: COLORS.text,
                          }}
                        >
                          <Baby
                            style={{
                              width: 18,
                              height: 18,
                              color: "rgba(124,92,59,0.55)",
                            }}
                          />
                          Kids & Family
                        </span>
                      </AccordionTrigger>
                      <AccordionContent style={{ padding: "0 20px 18px 20px" }}>
                        <div style={{ display: "grid", gap: 10 }}>
                          {kidsItems.map((item) => (
                            <div
                              key={item.label}
                              className="flex items-center"
                              style={{ gap: 10, fontSize: 14, color: COLORS.text }}
                            >
                              <Check
                                style={{
                                  width: 16,
                                  height: 16,
                                  color: COLORS.green,
                                  flexShrink: 0,
                                }}
                              />
                              <span>{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {hasAccessibilityInfo && (
                    <AccordionItem value="accessibility" style={{ borderBottom: "none" }}>
                      <AccordionTrigger className={accordionTriggerClass}>
                        <span
                          className="flex items-center"
                          style={{
                            gap: 10,
                            fontSize: 15,
                            fontWeight: 600,
                            color: COLORS.text,
                          }}
                        >
                          <Accessibility
                            style={{
                              width: 18,
                              height: 18,
                              color: "rgba(124,92,59,0.55)",
                            }}
                          />
                          Accessibility
                        </span>
                      </AccordionTrigger>
                      <AccordionContent style={{ padding: "0 20px 18px 20px" }}>
                        <div style={{ display: "grid", gap: 10 }}>
                          {accessibilityItems.map((item) => (
                            <div
                              key={item.label}
                              className="flex items-center"
                              style={{ gap: 10, fontSize: 14, color: COLORS.text }}
                            >
                              <Check
                                style={{
                                  width: 16,
                                  height: 16,
                                  color: COLORS.green,
                                  flexShrink: 0,
                                }}
                              />
                              <span>{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>
              </div>
            </section>
          )}
      </div>
    </div>
  );
};

export default ListingDetail;
