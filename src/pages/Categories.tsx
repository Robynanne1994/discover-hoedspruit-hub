import { useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, MapPin, AlertTriangle, ChevronRight, X, ArrowUpRight, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { getDisplayTitle, noTitleCaseProps } from "@/lib/displayTitle";
import PageHeader from "@/components/PageHeader";

const FONT_BODY = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const COLORS = {
  bg: "#E6E0CC",
  card: "#FFFFFF",
  ink: "#020202",
  muted: "#9A9A92",
  divider: "rgba(2,2,2,0.08)",
  emergencyBg: "#FBE6E6",
  emergencyInk: "#C0392B",
};

const Categories = () => {
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const fromSearch = !!(location.state as { fromSearch?: boolean } | null)?.fromSearch;

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

  const matchingCategoryIds = useMemo(() => {
    if (!categories || !debouncedSearch) return [];
    const q = debouncedSearch.toLowerCase();
    return categories.filter((c) => c.title.toLowerCase().includes(q)).map((c) => c.id);
  }, [categories, debouncedSearch]);

  const { data: searchedListings } = useQuery({
    queryKey: ["explore-listing-search", debouncedSearch, matchingCategoryIds],
    queryFn: async () => {
      if (!debouncedSearch) return [];
      const escaped = debouncedSearch.replace(/[%,]/g, " ");
      const titleQ = supabase
        .from("listings")
        .select("id, title, title_override, image_url, location, category_id")
        .ilike("title", `%${escaped}%`)
        .limit(20);

      const catDirectQ = matchingCategoryIds.length
        ? supabase
            .from("listings")
            .select("id, title, title_override, image_url, location, category_id")
            .in("category_id", matchingCategoryIds)
            .limit(50)
        : null;

      const junctionQ = matchingCategoryIds.length
        ? supabase
            .from("listing_categories")
            .select("listing_id")
            .in("category_id", matchingCategoryIds)
            .limit(200)
        : null;

      const [titleRes, catRes, juncRes] = await Promise.all([titleQ, catDirectQ, junctionQ]);
      if (titleRes.error) throw titleRes.error;

      const map = new Map<string, any>();
      (titleRes.data || []).forEach((l) => map.set(l.id, l));
      (catRes?.data || []).forEach((l) => map.set(l.id, l));

      const junctionIds = (juncRes?.data || []).map((r: any) => r.listing_id).filter(Boolean);
      const missingIds = junctionIds.filter((id) => !map.has(id));
      if (missingIds.length) {
        const { data: extra } = await supabase
          .from("listings")
          .select("id, title, title_override, image_url, location, category_id")
          .in("id", missingIds);
        (extra || []).forEach((l) => map.set(l.id, l));
      }
      return Array.from(map.values()).slice(0, 30);
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

  const FEATURED_TITLES = ["Emergency Services"];
  const normalizeTitle = (t: string) => t.trim().toLowerCase();
  const featuredSet = new Set(FEATURED_TITLES.map(normalizeTitle));
  const featuredCategories = useMemo(() => {
    const matched = visibleCategories.filter((c) => featuredSet.has(normalizeTitle(c.title)));
    const order = FEATURED_TITLES.map(normalizeTitle);
    return matched.sort(
      (a, b) => order.indexOf(normalizeTitle(a.title)) - order.indexOf(normalizeTitle(b.title))
    );
  }, [visibleCategories]);
  const gridCategories = useMemo(
    () => visibleCategories.filter((c) => !featuredSet.has(normalizeTitle(c.title))),
    [visibleCategories]
  );

  return (
    <div
      style={{
        minHeight: "100dvh",
        backgroundColor: COLORS.bg,
        fontFamily: FONT_BODY,
        paddingBottom: 140,
      }}
    >
      <PageHeader
        title="Explore"
        showBack={fromSearch}
        onBack={fromSearch ? () => navigate("/search") : undefined}
        rightIcons={[
          {
            key: "search",
            label: searchOpen ? "Close search" : "Open search",
            onClick: () => setSearchOpen((v) => !v),
            icon: searchOpen ? <X size={22} strokeWidth={1.8} /> : <Search size={22} strokeWidth={1.8} />,
          },
        ]}
      />

      {/* Inline search input */}
      {searchOpen && (
        <div style={{ padding: "16px 20px 0" }}>
          <div
            style={{
              height: 44,
              background: "#FFFFFF",
              borderRadius: 999,
              padding: "0 18px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Search size={16} strokeWidth={1.8} color={COLORS.ink} />
            <input
              autoFocus
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
                color: COLORS.ink,
              }}
            />
          </div>
        </div>
      )}

      {/* Listing search results */}
      {listingResults.length > 0 && (
        <div style={{ padding: "20px 20px 0", display: "flex", flexDirection: "column", gap: 8 }}>
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
              <div style={{ width: 48, height: 48, borderRadius: 12, overflow: "hidden", background: "#e6e0d2", flexShrink: 0 }}>
                {listing.image_url && (
                  <img src={listing.image_url} alt={listing.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p {...noTitleCaseProps(listing)} style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {getDisplayTitle(listing)}
                </p>
                {listing.location && (
                  <p style={{ display: "flex", alignItems: "center", fontSize: 12, color: COLORS.muted, margin: 0, marginTop: 2, gap: 4 }}>
                    <MapPin size={11} strokeWidth={1.8} />
                    {listing.location}
                  </p>
                )}
              </div>
              <ChevronRight size={16} color={COLORS.muted} />
            </Link>
          ))}
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: "28px 20px 0", display: "flex", flexDirection: "column", gap: 20 }}>
          <Skeleton style={{ width: "100%", height: 72, borderRadius: 16, background: "rgba(2,2,2,0.06)" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} style={{ width: "100%", aspectRatio: "1 / 1.15", borderRadius: 16, background: "rgba(2,2,2,0.06)" }} />
            ))}
          </div>
        </div>
      ) : visibleCategories.length === 0 && listingResults.length === 0 ? (
        <div style={{ textAlign: "center", paddingTop: 80, color: COLORS.ink }}>
          <p style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 20, marginBottom: 6 }}>Nothing here.</p>
          <p style={{ fontSize: 13, color: COLORS.muted }}>Try another search term</p>
        </div>
      ) : (
        <>
          {/* The essentials */}
          {featuredCategories.length > 0 && (
            <>
              <SectionHead title="The essentials" />
              <div style={{ padding: "0 20px", marginBottom: 28, display: "flex", flexDirection: "column", gap: 12 }}>
                {featuredCategories.map((featured) => (
                  <Link
                    key={featured.id}
                    to={`/category/${featured.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      background: COLORS.emergencyBg,
                      borderRadius: 999,
                      padding: "12px 18px 12px 12px",
                      textDecoration: "none",
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 999,
                        background: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <AlertTriangle size={22} strokeWidth={2} color={COLORS.emergencyInk} />
                    </div>
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <span
                        style={{
                          fontFamily: FONT_BODY,
                          fontWeight: 700,
                          fontSize: 17,
                          color: COLORS.emergencyInk,
                        }}
                      >
                        {featured.title}
                      </span>
                    </div>
                    <ChevronRight size={20} color={COLORS.emergencyInk} strokeWidth={1.6} />
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* Everything else - 2 column grid */}
          {gridCategories.length > 0 && (
            <>
              <SectionHead title="Everything else" />
              <div style={{ padding: "0 20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {gridCategories.map((cat) => {
                    const count = listingCounts?.[cat.id] || 0;
                    return (
                      <Link
                        key={cat.id}
                        to={`/category/${cat.id}`}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          background: COLORS.card,
                          borderRadius: 16,
                          overflow: "hidden",
                          textDecoration: "none",
                          transition: "transform 150ms ease-out",
                        }}
                        onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
                        onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                        onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      >
                        <div style={{ padding: 8 }}>
                          <div
                            style={{
                              position: "relative",
                              width: "100%",
                              aspectRatio: "1 / 1",
                              background: "#e6e0d2",
                              overflow: "hidden",
                              borderRadius: 12,
                            }}
                          >
                            {cat.image_url && (
                              <img
                                src={cat.image_url}
                                alt={cat.title}
                                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            )}
                            <span
                              style={{
                                position: "absolute",
                                top: 8,
                                right: 8,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                background: "#FFFFFF",
                                color: COLORS.ink,
                                fontFamily: FONT_BODY,
                                fontSize: 12,
                                fontWeight: 700,
                                lineHeight: 1,
                                padding: "6px 8px 6px 10px",
                                borderRadius: 999,
                              }}
                            >
                              ({count})
                              <ArrowUpRight size={12} strokeWidth={2.4} color={COLORS.ink} />
                            </span>
                          </div>
                        </div>
                        <div
                          style={{
                            padding: "2px 14px 10px",
                          }}
                        >
                          <p
                            style={{
                              fontFamily: FONT_BODY,
                              fontSize: 15,
                              fontWeight: 700,
                              lineHeight: 1.2,
                              color: COLORS.ink,
                              margin: 0,
                            }}
                          >
                            {cat.title}
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

const SectionHead = ({ title }: { title: string }) => (
  <div
    style={{
      padding: "0 20px",
      marginTop: 24,
      marginBottom: 14,
    }}
  >
    <h2
      style={{
        fontFamily: FONT_BODY,
        fontWeight: 700,
        fontSize: 22,
        lineHeight: 1.1,
        color: COLORS.ink,
        margin: 0,
      }}
    >
      {title}
    </h2>
  </div>
);

export default Categories;
