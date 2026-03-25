import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import ListingActions from "@/components/listing/ListingActions";
import ReviewSection from "@/components/listing/ReviewSection";
import { ArrowLeft, MapPin, Phone, Mail, Globe, Star, Clock, Baby, PawPrint, Accessibility, DollarSign, UtensilsCrossed, Palette, ChefHat, Armchair, TreePine, Cigarette, ShoppingBag } from "lucide-react";

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

  const priceLabel = priceLevel ? "$".repeat(priceLevel) : null;
  const priceName = priceLevel === 1 ? "Budget" : priceLevel === 2 ? "Moderate" : priceLevel === 3 ? "Upscale" : priceLevel === 4 ? "Fine Dining" : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-24 pb-16 section-padding">
        <div className="container-wide max-w-4xl mx-auto">
          {firstCategory ? (
            <Link
              to={`/category/${firstCategory.id}`}
              className="inline-flex items-center gap-2 text-primary hover:underline mb-6"
            >
              <ArrowLeft className="h-4 w-4" /> Back to {firstCategory.title}
            </Link>
          ) : (
            <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
          )}

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

          {/* Contact info bar */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-8">
            {listing.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" /> {listing.location}
              </div>
            )}
            {listing.phone && (
              <a href={`tel:${listing.phone}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <Phone className="h-4 w-4 text-primary" /> {listing.phone}
              </a>
            )}
            {listing.email && (
              <a href={`mailto:${listing.email}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <Mail className="h-4 w-4 text-primary" /> {listing.email}
              </a>
            )}
            {listing.website && (
              <a href={listing.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <Globe className="h-4 w-4 text-primary" /> Website
              </a>
            )}
          </div>

          {/* Restaurant attributes */}
          {showAttributes && (
            <div className="flex flex-wrap gap-3 mb-8">
              {priceLabel && (
                <div className="inline-flex items-center gap-1.5 bg-card border border-border rounded-lg px-3 py-2 text-sm">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-foreground">{priceLabel}</span>
                  {priceName && <span className="text-muted-foreground">· {priceName}</span>}
                </div>
              )}
              {goodForKids === true && (
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 rounded-lg px-3 py-2 text-sm font-medium">
                  <Baby className="h-4 w-4" /> Good for Kids
                </div>
              )}
              {goodForKids === false && (
                <div className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground border border-border rounded-lg px-3 py-2 text-sm font-medium line-through opacity-60">
                  <Baby className="h-4 w-4" /> Good for Kids
                </div>
              )}
              {petsAllowed === true && (
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 rounded-lg px-3 py-2 text-sm font-medium">
                  <PawPrint className="h-4 w-4" /> Pets Allowed
                </div>
              )}
              {petsAllowed === false && (
                <div className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground border border-border rounded-lg px-3 py-2 text-sm font-medium line-through opacity-60">
                  <PawPrint className="h-4 w-4" /> Pets Allowed
                </div>
              )}
              {wheelchairFriendly === true && (
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 rounded-lg px-3 py-2 text-sm font-medium">
                  <Accessibility className="h-4 w-4" /> Wheelchair Friendly
                </div>
              )}
              {wheelchairFriendly === false && (
                <div className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground border border-border rounded-lg px-3 py-2 text-sm font-medium line-through opacity-60">
                  <Accessibility className="h-4 w-4" /> Wheelchair Friendly
                </div>
              )}
              {kidsPlayground === true && (
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 rounded-lg px-3 py-2 text-sm font-medium">
                  <TreePine className="h-4 w-4" /> Kids Playground
                </div>
              )}
              {kidsPlayground === false && (
                <div className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground border border-border rounded-lg px-3 py-2 text-sm font-medium line-through opacity-60">
                  <TreePine className="h-4 w-4" /> Kids Playground
                </div>
              )}
              {smokingAllowed === true && (
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 rounded-lg px-3 py-2 text-sm font-medium">
                  <Cigarette className="h-4 w-4" /> Smoking Allowed
                </div>
              )}
              {smokingAllowed === false && (
                <div className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground border border-border rounded-lg px-3 py-2 text-sm font-medium line-through opacity-60">
                  <Cigarette className="h-4 w-4" /> Smoking Allowed
                </div>
              )}
              {meal && meal.length > 0 && (
                <div className="inline-flex items-center gap-1.5 bg-card border border-border rounded-lg px-3 py-2 text-sm">
                  <UtensilsCrossed className="h-4 w-4 text-primary" />
                  <span className="text-foreground">{meal.join(", ")}</span>
                </div>
              )}
              {vibe && vibe.length > 0 && (
                <div className="inline-flex items-center gap-1.5 bg-card border border-border rounded-lg px-3 py-2 text-sm">
                  <Palette className="h-4 w-4 text-primary" />
                  <span className="text-foreground">{vibe.join(", ")}</span>
                </div>
              )}
              {cuisine && cuisine.length > 0 && (
                <div className="inline-flex items-center gap-1.5 bg-card border border-border rounded-lg px-3 py-2 text-sm">
                  <ChefHat className="h-4 w-4 text-primary" />
                  <span className="text-foreground">{cuisine.join(", ")}</span>
                </div>
              )}
              {seating && seating.length > 0 && (
                <div className="inline-flex items-center gap-1.5 bg-card border border-border rounded-lg px-3 py-2 text-sm">
                  <Armchair className="h-4 w-4 text-primary" />
                  <span className="text-foreground">{seating.join(", ")}</span>
                </div>
              )}
              {serviceType && serviceType.length > 0 && (
                <div className="inline-flex items-center gap-1.5 bg-card border border-border rounded-lg px-3 py-2 text-sm">
                  <ShoppingBag className="h-4 w-4 text-primary" />
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
            <p className="text-muted-foreground text-lg mb-6">{listing.description}</p>
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

          {/* Reviews & ratings */}
          <ReviewSection listingId={listing.id} />
        </div>
      </section>
    </div>
  );
};

export default ListingDetail;
