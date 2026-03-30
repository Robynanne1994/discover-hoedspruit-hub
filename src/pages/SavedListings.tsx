import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Star, MapPin } from "lucide-react";
import heroBg from "@/assets/hero-homepage.jpg";



const SavedListings = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState("All");

  // Fetch favourites with full listing/event details
  const { data: favourites, isLoading } = useQuery({
    queryKey: ["saved-listings-page", user?.id],
    queryFn: async () => {
      const { data: favs } = await supabase
        .from("favourites")
        .select("*")
        .eq("user_id", user!.id)
        .eq("item_type", "listing")
        .order("created_at", { ascending: false });
      if (!favs || favs.length === 0) return [];

      const listingIds = favs.map((f) => f.item_id);

      // Fetch listings with their direct category
      const { data: listings } = await supabase
        .from("listings")
        .select("id, title, image_url, location, google_rating, category_id, categories(title)")
        .in("id", listingIds);

      // Also fetch categories via junction table for each listing
      const { data: junctions } = await supabase
        .from("listing_categories")
        .select("listing_id, categories(id, title)")
        .in("listing_id", listingIds);

      const junctionMap: Record<string, string[]> = {};
      (junctions || []).forEach((j: any) => {
        if (!junctionMap[j.listing_id]) junctionMap[j.listing_id] = [];
        if (j.categories?.title) junctionMap[j.listing_id].push(j.categories.title);
      });

      const listingsMap = Object.fromEntries((listings || []).map((l: any) => [l.id, {
        ...l,
        categoryNames: [
          ...(l.categories?.title ? [l.categories.title] : []),
          ...(junctionMap[l.id] || []),
        ].filter((v, i, a) => a.indexOf(v) === i), // dedupe
      }]));

      return favs.map((f) => ({
        ...f,
        details: listingsMap[f.item_id],
      })).filter((f) => f.details);
    },
    enabled: !!user,
  });

  const removeFavourite = useMutation({
    mutationFn: async (fav: { item_id: string; item_type: string }) => {
      await supabase
        .from("favourites")
        .delete()
        .eq("user_id", user!.id)
        .eq("item_id", fav.item_id)
        .eq("item_type", fav.item_type);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-listings-page"] });
      queryClient.invalidateQueries({ queryKey: ["favourites"] });
      queryClient.invalidateQueries({ queryKey: ["favourite"] });
    },
  });

  // Derive dynamic category filters from saved listings
  const dynamicCategories = (() => {
    if (!favourites || favourites.length === 0) return [];
    const cats = new Set<string>();
    favourites.forEach((f: any) => {
      (f.details?.categoryNames || []).forEach((c: string) => cats.add(c));
    });
    return Array.from(cats).sort();
  })();

  const filterOptions = ["All", ...dynamicCategories];

  // Filter logic
  const filtered = favourites?.filter((f: any) => {
    if (activeFilter === "All") return true;
    return (f.details?.categoryNames || []).some(
      (c: string) => c.toLowerCase() === activeFilter.toLowerCase()
    );
  }) || [];

  // Not signed in
  if (!loading && !user) {
    return (
      <div className="min-h-screen pb-20 bg-background">
        <section className="relative">
          <div className="relative h-[220px] overflow-hidden">
            <img src={heroBg} alt="Hoedspruit" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "var(--hero-overlay)" }} />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <h1 className="text-2xl font-bold tracking-tight text-center mb-1" style={{ fontFamily: "var(--font-heading)" }}>
                Hello<br />Hoedspruit
              </h1>
              <p className="text-lg font-semibold mt-1" style={{ fontFamily: "var(--font-heading)" }}>
                ​
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-background rounded-t-[2rem]" />
        </section>
        <div className="px-4 pt-6 text-center">
          <Heart className="h-12 w-12 mx-auto text-primary/30 mb-4" />
          <h2 className="text-lg font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-heading)" }}>
            Sign in to see your saved listings
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Save your favourite places in Hoedspruit and find them all here.
          </p>
          <Link to="/auth">
            <Button className="rounded-full px-8">Sign In / Create Account</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading || isLoading) {
    return (
      <div className="min-h-screen pb-20 bg-background">
        <div className="relative h-[220px] overflow-hidden">
          <img src={heroBg} alt="Hoedspruit" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "var(--hero-overlay)" }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <h1 className="text-2xl font-bold tracking-tight text-center mb-1" style={{ fontFamily: "var(--font-heading)" }}>
              Hello<br />Hoedspruit
            </h1>
            <p className="text-lg font-semibold mt-1" style={{ fontFamily: "var(--font-heading)" }}>
              ​
            </p>
          </div>
        </div>
        <div className="relative -mt-6 bg-background rounded-t-[2rem] pt-6 px-4 space-y-4">
          <Skeleton className="h-5 w-48" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))}
          </div>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const savedCount = favourites?.length || 0;

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Hero */}
      <section className="relative">
        <div className="relative h-[220px] overflow-hidden">
          <img src={heroBg} alt="Hoedspruit" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "var(--hero-overlay)" }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <h1 className="text-2xl font-bold tracking-tight text-center mb-1" style={{ fontFamily: "var(--font-heading)" }}>
              Hello<br />Hoedspruit
            </h1>
            <p className="text-lg font-semibold mt-1" style={{ fontFamily: "var(--font-heading)" }}>
              Saved Listings
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-background rounded-t-[2rem]" />
      </section>

      <div className="relative -mt-6 pt-2 px-4">
        {/* Saved count */}
        <p className="text-foreground text-sm mb-4">
          You have <span className="font-semibold">{savedCount}</span> saved listing{savedCount !== 1 ? "s" : ""}
        </p>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
          {filterOptions.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 ${
                activeFilter === filter
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-foreground"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Heart className="h-14 w-14 mx-auto text-primary/25 mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-heading)" }}>
              {activeFilter === "All" ? "No saved listings yet" : `No saved ${activeFilter.toLowerCase()}`}
            </h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
              Save your favourite places in Hoedspruit and find them here
            </p>
            <Link to="/categories">
              <Button className="rounded-full px-8" variant="outline">
                Explore Hoedspruit
              </Button>
            </Link>
          </div>
        )}

        {/* Saved cards */}
        <div className="space-y-4">
          {filtered.map((fav: any) => {
            const detail = fav.details;
            if (!detail) return null;
            const rating = detail.google_rating ? Number(detail.google_rating) : null;
            const categoryName = detail.categories?.title || "";
            const location = detail.location;
            const link = `/listing/${fav.item_id}`;

            return (
              <Link key={fav.id} to={link} className="block">
                <div className="relative rounded-2xl overflow-hidden shadow-sm">
                  {/* Image */}
                  <div className="relative h-48">
                    {detail.image_url ? (
                      <img
                        src={detail.image_url}
                        alt={detail.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <MapPin className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Heart button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeFavourite.mutate({ item_id: fav.item_id, item_type: fav.item_type });
                      }}
                      className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-sm hover:bg-white transition-colors active:scale-95"
                      aria-label="Remove from saved"
                    >
                      <Heart className="h-4.5 w-4.5 fill-primary text-primary" />
                    </button>

                    {/* Title and info overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-bold text-lg leading-tight mb-1" style={{ fontFamily: "var(--font-heading)" }}>
                        {detail.title}
                      </h3>
                    </div>
                  </div>

                  {/* Info row below image */}
                  <div className="bg-card px-4 py-3 flex items-center gap-2">
                    {rating && (
                      <div className="flex items-center gap-1">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-3.5 w-3.5 ${
                                s <= Math.round(rating)
                                  ? "text-accent fill-accent"
                                  : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-semibold text-foreground ml-0.5">{rating.toFixed(1)}</span>
                      </div>
                    )}
                    {rating && location && <span className="text-muted-foreground">·</span>}
                    {location && (
                      <span className="text-sm text-muted-foreground truncate">{location}</span>
                    )}
                    {!rating && !location && categoryName && (
                      <span className="text-sm text-muted-foreground">{categoryName}</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SavedListings;
