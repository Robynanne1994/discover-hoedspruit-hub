import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, MapPin } from "lucide-react";
import GlobalMenu, { GlobalMenuTrigger } from "@/components/GlobalMenu";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const FONT_DISPLAY = "'Playfair Display', Georgia, serif";
const FONT_BODY = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const COLORS = {
  bg: "#5C6446",
  cream: "#EEE8DA",
  ink: "#2A2A24",
  muted: "#6B6A5E",
};

// Aspect ratios per spec
const ASPECTS = {
  tall: "1 / 1.15",
  square: "1 / 1",
  medium: "1 / 0.95",
  short: "1 / 0.7",
} as const;

// Per-category aspect mapping (sensible non-alphabetical order)
const CARD_ASPECTS: Record<string, string> = {
  "Restaurants & Cafés": ASPECTS.tall,
  "Restaurants & Cafes": ASPECTS.tall,
  "Activities & Adventures": ASPECTS.square,
  "Property": ASPECTS.short,
  "Accommodation": ASPECTS.tall,
  "Home & Garden": ASPECTS.medium,
  "Shopping": ASPECTS.square,
  "Auto & Mechanical": ASPECTS.short,
  "Health & Medical": ASPECTS.medium,
  "Trades & Services": ASPECTS.tall,
  "Transport": ASPECTS.short,
  "Wellness & Beauty": ASPECTS.square,
  "Education": ASPECTS.medium,
  "Community": ASPECTS.short,
  "NGOs & Volunteering": ASPECTS.square,
  "Art & Culture": ASPECTS.short,
  "Financial & Legal": ASPECTS.medium,
};
const FALLBACK_ASPECTS = [ASPECTS.tall, ASPECTS.square, ASPECTS.medium, ASPECTS.short];

const ArrowOut = ({ size = 14 }: { size?: number }) => (
  <span
    style={{
      fontFamily: FONT_BODY,
      fontSize: size,
      fontWeight: 400,
      color: COLORS.ink,
      lineHeight: 1,
    }}
  >
    ↗
  </span>
);

const Categories = () => {
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
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

  const visibleCategories = useMemo(
    () => filteredCategories.filter((c) => (listingCounts?.[c.id] || 0) > 0),
    [filteredCategories, listingCounts]
  );

  const FEATURED_TITLES = [
    "Emergency Services",
    "Restaurants & Cafés",
    "Restaurants & Cafes",
    "Accommodation",
    "Shopping",
    "Health & Medical",
  ];
  const normalizeTitle = (t: string) => t.trim().toLowerCase();
  const featuredSet = new Set(FEATURED_TITLES.map(normalizeTitle));
  const featuredCategories = useMemo(() => {
    const matched = visibleCategories.filter((c) => featuredSet.has(normalizeTitle(c.title)));
    // Order them per FEATURED_TITLES (with first available as primary)
    const order = FEATURED_TITLES.map(normalizeTitle);
    return matched.sort(
      (a, b) => order.indexOf(normalizeTitle(a.title)) - order.indexOf(normalizeTitle(b.title))
    );
  }, [visibleCategories]);
  const gridCategories = useMemo(
    () => visibleCategories.filter((c) => !featuredSet.has(normalizeTitle(c.title))),
    [visibleCategories]
  );

  const formatCount = (n: number) => `${n} ${n === 1 ? "Listing" : "Listings"}`;

  return (
    <div
      style={{
        minHeight: "100dvh",
        backgroundColor: COLORS.bg,
        fontFamily: FONT_BODY,
        paddingTop: "calc(env(safe-area-inset-top) + 32px)",
        paddingBottom: 140,
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 10,
          padding: "0 24px",
        }}
      >
        <GlobalMenuTrigger open={menuOpen} onClick={() => setMenuOpen((v) => !v)} />
        <GlobalMenu open={menuOpen} onOpenChange={setMenuOpen} />
      </div>

      {/* Hero block */}
      <div style={{ paddingTop: 24, paddingLeft: 24, paddingRight: 24 }}>
        <div
          style={{
            fontFamily: FONT_BODY,
            fontSize: 12,
            fontWeight: 400,
            letterSpacing: "2.4px",
            textTransform: "uppercase",
            color: "rgba(238, 232, 218, 0.7)",
            marginBottom: 14,
          }}
        >
          BROWSE THE 'HOED
        </div>
        <h1
          style={{
            fontFamily: FONT_DISPLAY,
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 72,
            lineHeight: 0.92,
            letterSpacing: "-2.5px",
            color: COLORS.cream,
            margin: 0,
            marginBottom: 22,
            textTransform: "lowercase",
          }}
        >
          explore.
        </h1>

        {/* Search pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: 52,
            background: "rgba(238, 232, 218, 0.92)",
            borderRadius: 999,
            padding: "0 22px",
            gap: 12,
            marginBottom: 32,
          }}
        >
          <Search size={18} strokeWidth={1.6} style={{ color: COLORS.muted, flexShrink: 0 }} />
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
              fontSize: 14,
              fontWeight: 400,
              color: COLORS.ink,
            }}
            className="placeholder:text-[#6B6A5E]"
          />
        </div>
      </div>

      {/* Listing search results */}
      {listingResults.length > 0 && (
        <div style={{ padding: "0 24px", marginBottom: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          {listingResults.map((listing) => (
            <Link
              key={listing.id}
              to={`/listing/${listing.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                background: COLORS.cream,
                borderRadius: 16,
                padding: 12,
                gap: 12,
                textDecoration: "none",
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 12, overflow: "hidden", background: "#e6e0d2", flexShrink: 0 }}>
                {listing.image_url && (
                  <img src={listing.image_url} alt={listing.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 400, color: COLORS.ink, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {listing.title}
                </p>
                {listing.location && (
                  <p style={{ display: "flex", alignItems: "center", fontSize: 12, color: COLORS.muted, margin: 0, marginTop: 2, gap: 4 }}>
                    <MapPin size={11} strokeWidth={1.8} />
                    {listing.location}
                  </p>
                )}
              </div>
              <ArrowOut size={14} />
            </Link>
          ))}
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 28 }}>
          <Skeleton style={{ width: "100%", aspectRatio: "16 / 11", borderRadius: 24, background: "rgba(238,232,218,0.15)" }} />
          <div style={{ columnCount: 2, columnGap: 14 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={i}
                style={{
                  width: "100%",
                  aspectRatio: FALLBACK_ASPECTS[i % FALLBACK_ASPECTS.length],
                  borderRadius: 20,
                  background: "rgba(238,232,218,0.15)",
                  marginBottom: 14,
                  display: "inline-block",
                  breakInside: "avoid",
                }}
              />
            ))}
          </div>
        </div>
      ) : visibleCategories.length === 0 && listingResults.length === 0 ? (
        <div style={{ textAlign: "center", paddingTop: 80, color: COLORS.cream }}>
          <p style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", fontSize: 28, marginBottom: 8 }}>nothing here.</p>
          <p style={{ fontSize: 13, color: "rgba(238,232,218,0.7)" }}>Try another search term</p>
        </div>
      ) : (
        <>
          {/* In the spotlight */}
          {featured && (
            <>
              <SectionHead title="the essentials" />
              <div style={{ padding: "0 24px", marginBottom: 28 }}>
                <Link
                  to={`/category/${featured.id}`}
                  style={{
                    display: "block",
                    background: COLORS.cream,
                    borderRadius: 24,
                    overflow: "hidden",
                    textDecoration: "none",
                    transition: "transform 150ms ease-out",
                  }}
                  onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
                  onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <div style={{ position: "relative", width: "100%", height: 230, background: "#e6e0d2", overflow: "hidden" }}>
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
                        top: 12,
                        right: 12,
                        width: 38,
                        height: 38,
                        borderRadius: 999,
                        background: COLORS.cream,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ArrowOut size={16} />
                    </div>
                  </div>
                  <div style={{ paddingTop: 24, paddingLeft: 24, paddingRight: 24, paddingBottom: 22 }}>
                    <h2
                      style={{
                        fontFamily: FONT_BODY,
                        fontWeight: 400,
                        fontSize: 34,
                        lineHeight: 1.05,
                        letterSpacing: "-0.6px",
                        color: COLORS.ink,
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
                        color: COLORS.muted,
                        margin: 0,
                      }}
                    >
                      {formatCount(listingCounts?.[featured.id] || 0)}
                    </p>
                  </div>
                </Link>
              </div>
            </>
          )}

          {/* Everything else - masonry */}
          {gridCategories.length > 0 && (
            <>
              <SectionHead
                title="everything else"
                counter={`${gridCategories.length} Categories`}
              />
              <div style={{ padding: "0 24px" }}>
                <div style={{ columnCount: 2, columnGap: 14 }}>
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
                          background: COLORS.cream,
                          borderRadius: 20,
                          overflow: "hidden",
                          marginBottom: 14,
                          breakInside: "avoid",
                          textDecoration: "none",
                          transition: "transform 150ms ease-out",
                        }}
                        onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
                        onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                        onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      >
                        <div style={{ position: "relative", width: "100%", aspectRatio: aspect, background: "#e6e0d2", overflow: "hidden" }}>
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
                              top: 10,
                              right: 10,
                              width: 32,
                              height: 32,
                              borderRadius: 999,
                              background: COLORS.cream,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <ArrowOut size={14} />
                          </div>
                        </div>
                        <div style={{ paddingTop: 16, paddingLeft: 18, paddingRight: 18, paddingBottom: 18 }}>
                          <p
                            style={{
                              fontFamily: FONT_BODY,
                              fontSize: 18,
                              fontWeight: 400,
                              lineHeight: 1.15,
                              letterSpacing: "-0.2px",
                              color: COLORS.ink,
                              margin: 0,
                              marginBottom: 6,
                            }}
                          >
                            {cat.title}
                          </p>
                          <p
                            style={{
                              fontFamily: FONT_BODY,
                              fontSize: 12.5,
                              fontWeight: 400,
                              color: COLORS.muted,
                              margin: 0,
                            }}
                          >
                            {formatCount(count)}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

const SectionHead = ({ title, counter }: { title: string; counter?: string }) => (
  <div
    style={{
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      padding: "0 24px",
      marginTop: 8,
      marginBottom: 16,
    }}
  >
    <h2
      style={{
        fontFamily: FONT_DISPLAY,
        fontStyle: "italic",
        fontWeight: 400,
        fontSize: 30,
        lineHeight: 1,
        letterSpacing: "-0.5px",
        color: COLORS.cream,
        margin: 0,
        textTransform: "lowercase",
      }}
    >
      {title}
    </h2>
    {counter && (
      <span
        style={{
          fontFamily: FONT_BODY,
          fontSize: 11,
          fontWeight: 400,
          letterSpacing: "1.8px",
          textTransform: "uppercase",
          color: "rgba(238, 232, 218, 0.75)",
        }}
      >
        {counter}
      </span>
    )}
  </div>
);

export default Categories;
