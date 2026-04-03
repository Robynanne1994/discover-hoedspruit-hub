import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import BackButton from "@/components/BackButton";
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
        <div className="relative h-[200px] overflow-hidden">
          <img
            src={heroBg}
            alt="Hoedspruit bushveld"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, hsla(30, 20%, 15%, 0.15), hsla(30, 20%, 15%, 0.55))" }}
          />

          {/* Back button */}
          <div className="absolute top-4 left-4 z-10">
            <BackButton className="text-white/90 hover:text-white mb-0" />
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
            <p className="text-white/70 text-[11px] font-medium tracking-[0.2em] uppercase mb-1.5">
              Hello Hoedspruit
            </p>
            <h1
              className="text-[34px] font-semibold tracking-tight leading-[1.1] text-center text-white"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Explore
            </h1>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-5 -mt-5 relative z-10">
          <div className="flex items-center bg-card backdrop-blur-sm rounded-2xl px-4 py-3.5 gap-3 border border-border/60 shadow-sm">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="Search categories & listings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-[13px] flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground placeholder:italic"
              style={{ fontFamily: "var(--font-body)" }}
            />
          </div>
        </div>
      </section>

      {/* Listing results */}
      {hasSearch && listings && listings.length > 0 && (
        <section className="px-5 pt-7">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.15em] mb-3">
            Listings
          </p>
          <div className="space-y-2.5">
            {listings.map((listing) => (
              <Link
                key={listing.id}
                to={`/listing/${listing.id}`}
                className="flex items-center gap-3.5 bg-card border border-border/60 rounded-2xl p-3 active:scale-[0.98] transition-transform"
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
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
                  <h4 className="text-[14px] font-medium text-foreground truncate">
                    {listing.title}
                  </h4>
                  <div className="flex items-center gap-2.5 mt-1">
                    {listing.google_rating && (
                      <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {listing.google_rating}
                      </span>
                    )}
                    {listing.location && (
                      <span className="flex items-center gap-1 text-[12px] text-muted-foreground truncate">
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
        <div className="px-5 pt-7">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.15em] mb-3">
            Categories
          </p>
        </div>
      )}

      {/* Grid */}
      <section className={`px-5 ${hasSearch && filteredCategories.length > 0 ? "pt-0" : "pt-7"} pb-8`}>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
            ))}
          </div>
        ) : hasSearch && !hasResults ? (
          <div className="text-center py-20">
            <p
              className="text-foreground font-semibold text-lg mb-1"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              No results found
            </p>
            <p className="text-muted-foreground text-[13px]">
              Try another search term
            </p>
          </div>
        ) : !hasSearch && filteredCategories.length === 0 ? (
          <div className="text-center py-20">
            <p
              className="text-foreground font-semibold text-lg mb-1"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Nothing to explore just yet
            </p>
            <p className="text-muted-foreground text-[13px]">
              We're getting Hoedspruit ready for you
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredCategories.map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.id}`}
                className="group relative rounded-2xl overflow-hidden aspect-[3/4] active:scale-[0.97] transition-transform duration-150"
              >
                {cat.image_url ? (
                  <img
                    src={cat.image_url}
                    alt={cat.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 bg-muted" />
                )}
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(to top, hsla(30, 15%, 10%, 0.6) 0%, hsla(30, 15%, 10%, 0.15) 45%, transparent 100%)" }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3
                    className="text-white font-semibold leading-snug drop-shadow-sm font-sans text-xs"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
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
