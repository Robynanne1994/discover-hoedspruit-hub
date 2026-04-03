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
    <div className="min-h-screen pb-[72px]" style={{ background: "#FFFFFF" }}>
      {/* Back button */}
      <div style={{ paddingTop: 52, paddingLeft: 24, paddingRight: 24, marginBottom: 28 }}>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center"
          style={{ gap: 6 }}
        >
          <ArrowLeft
            size={18}
            strokeWidth={2}
            style={{ color: "rgba(18,18,20,0.5)" }}
          />
          <span
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: "rgba(255,255,255,0.6)",
              letterSpacing: "0.2px",
            }}
          >
            Back
          </span>
        </button>
      </div>

      {/* Heading */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 12 }}>
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            textTransform: "uppercase",
            fontWeight: 900,
            fontSize: 40,
            lineHeight: 1.0,
            letterSpacing: "-0.5px",
            color: "#FFFFFF",
            margin: 0,
          }}
        >
          EXPLORE
          <br />
          HOEDSPRUIT
        </h1>
      </div>

      {/* Subtitle */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 24 }}>
        <p
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontStyle: "italic",
            fontSize: 14,
            color: "rgba(255,255,255,0.5)",
            letterSpacing: "0.2px",
            lineHeight: 1.4,
            margin: 0,
          }}
        >
          Choose your adventure, tailored just for you
        </p>
      </div>

      {/* Search bar */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 32 }}>
        <div
          className="flex items-center"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            padding: "12px 16px",
            gap: 10,
          }}
        >
          <Search
            size={18}
            strokeWidth={2}
            style={{ color: "rgba(255,255,255,0.35)", flexShrink: 0 }}
          />
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
              fontSize: 14,
              color: "#FFFFFF",
              letterSpacing: "0.2px",
            }}
            className="placeholder:text-[rgba(255,255,255,0.3)]"
          />
        </div>
      </div>

      {/* Category cards */}
      <div style={{ paddingLeft: 24, paddingRight: 24 }}>
        {isLoading ? (
          <div className="space-y-7">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={i}
                className="w-full"
                style={{ height: 180, borderRadius: 16, background: "#1a1a1a" }}
              />
            ))}
          </div>
        ) : filteredCategories.length === 0 && listingResults.length === 0 ? (
          <div className="text-center" style={{ paddingTop: 80 }}>
            <p
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 600,
                fontSize: 18,
                color: "#FFFFFF",
                marginBottom: 4,
              }}
            >
              No results found
            </p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
              Try another search term
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {/* Listing results */}
            {listingResults.length > 0 && (
              <div>
                <p
                  style={{
                    textTransform: "uppercase",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.4)",
                    letterSpacing: "1.5px",
                    marginBottom: 14,
                  }}
                >
                  Listings
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {listingResults.map((listing) => (
                    <Link
                      key={listing.id}
                      to={`/listing/${listing.id}`}
                      className="flex items-center active:scale-[0.98] transition-transform duration-150"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        borderRadius: 12,
                        padding: 12,
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 10,
                          overflow: "hidden",
                          background: "#1a1a1a",
                          flexShrink: 0,
                        }}
                      >
                        {listing.image_url ? (
                          <img
                            src={listing.image_url}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full" style={{ background: "#1a1a1a" }} />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: "#FFFFFF",
                            margin: 0,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {listing.title}
                        </p>
                        {listing.location && (
                          <p
                            className="flex items-center"
                            style={{
                              fontSize: 12,
                              color: "rgba(255,255,255,0.4)",
                              margin: 0,
                              marginTop: 2,
                              gap: 4,
                            }}
                          >
                            <MapPin size={11} strokeWidth={2} />
                            {listing.location}
                          </p>
                        )}
                      </div>
                      <ArrowUpRight
                        size={16}
                        strokeWidth={2}
                        style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }}
                      />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Category section label when both results exist */}
            {listingResults.length > 0 && filteredCategories.length > 0 && (
              <p
                style={{
                  textTransform: "uppercase",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.4)",
                  letterSpacing: "1.5px",
                  marginBottom: -14,
                }}
              >
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
                  className="block active:scale-[0.98] transition-transform duration-150"
                >
                  <div
                    style={{
                      width: "100%",
                      height: 180,
                      borderRadius: 16,
                      overflow: "hidden",
                      background: "#1a1a1a",
                    }}
                  >
                    {cat.image_url ? (
                      <img
                        src={cat.image_url}
                        alt={cat.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full" style={{ background: "#1a1a1a" }} />
                    )}
                  </div>
                  <div
                    className="flex items-center justify-between"
                    style={{ paddingTop: 14 }}
                  >
                    <span
                      style={{
                        textTransform: "uppercase",
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#FFFFFF",
                        letterSpacing: "1.5px",
                      }}
                    >
                      {cat.title} ({count})
                    </span>
                    <ArrowUpRight
                      size={18}
                      strokeWidth={2}
                      style={{ color: "#FFFFFF" }}
                    />
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
