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

  // Hide categories with zero listings
  const visibleCategories = useMemo(
    () => filteredCategories.filter((c) => (listingCounts?.[c.id] || 0) > 0),
    [filteredCategories, listingCounts]
  );

  const renderCategoryCard = (cat: any, flex: number) => {
    const count = listingCounts?.[cat.id] || 0;
    const hasImage = !!cat.image_url;
    return (
      <Link
        key={cat.id}
        to={`/category/${cat.id}`}
        style={{
          flex,
          position: "relative",
          borderRadius: 16,
          overflow: "hidden",
          background: hasImage ? "#f0f0f0" : "#FFFFFF",
          border: hasImage ? "none" : "1px solid rgba(18,18,20,0.06)",
          transition: "transform 0.15s ease",
          display: "block",
          minHeight: 0,
        }}
        onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
        onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        {hasImage && (
          <>
            <img
              src={cat.image_url}
              alt={cat.title}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.05) 100%)",
              }}
            />
          </>
        )}
        <span
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            fontSize: 15,
            fontWeight: 400,
            color: hasImage ? "rgba(255,255,255,0.7)" : "rgba(18,18,20,0.4)",
          }}
        >
          ({count})
        </span>
        <ArrowUpRight
          size={22}
          strokeWidth={2.5}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            color: hasImage ? "rgba(255,255,255,0.65)" : "rgba(18,18,20,0.3)",
          }}
        />
        <div style={{ position: "absolute", bottom: 12, left: 12, right: 12 }}>
          <span
            style={{
              fontSize: 26,
              fontWeight: 400,
              letterSpacing: "0.01em",
              lineHeight: 1,
              whiteSpace: "pre-line",
              color: hasImage ? "#FFFFFF" : "#2B2420",
              display: "block",
            }}
          >
            {cat.title}
          </span>
        </div>
      </Link>
    );
  };

  // Build asymmetric two-column blocks of 5 cards each
  const blocks: any[][] = [];
  for (let i = 0; i < visibleCategories.length; i += 5) {
    blocks.push(visibleCategories.slice(i, i + 5));
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#EBEBEB",
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        paddingTop: 16,
        paddingLeft: 20,
        paddingRight: 20,
      }}
    >
      {/* Back button */}
      <div style={{ marginBottom: 8 }}>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center"
          style={{ gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <ArrowLeft size={24} strokeWidth={1.8} style={{ color: "#020202" }} />
          <span style={{ fontSize: 16, fontWeight: 400, color: "#020202" }}>Back</span>
        </button>
      </div>

      {/* Heading */}
      <div style={{ paddingLeft: 20, paddingRight: 20, marginBottom: 36 }}>
        <h1
          className="font-semibold"
          style={{
            fontFamily: "'Helvetica World', Helvetica, Arial, sans-serif",
            textTransform: "capitalize",
            fontSize: 40,
            lineHeight: 0.95,
            letterSpacing: "-0.02em",
            color: "#020202",
            margin: 0,
          }}
        >
          Explore Hoedspruit
        </h1>
      </div>

      {/* Search bar */}
      <div
        className="flex items-center"
        style={{
          background: "#FFFFFF",
          border: "1px solid rgba(18,18,20,0.1)",
          borderRadius: 14,
          padding: "12px 16px",
          gap: 8,
          marginBottom: 24,
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

      {/* Listing results (search) */}
      {listingResults.length > 0 && (
        <div style={{ marginLeft: -20, marginRight: -20, paddingLeft: 4, paddingRight: 4, marginBottom: 16 }}>
          <p
            style={{
              textTransform: "uppercase",
              fontSize: 12,
              fontWeight: 500,
              color: "rgba(18,18,20,0.4)",
              letterSpacing: "0.06em",
              marginBottom: 12,
              paddingLeft: 20,
            }}
          >
            Listings
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingLeft: 20, paddingRight: 20 }}>
            {listingResults.map((listing) => (
              <Link
                key={listing.id}
                to={`/listing/${listing.id}`}
                className="flex items-center"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(18,18,20,0.06)",
                  borderRadius: 16,
                  padding: 12,
                  gap: 12,
                }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 12, overflow: "hidden", background: "#f0f0f0", flexShrink: 0 }}>
                  {listing.image_url && (
                    <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" />
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

      {/* Category grid (Saved-page asymmetric) */}
      <div style={{ marginLeft: -20, marginRight: -20, paddingLeft: 4, paddingRight: 4, paddingBottom: 84 }}>
        {isLoading ? (
          <div style={{ display: "flex", gap: 4, height: 520 }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
              <Skeleton style={{ flex: 2, borderRadius: 16, background: "#e0e0e0" }} />
              <Skeleton style={{ flex: 1, borderRadius: 16, background: "#e0e0e0" }} />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
              <Skeleton style={{ flex: 1, borderRadius: 16, background: "#e0e0e0" }} />
              <Skeleton style={{ flex: 1, borderRadius: 16, background: "#e0e0e0" }} />
              <Skeleton style={{ flex: 1, borderRadius: 16, background: "#e0e0e0" }} />
            </div>
          </div>
        ) : visibleCategories.length === 0 && listingResults.length === 0 ? (
          <div className="text-center" style={{ paddingTop: 80 }}>
            <p style={{ fontWeight: 500, fontSize: 18, color: "#2B2420", marginBottom: 4 }}>No results found</p>
            <p style={{ fontSize: 14, color: "rgba(18,18,20,0.55)" }}>Try another search term</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {blocks.map((block, blockIdx) => {
              const tallOnLeft = blockIdx % 2 === 0;
              const leftCards = tallOnLeft ? block.slice(0, 2) : block.slice(0, 3);
              const rightCards = tallOnLeft ? block.slice(2, 5) : block.slice(3, 5);
              return (
                <div key={blockIdx} style={{ display: "flex", gap: 4, height: 520 }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                    {tallOnLeft
                      ? leftCards.map((c, idx) => renderCategoryCard(c, idx === 0 ? 2 : 1))
                      : leftCards.map((c) => renderCategoryCard(c, 1))}
                  </div>
                  {rightCards.length > 0 && (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                      {tallOnLeft
                        ? rightCards.map((c) => renderCategoryCard(c, 1))
                        : rightCards.map((c, idx) => renderCategoryCard(c, idx === 0 ? 2 : 1))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;
