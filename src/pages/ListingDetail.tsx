import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import ListingActions from "@/components/listing/ListingActions";
import { MapPin, Phone, Mail, Globe, Star, Clock, Baby, PawPrint, Accessibility, DollarSign, UtensilsCrossed, Palette, ChefHat, Armchair, TreePine, Cigarette, ShoppingBag, Check, ChevronDown, Wifi, Bath } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import BackButton from "@/components/BackButton";

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const ListingDetail = () => {
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

  // Fetch categories via junction table
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
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 section-padding">
          <div className="container-wide">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 section-padding">
          <div className="container-wide text-center py-16">
            <p className="text-muted-foreground text-lg">Listing not found.</p>
            <Link to="/" className="text-primary hover:underline mt-4 inline-block">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  const firstCategory = listingCategories && listingCategories.length > 0 ? listingCategories[0] : null;
  const galleryImages = (listing as any).gallery_images as string[] | null;
  const longDescription = (listing as any).long_description as string | null;
  const openingHours = (listing as any).opening_hours as Record<string, string> | null;
  const hasGallery = galleryImages && galleryImages.length > 0;
  const hasHours = openingHours && Object.values(openingHours).some((v) => v);
  const showAttributes = (listing as any).show_attributes as boolean;
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
    { label: "Kids Playground", value: kidsPlayground },
    { label: "Kids Menu", value: kidsMenu },
    { label: "High Chairs", value: highChairs },
  ].filter((item) => item.value === true);
  const hasKidsInfo = kidsItems.length > 0;

  const accessibilityItems = [
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

  const priceLabel = priceLevel ? "$".repeat(priceLevel) : null;
  const priceName = priceLevel === 1 ? "Budget" : priceLevel === 2 ? "Moderate" : priceLevel === 3 ? "Upscale" : priceLevel === 4 ? "Fine Dining" : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-24 pb-16 section-padding">
        <div className="container-wide max-w-4xl mx-auto">
          <BackButton />

          {/* Hero image */}
          {listing.image_url && (
            <div className="rounded-xl overflow-hidden mb-8">
              <img
                src={listing.image_url}
                alt={listing.title}
                className="w-full h-64 sm:h-80 lg:h-96 object-cover"
              />
            </div>
          )}

          {/* Title & featured badge */}
          <div className="mb-6">
            {listing.is_featured && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent mb-2">
                <Star className="h-3 w-3 fill-current" /> Featured
              </span>
            )}
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
              {listing.title}
            </h1>
            {/* Show all categories as tags */}
            {listingCategories && listingCategories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {listingCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.id}`}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    {cat.title}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Google rating */}
          {(listing as any).google_rating != null && (
            <div className="flex items-center gap-2 mb-4">
              {(listing as any).google_reviews_url ? (
                <a href={(listing as any).google_reviews_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`h-4 w-4 ${star <= Math.round((listing as any).google_rating) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}`} />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-foreground">{(listing as any).google_rating}</span>
                  {(listing as any).google_reviews_count != null && (
                    <span className="text-xs text-muted-foreground underline">({(listing as any).google_reviews_count} Google reviews)</span>
                  )}
                </a>
              ) : (
                <>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`h-4 w-4 ${star <= Math.round((listing as any).google_rating) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}`} />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-foreground">{(listing as any).google_rating}</span>
                  {(listing as any).google_reviews_count != null && (
                    <span className="text-xs text-muted-foreground">({(listing as any).google_reviews_count} Google reviews)</span>
                  )}
                </>
              )}
            </div>
          )}

          {/* Contact info box */}
          <div className="bg-muted/50 border border-border rounded-sm px-3 py-3 mb-8 flex flex-col gap-2.5">
            {listing.location && (
              (listing as any).google_maps_link ? (
                <a href={(listing as any).google_maps_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                  <MapPin className="h-3.5 w-3.5 text-accent shrink-0" /> {listing.location}
                </a>
              ) : (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-accent shrink-0" /> {listing.location}
                </div>
              )
            )}
            {listing.phone && (
              <a href={`tel:${listing.phone}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                <Phone className="h-3.5 w-3.5 text-accent shrink-0" /> {listing.phone}
              </a>
            )}
            {listing.email && (
              <a href={`mailto:${listing.email}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                <Mail className="h-3.5 w-3.5 text-accent shrink-0" /> {listing.email}
              </a>
            )}
            {listing.website && (
              <a href={listing.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                <Globe className="h-3.5 w-3.5 text-accent shrink-0" /> Website
              </a>
            )}
          </div>

          {/* Restaurant attributes */}
          {showAttributes && (
            <div className="flex flex-wrap gap-1.5 mb-8">
              {priceLabel && (
                <div className="inline-flex items-center gap-1 bg-card border border-border rounded-md px-2 py-1 text-xs">
                  <DollarSign className="h-3 w-3 text-primary" />
                  <span className="font-semibold text-foreground">{priceLabel}</span>
                  {priceName && <span className="text-muted-foreground">· {priceName}</span>}
                </div>
              )}
              {goodForKids === true && (
                <div className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 rounded-md px-2 py-1 text-xs font-medium">
                  <Baby className="h-3 w-3" /> Good for Kids
                </div>
              )}
              {goodForKids === false && (
                <div className="inline-flex items-center gap-1 bg-muted text-muted-foreground border border-border rounded-md px-2 py-1 text-xs font-medium line-through opacity-60">
                  <Baby className="h-3 w-3" /> Good for Kids
                </div>
              )}
              {petsAllowed === true && (
                <div className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 rounded-md px-2 py-1 text-xs font-medium">
                  <PawPrint className="h-3 w-3" /> Pets Allowed
                </div>
              )}
              {petsAllowed === false && (
                <div className="inline-flex items-center gap-1 bg-muted text-muted-foreground border border-border rounded-md px-2 py-1 text-xs font-medium line-through opacity-60">
                  <PawPrint className="h-3 w-3" /> Pets Allowed
                </div>
              )}
              {wheelchairFriendly === true && (
                <div className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 rounded-md px-2 py-1 text-xs font-medium">
                  <Accessibility className="h-3 w-3" /> Wheelchair Friendly
                </div>
              )}
              {wheelchairFriendly === false && (
                <div className="inline-flex items-center gap-1 bg-muted text-muted-foreground border border-border rounded-md px-2 py-1 text-xs font-medium line-through opacity-60">
                  <Accessibility className="h-3 w-3" /> Wheelchair Friendly
                </div>
              )}
              {kidsPlayground === true && (
                <div className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 rounded-md px-2 py-1 text-xs font-medium">
                  <TreePine className="h-3 w-3" /> Kids Playground
                </div>
              )}
              {kidsPlayground === false && (
                <div className="inline-flex items-center gap-1 bg-muted text-muted-foreground border border-border rounded-md px-2 py-1 text-xs font-medium line-through opacity-60">
                  <TreePine className="h-3 w-3" /> Kids Playground
                </div>
              )}
              {smokingAllowed === true && (
                <div className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 rounded-md px-2 py-1 text-xs font-medium">
                  <Cigarette className="h-3 w-3" /> Smoking Allowed
                </div>
              )}
              {smokingAllowed === false && (
                <div className="inline-flex items-center gap-1 bg-muted text-muted-foreground border border-border rounded-md px-2 py-1 text-xs font-medium line-through opacity-60">
                  <Cigarette className="h-3 w-3" /> Smoking Allowed
                </div>
              )}
              {meal && meal.length > 0 && (
                <div className="inline-flex items-center gap-1 bg-card border border-border rounded-md px-2 py-1 text-xs">
                  <UtensilsCrossed className="h-3 w-3 text-primary" />
                  <span className="text-foreground">{meal.join(", ")}</span>
                </div>
              )}
              {vibe && vibe.length > 0 && (
                <div className="inline-flex items-center gap-1 bg-card border border-border rounded-md px-2 py-1 text-xs">
                  <Palette className="h-3 w-3 text-primary" />
                  <span className="text-foreground">{vibe.join(", ")}</span>
                </div>
              )}
              {cuisine && cuisine.length > 0 && (
                <div className="inline-flex items-center gap-1 bg-card border border-border rounded-md px-2 py-1 text-xs">
                  <ChefHat className="h-3 w-3 text-primary" />
                  <span className="text-foreground">{cuisine.join(", ")}</span>
                </div>
              )}
              {seating && seating.length > 0 && (
                <div className="inline-flex items-center gap-1 bg-card border border-border rounded-md px-2 py-1 text-xs">
                  <Armchair className="h-3 w-3 text-primary" />
                  <span className="text-foreground">{seating.join(", ")}</span>
                </div>
              )}
              {serviceType && serviceType.length > 0 && (
                <div className="inline-flex items-center gap-1 bg-card border border-border rounded-md px-2 py-1 text-xs">
                  <ShoppingBag className="h-3 w-3 text-primary" />
                  <span className="text-foreground">{serviceType.join(", ")}</span>
                </div>
              )}
            </div>
          )}

          {/* User actions */}
          <div className="mb-8">
            <ListingActions listingId={listing.id} />
          </div>

          {/* Description */}
          {listing.description && (
            <p className="text-muted-foreground text-sm mb-6">{listing.description}</p>
          )}

          {/* Long description */}
          {longDescription && (
            <div className="prose prose-neutral max-w-none mb-10">
              {longDescription.split("\n").map((paragraph, i) => (
                <p key={i} className="text-foreground/80 leading-relaxed mb-3">{paragraph}</p>
              ))}
            </div>
          )}

          {/* Gallery */}
          {hasGallery && (
            <div className="mb-10">
              <h2 className="font-heading text-2xl font-bold text-foreground mb-4">Gallery</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {galleryImages.map((url, i) => (
                  <div key={i} className="rounded-lg overflow-hidden aspect-[4/3]">
                    <img src={url} alt={`${listing.title} gallery ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Opening hours */}
          {hasHours && (
            <div className="mb-10">
              <h2 className="font-heading text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" /> Opening Hours
              </h2>
              <div className="bg-card border border-border rounded-xl p-5 space-y-2">
                {DAY_LABELS.map((day) => {
                  const value = openingHours[day.toLowerCase()] || "";
                  return (
                    <div key={day} className="flex justify-between text-sm">
                      <span className="font-medium text-foreground">{day}</span>
                      <span className="text-muted-foreground">{value || "Closed"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Kids accordion */}
          {hasKidsInfo && (
            <div className="mb-10">
              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full bg-card border border-border rounded-xl px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors group">
                  <span className="flex items-center gap-2"><Baby className="h-4 w-4 text-primary" /> Kids</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="bg-card border border-t-0 border-border rounded-b-xl px-5 py-3 space-y-2">
                  {kidsItems.map((item) => (
                    <div key={item.label} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          {/* Accessibility accordion */}
          {hasAccessibilityInfo && (
            <div className="mb-10">
              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full bg-card border border-border rounded-xl px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors group">
                  <span className="flex items-center gap-2"><Accessibility className="h-4 w-4 text-primary" /> Accessibility</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="bg-card border border-t-0 border-border rounded-b-xl px-5 py-3 space-y-2">
                  {accessibilityItems.map((item) => (
                    <div key={item.label} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          {/* Service options accordion */}
          {((seating && seating.length > 0) || (serviceType && serviceType.length > 0)) && (
            <div className="mb-10">
              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full bg-card border border-border rounded-xl px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors group">
                  <span className="flex items-center gap-2"><ShoppingBag className="h-4 w-4 text-primary" /> Service options</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="bg-card border border-t-0 border-border rounded-b-xl px-5 py-3 space-y-2">
                  {seating && seating.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{item}</span>
                    </div>
                  ))}
                  {serviceType && serviceType.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{item}</span>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          {/* Amenities accordion */}
          {hasAmenitiesInfo && (
            <div className="mb-10">
              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full bg-card border border-border rounded-xl px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors group">
                  <span className="flex items-center gap-2"><Wifi className="h-4 w-4 text-primary" /> Amenities</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="bg-card border border-t-0 border-border rounded-b-xl px-5 py-3 space-y-2">
                  {amenitiesItems.map((item) => (
                    <div key={item.label} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ListingDetail;
