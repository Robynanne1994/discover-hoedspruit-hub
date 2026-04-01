import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ListingActions from "@/components/listing/ListingActions";
import { MapPin, Phone, Mail, Globe, Star, Clock, Baby, PawPrint, Accessibility, DollarSign, UtensilsCrossed, Palette, ChefHat, Armchair, Cigarette, ShoppingBag, Check, Wifi, Ban, MessageCircle, Pencil, ChevronLeft } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { useAuth } from "@/hooks/useAuth";
import { isRestaurantCategory, isShoppingCategory, isAccommodationCategory } from "@/lib/categoryFields";

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const ListingDetail = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: listingCategories } = useQuery({
    queryKey: ["listing-detail-categories", id],
    queryFn: async () => {
      const { data: junctions } = await supabase
        .from("listing_categories")
        .select("category_id")
        .eq("listing_id", id!);
      if (!junctions || junctions.length === 0) return [];
      const catIds = junctions.map((j: any) => j.category_id);
      const { data: cats } = await supabase
        .from("categories")
        .select("id, title")
        .in("id", catIds);
      return cats ?? [];
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20 bg-background">
        <div className="px-5 pt-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-[13px] font-medium transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        </div>
        <div className="px-5 pt-12 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
          <p className="text-muted-foreground text-[13px]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen pb-20 bg-background">
        <div className="px-5 pt-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-[13px] font-medium transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        </div>
        <div className="px-5 pt-20 text-center">
          <p className="text-muted-foreground text-[14px] mb-4">Listing not found.</p>
          <Link to="/" className="text-primary hover:underline text-[13px] font-medium">Back to Home</Link>
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

  // Kids & Family accordion items (exclude items shown as top pills)
  const kidsItems = [
    { label: "Kids Playground", value: kidsPlayground },
    { label: "Kids Menu", value: kidsMenu },
    { label: "High Chairs", value: highChairs },
  ].filter((item) => item.value === true);
  const hasKidsInfo = kidsItems.length > 0;

  // Accessibility accordion items
  const accessibilityItems = [
    { label: "Wheelchair Friendly", value: wheelchairFriendly },
    { label: "Wheelchair-accessible Car Park", value: wheelchairCarPark },
    { label: "Wheelchair-accessible Entrance", value: wheelchairEntrance },
    { label: "Wheelchair-accessible Seating", value: wheelchairSeating },
    { label: "Wheelchair-accessible Toilet", value: wheelchairToilet },
  ].filter((item) => item.value === true);
  const hasAccessibilityInfo = accessibilityItems.length > 0;

  // Amenities accordion items
  const amenitiesItems = [
    { label: "Toilet", value: hasToilet },
    { label: "Wi-Fi", value: hasWifi },
    { label: "Free Wi-Fi", value: hasFreeWifi },
  ].filter((item) => item.value === true);
  const hasAmenitiesInfo = amenitiesItems.length > 0;

  // Service options
  const hasSitDown = serviceType?.includes("Sit down") || serviceType?.includes("Dine-in") || false;
  const hasTakeaway = serviceType?.includes("Takeaway") || serviceType?.includes("Take away") || false;
  const hasDelivery = serviceType?.includes("Delivery") || false;
  const serviceItems = [
    ...(hasSitDown ? [{ label: "Sit down", available: true }] : []),
    ...(hasTakeaway ? [{ label: "Takeaway", available: true }] : []),
    { label: "Delivery", available: hasDelivery },
  ];
  const hasServiceInfo = hasSitDown || hasTakeaway || true;

  // Seating
  const seatingItems = [
    ...(seating?.includes("Bar seating") ? [{ label: "Bar seating" }] : []),
    ...(seating?.includes("Indoor seating") ? [{ label: "Indoor seating" }] : []),
    ...(seating?.includes("Outdoor seating") ? [{ label: "Outdoor seating" }] : []),
  ];
  const hasSeatingInfo = seatingItems.length > 0;

  // Dining details accordion
  const diningDetails: { label: string; value: string }[] = [];
  if (cuisine && cuisine.length > 0) diningDetails.push({ label: "Cuisine", value: cuisine.join(", ") });
  if (vibe && vibe.length > 0) diningDetails.push({ label: "Vibe", value: vibe.join(", ") });
  if (meal && meal.length > 0) diningDetails.push({ label: "Meal types", value: meal.join(", ") });
  const hasDiningInfo = diningDetails.length > 0;

  const priceLabel = priceLevel ? "$".repeat(priceLevel) : null;
  const priceName = priceLevel === 1 ? "Budget" : priceLevel === 2 ? "Moderate" : priceLevel === 3 ? "Upscale" : priceLevel === 4 ? "Fine Dining" : null;

  // Top quick-scan pills (max 3-4 most important)
  const topPills: { icon: React.ReactNode; label: string; variant: "positive" | "muted" }[] = [];
  if (showAttributes) {
    if (goodForKids === true) topPills.push({ icon: <Baby className="h-3 w-3" />, label: "Good for Kids", variant: "positive" });
    if (petsAllowed === true) topPills.push({ icon: <PawPrint className="h-3 w-3" />, label: "Pets Allowed", variant: "positive" });
    if (smokingAllowed === true) topPills.push({ icon: <Cigarette className="h-3 w-3" />, label: "Smoking Allowed", variant: "positive" });
    if (wheelchairFriendly === true) topPills.push({ icon: <Accessibility className="h-3 w-3" />, label: "Wheelchair Friendly", variant: "positive" });
  }

  // Pill helper
  const Pill = ({ children, variant = "neutral" }: { children: React.ReactNode; variant?: "neutral" | "positive" | "muted" }) => {
    const base = "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium tracking-wide";
    const styles = {
      neutral: "bg-card border border-border/50 text-foreground",
      positive: "bg-primary/6 text-primary border border-primary/12",
      muted: "bg-muted/40 text-muted-foreground border border-border/30 line-through opacity-50",
    };
    return <span className={`${base} ${styles[variant]}`}>{children}</span>;
  };

  const SectionHeading = ({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) => (
    <h2
      className="text-[18px] font-semibold text-foreground tracking-tight mb-4 flex items-center gap-2.5"
      style={{ fontFamily: "var(--font-heading)" }}
    >
      {icon && <span className="text-primary/50">{icon}</span>}
      {children}
    </h2>
  );

  const hasContactInfo = listing.location || listing.phone || listing.email || listing.website || (listing as any).whatsapp;

  // Grouped accordion trigger style
  const triggerClass = "bg-card px-4 py-3.5 text-[13px] font-medium text-foreground hover:bg-muted/30 transition-colors hover:no-underline";

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Hero image */}
      {listing.image_url ? (
        <div className="relative">
          <div className="relative h-[320px] overflow-hidden">
            <img
              src={listing.image_url}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-black/20" />
          </div>
          <button
            onClick={() => navigate(-1)}
            className="absolute top-5 left-5 z-10 bg-card/90 backdrop-blur-md rounded-full p-2.5 active:scale-95 transition-all shadow-sm"
          >
            <ChevronLeft className="h-4 w-4 text-foreground" />
          </button>
          {isAdmin && (
            <button
              onClick={() => navigate(`/admin/listings?edit=${listing.id}`)}
              className="absolute top-5 right-5 z-10 bg-card/90 backdrop-blur-md rounded-full p-2.5 active:scale-95 transition-all shadow-sm"
              title="Edit listing"
            >
              <Pencil className="h-4 w-4 text-foreground" />
            </button>
          )}
        </div>
      ) : (
        <div className="px-5 pt-6 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-[13px] font-medium transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          {isAdmin && (
            <button
              onClick={() => navigate(`/admin/listings?edit=${listing.id}`)}
              className="p-2.5 rounded-full bg-primary/8 text-primary"
              title="Edit listing"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      <div className="px-5 pt-6 pb-10">
        {/* Title & identity */}
        <div className="mb-5">
          {listing.is_featured && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-accent uppercase tracking-[0.08em] mb-2.5">
              <Star className="h-3 w-3 fill-current" /> Featured
            </span>
          )}
          <h1
            className="text-[26px] font-semibold text-foreground leading-[1.15] tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {listing.title}
          </h1>

          {/* Categories */}
          {listingCategories && listingCategories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {listingCategories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/category/${cat.id}`}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-primary/6 text-primary border border-primary/12 hover:bg-primary/12 transition-colors"
                >
                  {cat.title}
                </Link>
              ))}
            </div>
          )}

          {/* Google rating */}
          {(listing as any).google_rating != null && (
            <div className="flex items-center gap-2 mt-3">
              {(listing as any).google_reviews_url ? (
                <a href={(listing as any).google_reviews_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`h-3.5 w-3.5 ${star <= Math.round((listing as any).google_rating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20"}`} />
                    ))}
                  </div>
                  <span className="text-[13px] font-medium text-foreground">{(listing as any).google_rating}</span>
                  {(listing as any).google_reviews_count != null && (
                    <span className="text-[12px] text-muted-foreground underline">({(listing as any).google_reviews_count} reviews)</span>
                  )}
                </a>
              ) : (
                <>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`h-3.5 w-3.5 ${star <= Math.round((listing as any).google_rating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20"}`} />
                    ))}
                  </div>
                  <span className="text-[13px] font-medium text-foreground">{(listing as any).google_rating}</span>
                  {(listing as any).google_reviews_count != null && (
                    <span className="text-[12px] text-muted-foreground">({(listing as any).google_reviews_count} reviews)</span>
                  )}
                </>
              )}
            </div>
          )}

          {/* Price level inline */}
          {showAttributes && priceLabel && (
            <div className="flex items-center gap-1.5 mt-3 text-[13px] text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5 text-primary/60" />
              <span className="font-semibold text-foreground">{priceLabel}</span>
              {priceName && <span>· {priceName}</span>}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mb-7">
          <ListingActions listingId={listing.id} />
        </div>

        {/* Quick-scan pills (max 3-4) */}
        {topPills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-7">
            {topPills.slice(0, 4).map((pill) => (
              <Pill key={pill.label} variant={pill.variant}>
                {pill.icon} {pill.label}
              </Pill>
            ))}
          </div>
        )}

        {/* Grouped contact details block — no heading */}
        {hasContactInfo && (
          <div className="bg-card rounded-2xl border border-border/50 mb-8 overflow-hidden" style={{ boxShadow: "var(--card-shadow)" }}>
            <div className="divide-y divide-border/30">
              {listing.location && (
                (listing as any).google_maps_link ? (
                  <a href={(listing as any).google_maps_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3.5 px-4 py-3.5 text-[13px] text-muted-foreground hover:text-primary hover:bg-muted/30 transition-colors">
                    <MapPin className="h-[18px] w-[18px] text-primary/50 shrink-0" /> 
                    <span className="leading-snug">{listing.location}</span>
                  </a>
                ) : (
                  <div className="flex items-center gap-3.5 px-4 py-3.5 text-[13px] text-muted-foreground">
                    <MapPin className="h-[18px] w-[18px] text-primary/50 shrink-0" /> 
                    <span className="leading-snug">{listing.location}</span>
                  </div>
                )
              )}
              {listing.phone && (
                <a href={`tel:${listing.phone}`} className="flex items-center gap-3.5 px-4 py-3.5 text-[13px] text-muted-foreground hover:text-primary hover:bg-muted/30 transition-colors">
                  <Phone className="h-[18px] w-[18px] text-primary/50 shrink-0" /> {listing.phone}
                </a>
              )}
              {listing.email && (
                <a href={`mailto:${listing.email}`} className="flex items-center gap-3.5 px-4 py-3.5 text-[13px] text-muted-foreground hover:text-primary hover:bg-muted/30 transition-colors">
                  <Mail className="h-[18px] w-[18px] text-primary/50 shrink-0" /> {listing.email}
                </a>
              )}
              {listing.website && (
                <a href={listing.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3.5 px-4 py-3.5 text-[13px] text-muted-foreground hover:text-primary hover:bg-muted/30 transition-colors">
                  <Globe className="h-[18px] w-[18px] text-primary/50 shrink-0" /> Website
                </a>
              )}
              {(listing as any).whatsapp && (
                <a href={`https://wa.me/${(listing as any).whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3.5 px-4 py-3.5 text-[13px] text-muted-foreground hover:text-primary hover:bg-muted/30 transition-colors">
                  <MessageCircle className="h-[18px] w-[18px] text-primary/50 shrink-0" /> WhatsApp
                </a>
              )}
            </div>
          </div>
        )}

        {/* Restaurant attributes */}
        {showAttributes && (
          <div className="mb-8">
            <SectionHeading>Details</SectionHeading>
            <div className="flex flex-wrap gap-2">
              {priceLabel && (
                <Pill>
                  <DollarSign className="h-3 w-3 text-primary" />
                  <span className="font-semibold">{priceLabel}</span>
                  {priceName && <span className="text-muted-foreground">· {priceName}</span>}
                </Pill>
              )}
              {goodForKids === true && <Pill variant="positive"><Baby className="h-3 w-3" /> Good for Kids</Pill>}
              {goodForKids === false && <Pill variant="muted"><Baby className="h-3 w-3" /> Good for Kids</Pill>}
              {petsAllowed === true && <Pill variant="positive"><PawPrint className="h-3 w-3" /> Pets Allowed</Pill>}
              {petsAllowed === false && <Pill variant="muted"><PawPrint className="h-3 w-3" /> Pets Allowed</Pill>}
              {wheelchairFriendly === true && <Pill variant="positive"><Accessibility className="h-3 w-3" /> Wheelchair Friendly</Pill>}
              {wheelchairFriendly === false && <Pill variant="muted"><Accessibility className="h-3 w-3" /> Wheelchair Friendly</Pill>}
              {smokingAllowed === true && <Pill variant="positive"><Cigarette className="h-3 w-3" /> Smoking Allowed</Pill>}
              {smokingAllowed === false && <Pill variant="muted"><Cigarette className="h-3 w-3" /> Smoking Allowed</Pill>}
              {meal && meal.length > 0 && <Pill><UtensilsCrossed className="h-3 w-3 text-primary" /> {meal.join(", ")}</Pill>}
              {vibe && vibe.length > 0 && <Pill><Palette className="h-3 w-3 text-primary" /> {vibe.join(", ")}</Pill>}
              {cuisine && cuisine.length > 0 && <Pill><ChefHat className="h-3 w-3 text-primary" /> {cuisine.join(", ")}</Pill>}
              {seating && seating.length > 0 && <Pill><Armchair className="h-3 w-3 text-primary" /> {seating.join(", ")}</Pill>}
              {serviceType && serviceType.length > 0 && <Pill><ShoppingBag className="h-3 w-3 text-primary" /> {serviceType.join(", ")}</Pill>}
            </div>
          </div>
        )}

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

          const hasAnyShopInfo = boolItems.length > 0 || (paymentMethods && paymentMethods.length > 0) || shopType || (prodCats && prodCats.length > 0) || priceRng;
          if (!hasAnyShopInfo) return null;

          return (
            <div className="mb-8">
              <SectionHeading>Details</SectionHeading>
              <div className="flex flex-wrap gap-2">
                {shopType && <Pill><ShoppingBag className="h-3 w-3 text-primary" /> {shopType}</Pill>}
                {priceRng && <Pill><DollarSign className="h-3 w-3 text-primary" /> {priceRng}</Pill>}
                {boolItems.map((item) => (
                  <Pill key={item.label} variant="positive"><Check className="h-3 w-3" /> {item.label}</Pill>
                ))}
                {paymentMethods && paymentMethods.length > 0 && (
                  <Pill><span className="text-muted-foreground">Payment:</span> {paymentMethods.join(", ")}</Pill>
                )}
                {prodCats && prodCats.length > 0 && (
                  <Pill><span className="text-muted-foreground">Products:</span> {prodCats.join(", ")}</Pill>
                )}
              </div>
            </div>
          );
        })()}

        {/* Accommodation attributes */}
        {isListingAccommodation && (() => {
          const petsAllowed = (listing as any).pets_allowed as boolean | null;
          const amenities = (listing as any).amenities as string[] | null;
          const sleeps = (listing as any).sleeps as number | null;
          const priceRng = (listing as any).price_range as string | null;
          const kmFromTown = (listing as any).km_from_town as string | null;

          const hasAnyAccomInfo = petsAllowed != null || (amenities && amenities.length > 0) || sleeps != null || priceRng || kmFromTown;
          if (!hasAnyAccomInfo) return null;

          return (
            <div className="mb-8">
              <SectionHeading>Details</SectionHeading>
              <div className="flex flex-wrap gap-2">
                {petsAllowed != null && (
                  <Pill variant={petsAllowed ? "positive" : "neutral"}>
                    <PawPrint className="h-3 w-3" /> {petsAllowed ? "Pets Allowed" : "No Pets"}
                  </Pill>
                )}
                {sleeps != null && <Pill><span className="text-muted-foreground">Sleeps:</span> {sleeps}</Pill>}
                {priceRng && <Pill><DollarSign className="h-3 w-3 text-primary" /> {priceRng}</Pill>}
                {kmFromTown && <Pill><MapPin className="h-3 w-3 text-primary" /> {kmFromTown} km from town</Pill>}
                {amenities && amenities.length > 0 && amenities.map((a) => (
                  <Pill key={a} variant="positive"><Check className="h-3 w-3" /> {a}</Pill>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Description */}
        {listing.description && !longDescription && (
          <div className="mb-8">
            <SectionHeading>About</SectionHeading>
            <p className="text-muted-foreground text-[14px] leading-[1.75] text-left">{listing.description}</p>
          </div>
        )}

        {/* Long description */}
        {longDescription && (
          <div className="mb-8">
            <SectionHeading>About</SectionHeading>
            {longDescription.split("\n").map((paragraph, i) => (
              <p key={i} className="text-foreground/75 text-[14px] leading-[1.8] mb-3 last:mb-0 text-left">{paragraph}</p>
            ))}
          </div>
        )}

        {/* Gallery */}
        {hasGallery && (
          <div className="mb-8">
            <SectionHeading>Gallery</SectionHeading>
            <div className="grid grid-cols-2 gap-2.5">
              {galleryImages.map((url, i) => (
                <div key={i} className="rounded-xl overflow-hidden aspect-[3/4]">
                  <img src={url} alt={`${listing.title} gallery ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Opening hours */}
        {hasHours && (
          <div className="mb-8">
            <SectionHeading icon={<Clock className="h-4 w-4" />}>Hours</SectionHeading>
            <div className="bg-card rounded-2xl border border-border/50 overflow-hidden" style={{ boxShadow: "var(--card-shadow)" }}>
              <div className="divide-y divide-border/30">
                {DAY_LABELS.map((day) => {
                  const value = openingHours[day.toLowerCase()] || "";
                  return (
                    <div key={day} className="flex justify-between px-4 py-3 text-[13px]">
                      <span className="font-medium text-foreground">{day}</span>
                      <span className="text-muted-foreground">{value || "Closed"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Grouped accordion sections — no gaps, one connected block */}
        {isListingRestaurant && (hasDiningInfo || hasServiceInfo || hasKidsInfo || hasAccessibilityInfo || hasAmenitiesInfo || hasSeatingInfo) && (
          <div className="mb-8">
            <div className="bg-card rounded-2xl border border-border/50 overflow-hidden" style={{ boxShadow: "var(--card-shadow)" }}>
              <Accordion type="single" collapsible>
                {hasDiningInfo && (
                  <AccordionItem value="dining" className="border-b border-border/30 last:border-b-0">
                    <AccordionTrigger className={triggerClass}>
                      <span className="flex items-center gap-2.5"><ChefHat className="h-4 w-4 text-primary/50" /> Dining Details</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-3 space-y-3">
                      {diningDetails.map((item) => (
                        <div key={item.label} className="flex items-start gap-2.5 text-[13px]">
                          <span className="font-medium text-foreground min-w-[80px]">{item.label}</span>
                          <span className="text-muted-foreground">{item.value}</span>
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                )}

                {hasServiceInfo && (
                  <AccordionItem value="service" className="border-b border-border/30 last:border-b-0">
                    <AccordionTrigger className={triggerClass}>
                      <span className="flex items-center gap-2.5"><ShoppingBag className="h-4 w-4 text-primary/50" /> Service Options</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-3 space-y-2.5">
                      {serviceItems.map((item) => (
                        <div key={item.label} className="flex items-center gap-2.5 text-[13px] text-foreground">
                          {item.available ? (
                            <Check className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <Ban className="h-3.5 w-3.5 text-destructive" />
                          )}
                          <span className={item.available ? "" : "text-muted-foreground"}>{item.label}</span>
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                )}

                {hasSeatingInfo && (
                  <AccordionItem value="seating" className="border-b border-border/30 last:border-b-0">
                    <AccordionTrigger className={triggerClass}>
                      <span className="flex items-center gap-2.5"><Armchair className="h-4 w-4 text-primary/50" /> Seating</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-3 space-y-2.5">
                      {seatingItems.map((item) => (
                        <div key={item.label} className="flex items-center gap-2.5 text-[13px] text-foreground">
                          <Check className="h-3.5 w-3.5 text-primary" />
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                )}

                {hasAmenitiesInfo && (
                  <AccordionItem value="amenities" className="border-b border-border/30 last:border-b-0">
                    <AccordionTrigger className={triggerClass}>
                      <span className="flex items-center gap-2.5"><Wifi className="h-4 w-4 text-primary/50" /> Amenities</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-3 space-y-2.5">
                      {amenitiesItems.map((item) => (
                        <div key={item.label} className="flex items-center gap-2.5 text-[13px] text-foreground">
                          <Check className="h-3.5 w-3.5 text-primary" />
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                )}

                {hasKidsInfo && (
                  <AccordionItem value="kids" className="border-b border-border/30 last:border-b-0">
                    <AccordionTrigger className={triggerClass}>
                      <span className="flex items-center gap-2.5"><Baby className="h-4 w-4 text-primary/50" /> Kids & Family</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-3 space-y-2.5">
                      {kidsItems.map((item) => (
                        <div key={item.label} className="flex items-center gap-2.5 text-[13px] text-foreground">
                          <Check className="h-3.5 w-3.5 text-primary" />
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                )}

                {hasAccessibilityInfo && (
                  <AccordionItem value="accessibility" className="border-b border-border/30 last:border-b-0">
                    <AccordionTrigger className={triggerClass}>
                      <span className="flex items-center gap-2.5"><Accessibility className="h-4 w-4 text-primary/50" /> Accessibility</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-3 space-y-2.5">
                      {accessibilityItems.map((item) => (
                        <div key={item.label} className="flex items-center gap-2.5 text-[13px] text-foreground">
                          <Check className="h-3.5 w-3.5 text-primary" />
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingDetail;
