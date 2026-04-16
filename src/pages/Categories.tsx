import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ArrowLeft, ArrowUpRight, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const Categories = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

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

  const { data: listingCounts } = useQuery({
    queryKey: ["listing-counts-by-category"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listing_categories")
        .select("category_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      data.forEach((row) => {
        counts[row.category_id] = (counts[row.category_id] || 0) + 1;
      });
      return counts;
    },
  });

  const debouncedSearch = search.trim();

  const { data: searchedListings } = useQuery({
    queryKey: ["explore-listing-search", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch) return [];
      const { data, error } = await supabase
        .from("listings")
        .select("id, title, image_url, location")
        .ilike("title", `%${debouncedSearch}%`)
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: debouncedSearch.length >= 2,
  });

  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    if (!debouncedSearch) return categories;
    const q = debouncedSearch.toLowerCase();
    return categories.filter((c) => c.title.toLowerCase().includes(q));
  }, [categories, debouncedSearch]);

  const hasSearch = debouncedSearch.length >= 2;
  const listingResults = hasSearch ? (searchedListings || []) : [];

  return (
    <div className="min-h-screen" style={{ background: "#EBEBEB", paddingBottom: 84, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      {/* Back button */}
      <div style={{ paddingTop: 16, paddingLeft: 24, paddingRight: 24, marginBottom: 8 }}>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center"
          style={{ gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <ArrowLeft size={20} strokeWidth={1.8} style={{ color: "#2B2420" }} />
          <span style={{ fontSize: 15, fontWeight: 500, color: "#2B2420" }}>Back</span>
        </button>
      </div>

      {/* Heading */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 4 }}>
        <h1 
          className="font-semibold"
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            textTransform: "none",
            fontSize: 53,
            lineHeight: 1,
            letterSpacing: "0.01em",
            color: "#020202",
            margin: 0,
          }}
        >
          Explore<br />Hoedspruit
        </h1>
      </div>

      {/* Subtitle */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 24 }}>
        <p style={{
          fontSize: 15,
          fontWeight: 400,
          lineHeight: 1.35,
          color: "rgba(18,18,20,0.55)",
          margin: 0,
        }}>
          Choose your adventure, tailored just for you
        </p>
      </div>

      {/* Search bar */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 24 }}>
        <div
          className="flex items-center"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(18,18,20,0.1)",
            borderRadius: 14,
            padding: "12px 16px",
            gap: 8,
          }}
        >
          <Search size={20} strokeWidth={1.8} style={{ color: "rgba(18,18,20,0.35)", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search categories & listings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: 15,
              fontWeight: 400,
              color: "#2B2420",
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            }}
            className="placeholder:text-[rgba(18,18,20,0.35)]"
          />
        </div>
      </div>

      {/* Category cards */}
      <div style={{ paddingLeft: 4, paddingRight: 4 }}>
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="w-full" style={{ aspectRatio: "16/10", borderRadius: 16, background: "#f0f0f0" }} />
            ))}
          </div>
        ) : filteredCategories.length === 0 && listingResults.length === 0 ? (
          <div className="text-center" style={{ paddingTop: 80 }}>
            <p style={{ fontWeight: 500, fontSize: 18, color: "#2B2420", marginBottom: 4 }}>No results found</p>
            <p style={{ fontSize: 14, color: "rgba(18,18,20,0.55)" }}>Try another search term</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Listing results */}
            {listingResults.length > 0 && (
              <div>
                <p style={{
                  textTransform: "uppercase",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "rgba(18,18,20,0.4)",
                  letterSpacing: "0.06em",
                  marginBottom: 16,
                }}>
                  Listings
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {listingResults.map((listing) => (
                    <Link
                      key={listing.id}
                      to={`/listing/${listing.id}`}
                      className="flex items-center"
                      style={{
                        background: "rgba(18,18,20,0.04)",
                        borderRadius: 16,
                        padding: 12,
                        gap: 12,
                        transition: "transform 0.15s ease",
                      }}
                      onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
                      onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    >
                      <div style={{ width: 48, height: 48, borderRadius: 16, overflow: "hidden", background: "#f0f0f0", flexShrink: 0 }}>
                        {listing.image_url ? (
                          <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full" style={{ background: "#f0f0f0" }} />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 500, color: "#2B2420", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {listing.title}
                        </p>
                        {listing.location && (
                          <p className="flex items-center" style={{ fontSize: 12, color: "rgba(18,18,20,0.4)", margin: 0, marginTop: 2, gap: 4 }}>
                            <MapPin size={11} strokeWidth={1.8} />
                            {listing.location}
                          </p>
                        )}
                      </div>
                      <ArrowUpRight size={16} strokeWidth={1.8} style={{ color: "rgba(18,18,20,0.3)", flexShrink: 0 }} />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Category section label when both results exist */}
            {listingResults.length > 0 && filteredCategories.length > 0 && (
              <p style={{
                textTransform: "uppercase",
                fontSize: 12,
                fontWeight: 500,
                color: "rgba(18,18,20,0.4)",
                letterSpacing: "0.06em",
                marginBottom: -8,
              }}>
                Categories
              </p>
            )}

            {/* Category cards */}
            {filteredCategories.map((cat) => {
              const count = listingCounts?.[cat.id] || 0;
              return (
                <Link
                  key={cat.id}
                  to={`/category/${cat.id}`}
                  className="block"
                  style={{ transition: "transform 0.15s ease" }}
                  onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
                  onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <div style={{ width: "100%", aspectRatio: "16/10", borderRadius: 16, overflow: "hidden", background: "#f0f0f0" }}>
                    {cat.image_url ? (
                      <img src={cat.image_url} alt={cat.title} className="w-full h-full object-cover object-center" />
                    ) : (
                      <div className="w-full h-full" style={{ background: "#f0f0f0" }} />
                    )}
                  </div>
                  <div className="flex items-center" style={{ marginTop: 10 }}>
                    <span style={{
                      textTransform: "uppercase",
                      fontSize: 20,
                      fontWeight: 500,
                      color: "#2B2420",
                      letterSpacing: "0.01em",
                      lineHeight: 1.2,
                    }}>
                      {cat.title}
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 400, color: "rgba(18,18,20,0.4)", marginLeft: 6 }}>({count})</span>
                    <ArrowUpRight size={22} strokeWidth={2.5} style={{ color: "rgba(18,18,20,0.3)", marginLeft: "auto" }} />
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

export default Categories;
