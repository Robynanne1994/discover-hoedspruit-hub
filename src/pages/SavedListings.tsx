import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Star, ArrowLeft, Search } from "lucide-react";

const SavedListings = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");

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

  const filtered = (favourites?.filter((f: any) => {
    if (activeFilter === "All") return true;
    return (f.details?.categoryNames || []).some(
      (c: string) => c.toLowerCase() === activeFilter.toLowerCase()
    );
  }) || []).filter((f: any) => {
    if (!search.trim()) return true;
    return f.details?.title?.toLowerCase().includes(search.toLowerCase());
  });

  const savedCount = favourites?.length || 0;

  const backButton = (
    <div style={{ paddingTop: 52, paddingLeft: 24, paddingRight: 24, marginBottom: 28 }}>
      <button onClick={() => navigate(-1)} className="flex items-center" style={{ gap: 6 }}>
        <ArrowLeft style={{ width: 18, height: 18, strokeWidth: 2, color: "rgba(18,18,20,0.4)" }} />
        <span style={{ fontSize: 15, fontWeight: 500, color: "rgba(18,18,20,0.4)", letterSpacing: "0.2px" }}>Back</span>
      </button>
    </div>
  );

  // Not signed in
  if (!loading && !user) {
    return (
      <div className="min-h-screen pb-20" style={{ background: "#ffffff" }}>
        {backButton}
        <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 12 }}>
          <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 40, lineHeight: 0.95, letterSpacing: "-0.5px", color: "#121214", textTransform: "uppercase" }}>
            SAVED
          </h1>
        </div>
        <div className="text-center" style={{ paddingTop: 60 }}>
          <Heart style={{ width: 48, height: 48, strokeWidth: 1.5, color: "rgba(18,18,20,0.15)", margin: "0 auto" }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#121214", marginTop: 16, marginBottom: 8 }}>
            Sign in to see saved
          </h3>
          <p style={{ fontSize: 14, color: "rgba(18,18,20,0.4)", textAlign: "center", maxWidth: 260, margin: "0 auto 24px" }}>
            Save your favourite places and find them all here
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
      <div className="min-h-screen pb-20" style={{ background: "#ffffff" }}>
        {backButton}
        <div style={{ paddingLeft: 24, paddingRight: 24 }}>
          <Skeleton className="h-10 w-48 mb-4" />
          <Skeleton className="h-4 w-40 mb-6" />
          <Skeleton className="h-12 w-full rounded-[14px] mb-5" />
          <div className="flex gap-2 mb-7">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-9 w-20 rounded-[10px]" />)}
          </div>
          <div className="grid grid-cols-2 gap-x-[14px] gap-y-5">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="aspect-[4/3] rounded-[16px]" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: "#ffffff" }}>
      {backButton}

      {/* Heading */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 12 }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 40, lineHeight: 0.95, letterSpacing: "-0.5px", color: "#121214", textTransform: "uppercase" }}>
          SAVED
        </h1>
      </div>

      {/* Subtitle */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 24 }}>
        <p style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontStyle: "italic", fontSize: 14, color: "rgba(18,18,20,0.4)", letterSpacing: "0.2px", lineHeight: 1.4 }}>
          {savedCount} {savedCount === 1 ? "place" : "places"} saved for later
        </p>
      </div>

      {/* Search bar */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 20 }}>
        <div className="flex items-center" style={{ background: "rgba(18,18,20,0.04)", border: "1px solid rgba(18,18,20,0.08)", borderRadius: 14, padding: "14px 16px", gap: 10 }}>
          <Search style={{ width: 18, height: 18, strokeWidth: 2, color: "rgba(18,18,20,0.3)", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search saved places..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none"
            style={{ fontSize: 14, color: "#121214", letterSpacing: "0.2px" }}
          />
        </div>
      </div>

      {/* Filter pills */}
      {filterOptions.length > 1 && (
        <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 28 }}>
          <div className="flex overflow-x-auto scrollbar-hide" style={{ gap: 8 }}>
            {filterOptions.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className="whitespace-nowrap"
                style={{
                  background: activeFilter === filter ? "#121214" : "rgba(18,18,20,0.04)",
                  border: activeFilter === filter ? "1px solid #121214" : "1px solid rgba(18,18,20,0.08)",
                  borderRadius: 10,
                  padding: "9px 18px",
                  fontSize: 13,
                  fontWeight: activeFilter === filter ? 600 : 500,
                  color: activeFilter === filter ? "#ffffff" : "rgba(18,18,20,0.5)",
                }}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ paddingLeft: 24, paddingRight: 24 }}>
        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center" style={{ paddingTop: 60 }}>
            <Heart style={{ width: 48, height: 48, strokeWidth: 1.5, color: "rgba(18,18,20,0.15)", margin: "0 auto" }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#121214", marginTop: 16, marginBottom: 8 }}>
              Nothing saved yet
            </h3>
            <p style={{ fontSize: 14, color: "rgba(18,18,20,0.4)", textAlign: "center" }}>
              Tap the heart on any listing to save it here
            </p>
          </div>
        )}

        {/* Saved cards — 2-column grid */}
        {filtered.length > 0 && (
          <div className="flex flex-col" style={{ gap: 16 }}>
            {filtered.map((fav: any) => {
              const detail = fav.details;
              if (!detail) return null;
              const rating = detail.google_rating ? Number(detail.google_rating) : null;
              const location = detail.location;

              return (
                <Link key={fav.id} to={`/listing/${fav.item_id}`} className="block group">
                  <div className="relative overflow-hidden w-full" style={{ borderRadius: 16, height: 200, background: "#f0f0f0" }}>
                    {detail.image_url ? (
                      <img
                        src={detail.image_url}
                        alt={detail.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full" style={{ background: "#f0f0f0" }} />
                    )}
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)" }} />

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeFavourite.mutate({ item_id: fav.item_id, item_type: fav.item_type });
                      }}
                      className="absolute flex items-center justify-center"
                      style={{ top: 12, right: 12, width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.25)" }}
                      aria-label="Remove from saved"
                    >
                      <Heart style={{ width: 20, height: 20, color: "#ffffff", fill: "#ffffff" }} />
                    </button>

                    <div className="absolute bottom-0 left-0 right-0" style={{ padding: 16 }}>
                      <h3
                        className="line-clamp-2"
                        style={{ fontSize: 16, fontWeight: 700, color: "#ffffff", lineHeight: 1.2, marginBottom: 4 }}
                      >
                        {detail.title}
                      </h3>
                      <div className="flex items-center" style={{ gap: 4 }}>
                        {rating && (
                          <>
                            <Star style={{ width: 12, height: 12, color: "#E8A83E", fill: "#E8A83E", flexShrink: 0 }} />
                            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{rating.toFixed(1)}</span>
                          </>
                        )}
                        {rating && location && <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>·</span>}
                        {location && (
                          <span className="truncate" style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{location}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedListings;
