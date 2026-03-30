import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import BottomNav from "@/components/BottomNav";
import heroBg from "@/assets/hero-homepage.jpg";

const Categories = () => {
  const [search, setSearch] = useState("");

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_quick_category", false)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: listings } = useQuery({
    queryKey: ["listings-search", search],
    queryFn: async () => {
      if (!search.trim()) return [];
      const { data, error } = await supabase
        .from("listings")
        .select("id, title, image_url, location, google_rating")
        .ilike("title", `%${search.trim()}%`)
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: search.trim().length > 0,
  });

  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter((c) => c.title.toLowerCase().includes(q));
  }, [categories, search]);

  const hasSearch = search.trim().length > 0;
  const hasResults = filteredCategories.length > 0 || (listings && listings.length > 0);

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Hero */}
      <section className="relative">
        <div className="relative h-[160px] overflow-hidden">
          <img
            src={heroBg}
            alt="Hoedspruit bushveld"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: "var(--hero-overlay)" }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <h1
              className="text-3xl font-bold tracking-tight leading-tight text-center"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Explore
              <br />
              Hoedspruit
            </h1>
            <p
              className="text-center text-sm font-semibold text-white/90 mt-1"
              style={{ fontFamily: "var(--font-heading)" }}
            />
          </div>
        </div>

        <div className="px-4 -mt-3 relative z-10">

          {/* Search bar */}
          <div className="flex items-center bg-card rounded-full shadow-card border px-4 py-3 gap-3 border-primary-hover">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="Search categories & listings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-sm flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground placeholder:italic"
            />
          </div>
        </div>
      </section>

      {/* Listing results */}
      {hasSearch && listings && listings.length > 0 && (
        <section className="px-4 pt-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Listings
          </p>
          <div className="space-y-2">
            {listings.map((listing) => (
              <Link
                key={listing.id}
                to={`/listing/${listing.id}`}
                className="flex items-center gap-3 bg-card border border-border rounded-xl p-2.5 active:scale-[0.98] transition-transform"
              >
                <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                  {listing.image_url ? (
                    <img
                      src={listing.image_url}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground truncate">
                    {listing.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    {listing.google_rating && (
                      <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {listing.google_rating}
                      </span>
                    )}
                    {listing.location && (
                      <span className="flex items-center gap-0.5 text-xs text-muted-foreground truncate">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        {listing.location}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Categories heading when searching */}
      {hasSearch && filteredCategories.length > 0 && (
        <div className="px-4 pt-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Categories
          </p>
        </div>
      )}

      {/* Grid */}
      <section className={`px-4 ${hasSearch && filteredCategories.length > 0 ? "pt-0" : "pt-5"} pb-4`}>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
            ))}
          </div>
        ) : hasSearch && !hasResults ? (
          <div className="text-center py-16">
            <p className="text-foreground font-semibold text-lg mb-1">
              No results found
            </p>
            <p className="text-muted-foreground text-sm">
              Try another search term
            </p>
          </div>
        ) : !hasSearch && filteredCategories.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-foreground font-semibold text-lg mb-1">
              Nothing to explore just yet
            </p>
            <p className="text-muted-foreground text-sm">
              We're getting Hoedspruit ready for you
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredCategories.map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.id}`}
                className="group relative rounded-xl overflow-hidden aspect-[4/3] shadow-card active:scale-[0.97] transition-transform duration-150"
              >
                {cat.image_url ? (
                  <img
                    src={cat.image_url}
                    alt={cat.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 bg-muted" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="text-white text-sm font-bold drop-shadow-md">
                    {cat.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Categories;
