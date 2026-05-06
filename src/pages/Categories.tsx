import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, ArrowUpRight, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const FONT_DISPLAY = "'Helvetica World', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const FONT_BODY = "'Helvetica Neue', 'Helvetica World', Helvetica, Arial, sans-serif";

const COLORS = {
  bg: "#EBEBEB",
  card: "#FFFFFF",
  text: "#0A0A0A",
  muted: "#8A8480",
};

// Editorial aspect ratios for masonry interlock (in title order)
const CARD_ASPECTS: Record<string, string> = {
  "Restaurants & Cafés": "3 / 4",
  "Activities & Adventures": "1 / 1",
  "Accommodation": "4 / 5",
  "Health & Medical": "5 / 4",
  "Transport": "1 / 1",
  "Trades & Services": "3 / 4",
  "Community": "1 / 1",
  "Financial & Legal": "4 / 5",
  "Wellness & Beauty": "3 / 4",
  "Education": "1 / 1",
  "Property": "5 / 4",
};

const FALLBACK_ASPECTS = ["3 / 4", "1 / 1", "4 / 5", "5 / 4"];

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

  const { data: listingCounts } = useQuery({
    queryKey: ["listing-counts-by-category"],
    queryFn: async () => {
      // Paginated fetch to bypass Supabase's default 1000-row cap
      const fetchAllRange = async <T,>(
        fetcher: (from: number, to: number) => Promise<{ data: T[] | null; error: any }>
      ): Promise<T[]> => {
        const PAGE = 1000;
        const all: T[] = [];
        for (let from = 0; ; from += PAGE) {
          const to = from + PAGE - 1;
          const { data, error } = await fetcher(from, to);
          if (error) throw error;
          if (!data || data.length === 0) break;
          all.push(...data);
          if (data.length < PAGE) break;
        }
        return all;
      };

      const [junctions, listingRows] = await Promise.all([
        fetchAllRange<{ listing_id: string; category_id: string }>(async (from, to) =>
          await supabase.from("listing_categories").select("listing_id, category_id").range(from, to)
        ),
        fetchAllRange<{ id: string; category_id: string | null }>(async (from, to) =>
          await supabase.from("listings").select("id, category_id").range(from, to)
        ),
      ]);

      // Dedupe per (listing_id, category_id) across both sources
      const pairs = new Set<string>();
      junctions.forEach((r) => {
        if (r.listing_id && r.category_id) pairs.add(`${r.listing_id}::${r.category_id}`);
      });
      listingRows.forEach((r) => {
        if (r.id && r.category_id) pairs.add(`${r.id}::${r.category_id}`);
      });

      const counts: Record<string, number> = {};
      pairs.forEach((key) => {
        const cat = key.split("::")[1];
        counts[cat] = (counts[cat] || 0) + 1;
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

  const totalListings = useMemo(() => {
    if (!listingCounts) return 0;
    return visibleCategories.reduce((sum, c) => sum + (listingCounts[c.id] || 0), 0);
  }, [listingCounts, visibleCategories]);

  // Featured = first visible category
  const featured = visibleCategories[0];
  const gridCategories = visibleCategories.slice(1);

  return (
    <div
      style={{
        minHeight: "100dvh",
        backgroundColor: "#555340",
        fontFamily: FONT_BODY,
        paddingTop: "calc(env(safe-area-inset-top) + 24px)",
        paddingLeft: 24,
        paddingRight: 24,
        paddingBottom: 140,
      }}
    >
      {/* Page title */}
      <h1
        style={{
          fontFamily: FONT_DISPLAY,
          fontWeight: 500,
          fontSize: 40,
          lineHeight: "40px",
          letterSpacing: "-1.2px",
          color: COLORS.text,
          margin: 0,
          marginBottom: 20,
        }}
      >
        Explore
      </h1>

      {/* Search pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: 48,
          background: COLORS.card,
          borderRadius: 999,
          padding: "0 20px",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <Search size={20} strokeWidth={1.5} style={{ color: COLORS.muted, flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search categories and listings"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            fontFamily: FONT_BODY,
            fontSize: 16,
            fontWeight: 400,
            color: COLORS.text,
          }}
          className="placeholder:text-[#8A8480]"
        />
      </div>

      {/* Search results */}
      {listingResults.length > 0 && (
        <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <p
            style={{
              fontFamily: FONT_BODY,
              fontSize: 12,
              fontWeight: 400,
              color: COLORS.muted,
              letterSpacing: "0.24px",
              margin: 0,
            }}
          >
            Listings
          </p>
          {listingResults.map((listing) => (
            <Link
              key={listing.id}
              to={`/listing/${listing.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                background: COLORS.card,
                borderRadius: 16,
                padding: 12,
                gap: 12,
                textDecoration: "none",
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 12, overflow: "hidden", background: "#f0f0f0", flexShrink: 0 }}>
                {listing.image_url && (
                  <img src={listing.image_url} alt={listing.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 400, color: COLORS.text, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {listing.title}
                </p>
                {listing.location && (
                  <p style={{ display: "flex", alignItems: "center", fontSize: 12, color: COLORS.muted, margin: 0, marginTop: 2, gap: 4 }}>
                    <MapPin size={11} strokeWidth={1.8} />
                    {listing.location}
                  </p>
                )}
              </div>
              <ArrowUpRight size={16} strokeWidth={1.8} style={{ color: COLORS.muted, flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      )}

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Skeleton style={{ width: "100%", aspectRatio: "16 / 10", borderRadius: 24, background: "#e0e0e0" }} />
          <div style={{ columnCount: 2, columnGap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={i}
                style={{
                  width: "100%",
                  aspectRatio: FALLBACK_ASPECTS[i % FALLBACK_ASPECTS.length],
                  borderRadius: 24,
                  background: "#e0e0e0",
                  marginBottom: 16,
                  display: "inline-block",
                  breakInside: "avoid",
                }}
              />
            ))}
          </div>
        </div>
      ) : visibleCategories.length === 0 && listingResults.length === 0 ? (
        <div style={{ textAlign: "center", paddingTop: 80 }}>
          <p style={{ fontWeight: 400, fontSize: 18, color: COLORS.text, marginBottom: 4 }}>No results found</p>
          <p style={{ fontSize: 14, color: COLORS.muted }}>Try another search term</p>
        </div>
      ) : (
        <>
          {/* Featured hero card */}
          {featured && (
            <Link
              to={`/category/${featured.id}`}
              style={{
                display: "block",
                background: COLORS.card,
                borderRadius: 24,
                overflow: "hidden",
                marginBottom: 16,
                textDecoration: "none",
                transition: "transform 150ms ease-out",
              }}
              onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
              onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 10", background: "#f0f0f0", overflow: "hidden" }}>
                {featured.image_url && (
                  <img
                    src={featured.image_url}
                    alt={featured.title}
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                  />
                )}
                <div
                  style={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.95)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ArrowUpRight size={20} strokeWidth={1.5} color={COLORS.text} />
                </div>
              </div>
              <div style={{ padding: 20 }}>
                <h2
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontWeight: 500,
                    fontSize: 35,
                    lineHeight: "35px",
                    letterSpacing: "-1.05px",
                    color: COLORS.text,
                    margin: 0,
                    marginBottom: 8,
                  }}
                >
                  {featured.title}
                </h2>
                <p
                  style={{
                    fontFamily: FONT_BODY,
                    fontSize: 13,
                    fontWeight: 400,
                    lineHeight: "18.2px",
                    letterSpacing: "0.13px",
                    color: COLORS.muted,
                    margin: 0,
                  }}
                >
                  {listingCounts?.[featured.id] || 0} Listings
                </p>
              </div>
            </Link>
          )}

          {/* Masonry grid */}
          <div style={{ columnCount: 2, columnGap: 16 }}>
            {gridCategories.map((cat, idx) => {
              const count = listingCounts?.[cat.id] || 0;
              const aspect = CARD_ASPECTS[cat.title] || FALLBACK_ASPECTS[idx % FALLBACK_ASPECTS.length];
              return (
                <Link
                  key={cat.id}
                  to={`/category/${cat.id}`}
                  style={{
                    display: "inline-block",
                    width: "100%",
                    background: COLORS.card,
                    borderRadius: 24,
                    overflow: "hidden",
                    marginBottom: 16,
                    breakInside: "avoid",
                    textDecoration: "none",
                    transition: "transform 150ms ease-out",
                  }}
                  onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
                  onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <div style={{ position: "relative", width: "100%", aspectRatio: aspect, background: "#f0f0f0", overflow: "hidden" }}>
                    {cat.image_url && (
                      <img
                        src={cat.image_url}
                        alt={cat.title}
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    )}
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        width: 32,
                        height: 32,
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.95)",
                        backdropFilter: "blur(8px)",
                        WebkitBackdropFilter: "blur(8px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ArrowUpRight size={16} strokeWidth={1.75} color={COLORS.text} />
                    </div>
                  </div>
                  <div style={{ paddingTop: 14, paddingLeft: 16, paddingRight: 16, paddingBottom: 16 }}>
                    <p
                      style={{
                        fontFamily: FONT_BODY,
                        fontSize: 18,
                        fontWeight: 400,
                        lineHeight: "21.6px",
                        letterSpacing: "-0.18px",
                        color: COLORS.text,
                        margin: 0,
                      }}
                    >
                      {cat.title}
                    </p>
                    <p
                      style={{
                        fontFamily: FONT_BODY,
                        fontSize: 12,
                        fontWeight: 400,
                        lineHeight: "15.6px",
                        letterSpacing: "0.12px",
                        color: COLORS.muted,
                        margin: 0,
                        marginTop: 4,
                      }}
                    >
                      {count} Listings
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default Categories;
