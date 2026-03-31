import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Star, MapPin } from "lucide-react";
import BackButton from "@/components/BackButton";

const SavedListings = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState("All");

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

      const { data: listings } = await supabase
        .from("listings")
        .select("id, title, image_url, location, google_rating, category_id, categories(title)")
        .in("id", listingIds);

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
        ].filter((v, i, a) => a.indexOf(v) === i),
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

  const dynamicCategories = (() => {
    if (!favourites || favourites.length === 0) return [];
    const cats = new Set<string>();
    favourites.forEach((f: any) => {
      (f.details?.categoryNames || []).forEach((c: string) => cats.add(c));
    });
    return Array.from(cats).sort();
  })();

  const filterOptions = ["All", ...dynamicCategories];

  const filtered = favourites?.filter((f: any) => {
    if (activeFilter === "All") return true;
    return (f.details?.categoryNames || []).some(
      (c: string) => c.toLowerCase() === activeFilter.toLowerCase()
    );
  }) || [];

  // Not signed in
  if (!loading && !user) {
    return (
      <div className="min-h-screen pb-16 bg-background">
        <div className="px-5 pt-5">
          <BackButton />
        </div>
        <div className="px-5 pt-16 text-center">
          <Heart className="h-10 w-10 mx-auto text-primary/20 mb-5" />
          <h2
            className="text-[22px] font-semibold text-foreground mb-2 tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Sign in to see your saved listings
          </h2>
          <p className="text-muted-foreground text-[13px] leading-relaxed mb-8 max-w-xs mx-auto">
            Save your favourite places in Hoedspruit and find them all here.
          </p>
          <Link to="/auth">
            <Button className="rounded-full px-8 text-[13px] font-medium">Sign In / Create Account</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading || isLoading) {
    return (
      <div className="min-h-screen pb-16 bg-background">
        <div className="px-5 pt-5">
          <BackButton />
        </div>
        <div className="px-5 pt-4 space-y-4">
          <Skeleton className="h-4 w-40" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-7 w-20 rounded-full" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const savedCount = favourites?.length || 0;

  return (
    <div className="min-h-screen pb-16 bg-background">
      <div className="px-5 pt-5">
        <BackButton />
      </div>

      <div className="px-5 pt-4">
        {/* Saved count */}
        <p className="text-muted-foreground text-[13px] mb-4">
          {savedCount} saved listing{savedCount !== 1 ? "s" : ""}
        </p>

        {/* Filter pills */}
        {filterOptions.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-5 scrollbar-hide -mx-5 px-5">
            {filterOptions.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors shrink-0 ${
                  activeFilter === filter
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border/60 text-foreground"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-20">
            <Heart className="h-10 w-10 mx-auto text-primary/15 mb-5" />
            <h3
              className="text-[20px] font-semibold text-foreground mb-2 tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {activeFilter === "All" ? "No saved listings yet" : `No saved ${activeFilter.toLowerCase()}`}
            </h3>
            <p className="text-muted-foreground text-[13px] mb-8 max-w-xs mx-auto leading-relaxed">
              Save your favourite places in Hoedspruit and find them here
            </p>
            <Link to="/categories">
              <Button className="rounded-full px-8 text-[13px] font-medium" variant="outline">
                Explore Hoedspruit
              </Button>
            </Link>
          </div>
        )}

        {/* Saved cards — 2-column grid matching homepage */}
        <div className="grid grid-cols-2 gap-3.5">
          {filtered.map((fav: any) => {
            const detail = fav.details;
            if (!detail) return null;
            const rating = detail.google_rating ? Number(detail.google_rating) : null;
            const location = detail.location;
            const link = `/listing/${fav.item_id}`;

            return (
              <Link key={fav.id} to={link} className="block group">
                <div className="relative rounded-xl overflow-hidden aspect-[3/4]">
                  {detail.image_url ? (
                    <img
                      src={detail.image_url}
                      alt={detail.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeFavourite.mutate({ item_id: fav.item_id, item_type: fav.item_type });
                    }}
                    className="absolute top-2.5 right-2.5 bg-card/90 backdrop-blur-sm rounded-full p-1.5 hover:bg-card transition-colors active:scale-95"
                    aria-label="Remove from saved"
                  >
                    <Heart className="h-3.5 w-3.5 fill-primary text-primary" />
                  </button>

                  {/* Card content */}
                  <div className="absolute bottom-0 left-0 right-0 p-3.5">
                    <h3
                      className="text-[13px] font-medium text-white leading-snug line-clamp-2 drop-shadow-sm mb-1"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {detail.title}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      {rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                          <span className="text-[11px] text-white/85 font-medium">{rating.toFixed(1)}</span>
                        </div>
                      )}
                      {rating && location && <span className="text-white/40 text-[10px]">·</span>}
                      {location && (
                        <span className="text-[11px] text-white/70 truncate">{location}</span>
                      )}
                    </div>
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
