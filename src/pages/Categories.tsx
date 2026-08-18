import { useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, MapPin, AlertTriangle, Phone, Siren, ChevronRight, ArrowUpRight, ArrowLeft, LayoutGrid, List, X, Tag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/PageHeader";
import { getDisplayTitle, noTitleCaseProps } from "@/lib/displayTitle";
import { pinFeatured } from "@/lib/featuredFirst";
import { isAnyOpenNow } from "@/lib/openHours";
import { useAuth } from "@/hooks/useAuth";
import { useRequireAuth } from "@/hooks/useGuestAuth";
import Seo from "@/components/Seo";
import { MUTED, type , MUTED as TOKEN_MUTED} from "@/lib/type";


const FONT_BODY = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const COLORS = {
  bg: "#E6E0CC",
  card: "#FFFFFF",
  ink: "#1A1A1A",
  muted: MUTED,
  divider: "rgba(2,2,2,0.08)",
  emergencyBg: "#FBE6E6",
  emergencyInk: "#C0392B",
  dark: "#423324",
  toggleTrack: "#FFFFFF",
  chipBorder: "rgba(26,26,26,0.10)",
  eyebrow: "#715A3D",
};

/**
 * Quick-filter result rows are a fixed height so a card with three lines of
 * meta sits flush beside one with a single line. It matches the 88px thumbnail,
 * which is what sets the row's floor anyway.
 */
const QUICK_RESULT_HEIGHT = 88;

const QUICK_FILTERS = ["Open Now", "Saved", "Child Friendly", "Pet Friendly"];

type ViewMode = "grid" | "list";
type SortMode = "default" | "count" | "az";

const Categories = () => {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortMode, setSortMode] = useState<SortMode>("default");
  const [activeQuick, setActiveQuick] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const requireAuth = useRequireAuth();
  const fromSearch = !!(location.state as { fromSearch?: boolean } | null)?.fromSearch;

  const hasQuickFilter = (label: string) => activeQuick.includes(label);

  const toggleQuick = (label: string) => {
    if (label === "Saved" && !user) {
      requireAuth("view saved listings");
      return;
    }
    setActiveQuick((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
    );
  };

  const clearQuickFilters = () => setActiveQuick([]);

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

  const { data: savedIds } = useQuery({
    queryKey: ["user-saved-listings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favourites" as any)
        .select("item_id")
        .eq("user_id", user!.id)
        .eq("item_type", "listing");
      if (error) throw error;
      return new Set((data as any[]).map((r) => r.item_id as string));
    },
    enabled: !!user,
  });

  const savedActive = activeQuick.includes("Saved");
  // Stable, order-independent signature of the saved set so the query below
  // refetches when the user saves/unsaves while the filter is open.
  const savedListArray = useMemo(
    () => (savedIds ? Array.from(savedIds).sort() : []),
    [savedIds]
  );

  const { data: filteredListings, isLoading: filteredLoading } = useQuery({
    queryKey: ["explore-quick-filter-listings", savedActive, savedActive ? savedListArray : "all"],
    queryFn: async () => {
      const cols =
        "id, title, title_override, image_url, location, category_id, opening_hours, opening_hours_label, additional_hours, child_friendly, good_for_kids, pets_allowed";

      // When "Saved" is active the result can only ever be a subset of the
      // user's saved listings, so fetch those rows directly by id. This is
      // bounded and — unlike a top-N featured slice — never drops a saved
      // listing just because it isn't near the top of the full list.
      if (savedActive) {
        if (savedListArray.length === 0) return [];
        const CHUNK = 200; // keep each `in(...)` URL comfortably short
        const rows: any[] = [];
        for (let i = 0; i < savedListArray.length; i += CHUNK) {
          const chunk = savedListArray.slice(i, i + CHUNK);
          const { data, error } = await supabase.from("listings").select(cols).in("id", chunk);
          if (error) throw error;
          rows.push(...(data || []));
        }
        return rows;
      }

      // Otherwise scan the full listing set (paginated) so Open Now / Kid
      // Friendly / Pet Friendly cover every listing, not just the first page.
      const PAGE = 1000;
      const all: any[] = [];
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await supabase
          .from("listings")
          .select(cols)
          .order("is_featured", { ascending: false })
          .range(from, from + PAGE - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        all.push(...data);
        if (data.length < PAGE) break;
      }
      return all;
    },
    // Wait for the saved set to load before running the "Saved" branch so we
    // never fetch against a half-loaded id list.
    enabled: activeQuick.length > 0 && (!savedActive || savedIds !== undefined),
  });

  const quickFilteredResults = useMemo(() => {
    if (!filteredListings) return [];
    return filteredListings.filter((l: any) => {
      if (hasQuickFilter("Open Now") && !isAnyOpenNow(l)) return false;
      if (hasQuickFilter("Saved") && !(savedIds?.has(l.id))) return false;
      if (hasQuickFilter("Kid Friendly") && !l.child_friendly && !l.good_for_kids) return false;
      if (hasQuickFilter("Pet Friendly") && !l.pets_allowed) return false;
      return true;
    });
  }, [filteredListings, activeQuick, savedIds]);

  // Category names for the quick-filter result cards. A listing can sit in
  // several categories (junction rows) on top of its legacy `category_id`, so
  // both sources feed the same map. Only runs once a quick filter is open.
  const { data: categoryIndex } = useQuery({
    queryKey: ["explore-listing-category-titles"],
    queryFn: async () => {
      const PAGE = 1000;
      const junctions: { listing_id: string; category_id: string }[] = [];
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await supabase
          .from("listing_categories")
          .select("listing_id, category_id")
          .range(from, from + PAGE - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        junctions.push(...(data as any[]));
        if (data.length < PAGE) break;
      }

      // Quick categories are excluded from the Explore grid, so they'd name a
      // category the reader can't actually browse to from here.
      const { data: cats, error: catError } = await supabase
        .from("categories")
        .select("id, title")
        .eq("is_quick_category", false)
        .order("sort_order");
      if (catError) throw catError;

      const titleById = new Map<string, string>();
      const rankById = new Map<string, number>();
      (cats || []).forEach((c: any, i: number) => {
        titleById.set(c.id, c.title);
        rankById.set(c.id, i);
      });

      const byListing = new Map<string, string[]>();
      junctions.forEach((r) => {
        if (!r.listing_id || !r.category_id || !titleById.has(r.category_id)) return;
        const ids = byListing.get(r.listing_id) || [];
        if (!ids.includes(r.category_id)) ids.push(r.category_id);
        byListing.set(r.listing_id, ids);
      });

      return { titleById, rankById, byListing };
    },
    enabled: activeQuick.length > 0,
  });

  // Category titles for one listing, in the same order the Explore grid lists
  // them so a listing always reads its categories the same way round.
  const categoryTitlesFor = (listing: any): string[] => {
    if (!categoryIndex) return [];
    const ids = [...(categoryIndex.byListing.get(listing.id) || [])];
    if (listing.category_id && !ids.includes(listing.category_id)) ids.push(listing.category_id);
    return ids
      .filter((cid) => categoryIndex.titleById.has(cid))
      .sort((a, b) => (categoryIndex.rankById.get(a) ?? 0) - (categoryIndex.rankById.get(b) ?? 0))
      .map((cid) => categoryIndex.titleById.get(cid)!);
  };

  // Treat "waiting for the saved set" as loading too, otherwise the empty
  // state flashes before the saved ids resolve.
  const quickLoading = filteredLoading || (savedActive && savedIds === undefined);

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
        .select("id, title, title_override, image_url, location, category_id, is_featured")
        .ilike("title", `%${escaped}%`)
        .limit(20);

      const catDirectQ = matchingCategoryIds.length
        ? supabase
            .from("listings")
            .select("id, title, title_override, image_url, location, category_id, is_featured")
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
          .select("id, title, title_override, image_url, location, category_id, is_featured")
          .in("id", missingIds);
        (extra || []).forEach((l) => map.set(l.id, l));
      }
      // Featured listings head up the results, whatever they matched on.
      return pinFeatured(Array.from(map.values())).slice(0, 30);
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

  const sortedGrid = useMemo(() => {
    const arr = [...gridCategories];
    if (sortMode === "default") {
      return arr;
    }
    if (sortMode === "az") {
      arr.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      arr.sort((a, b) => (listingCounts?.[b.id] || 0) - (listingCounts?.[a.id] || 0));
    }
    return arr;
  }, [gridCategories, sortMode, listingCounts]);

  const totalListings = useMemo(
    () => sortedGrid.reduce((sum, c) => sum + (listingCounts?.[c.id] || 0), 0),
    [sortedGrid, listingCounts]
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
      <Seo
        title="Explore Hoedspruit — Categories"
        description="Browse every category of local listings in Hoedspruit: places to eat, stay, shop, things to do, services and more."
        path="/categories"
      />
      <style>{`.cats-scroll::-webkit-scrollbar{display:none}.cats-scroll{scrollbar-width:none}`}</style>
      {/* Top bar: centered title */}
      <PageHeader
        title="Explore"
        showBack={false}
        left={
          fromSearch ? (
            <button
              onClick={() => navigate("/search")}
              aria-label="Back to search"
              style={{
                width: 40,
                height: 40,
                borderRadius: 999,
                background: "#FFFFFF",
                border: "1px solid rgba(0,0,0,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={18} strokeWidth={1.8} color="#1A1A1A" />
            </button>
          ) : null
        }
      />

      {/* Inline search input */}
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
            type="text"
            placeholder="Search categories, places or services"
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

      {/* Listing search results */}
      {listingResults.length > 0 && (
        <div style={{ padding: "20px 20px 0", display: "flex", flexDirection: "column", gap: 8 }}>
          {listingResults.map((listing) => (
            <Link
              key={listing.id}
              to={`/listing/${listing.id}`}
              style={{
                display: "flex",
                alignItems: "stretch",
                background: COLORS.card,
                borderRadius: 16,
                overflow: "hidden",
                textDecoration: "none",
              }}
            >
              <div style={{ width: 88, alignSelf: "stretch", background: "#e6e0d2", flexShrink: 0 }}>
                {listing.image_url && (
                  <img
                    src={listing.image_url}
                    alt={listing.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 12, padding: "12px 14px 12px 14px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p {...noTitleCaseProps(listing)} style={{ ...type.cardTitleM, margin: 0, wordBreak: "break-word" }}>
                    {getDisplayTitle(listing)}
                  </p>
                  {listing.location && (
                    <p style={{ ...type.meta, display: "flex", alignItems: "center", margin: 0, marginTop: 2, gap: 4 }}>
                      <MapPin size={11} strokeWidth={1.8} />
                      {listing.location}
                    </p>
                  )}
                </div>
                <ArrowUpRight size={18} color="#1A1A1A" style={{ flexShrink: 0 }} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Emergency Services */}
      {featuredCategories.length > 0 && (
        <div style={{ padding: "18px 20px 0", display: "flex", flexDirection: "column", gap: 12 }}>
          {featuredCategories.map((featured) => (
            <Link
              key={featured.id}
              to={`/category/${featured.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                background: COLORS.card,
                borderRadius: 16,
                padding: "14px 16px",
                textDecoration: "none",
                border: "none",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 999,
                  background: COLORS.emergencyInk,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Siren size={24} strokeWidth={1.8} color="#FFFFFF" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    fontFamily: FONT_BODY,
                    fontWeight: 700,
                    fontSize: 17,
                    color: COLORS.ink,
                  }}
                >
                  {featured.title}
                </span>
              </div>
              <ArrowUpRight size={18} color="#1A1A1A" strokeWidth={1.5} style={{ flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      )}

      {/* Quick filters */}
      <div style={{ padding: "22px 0 0" }}>
        <p
          style={{
            padding: "0 20px",
            margin: "0 0 12px",
            ...type.eyebrow,
            textTransform: "uppercase",
            color: TOKEN_MUTED,
          }}
        >
          Quick Filters
        </p>
        <div className="cats-scroll" style={{ overflowX: "auto", paddingLeft: 20 }}>
          <div style={{ display: "flex", gap: 8, paddingRight: 20 }}>
            {QUICK_FILTERS.map((label) => {
              const active = activeQuick.includes(label);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleQuick(label)}
                  style={{
                    flexShrink: 0,
                    height: 32,
                    padding: "0 14px",
                    borderRadius: 999,
                    background: active ? COLORS.dark : COLORS.card,
                    color: active ? "#FFFFFF" : COLORS.ink,
                    border: active ? "none" : `1px solid ${COLORS.chipBorder}`,
                    fontFamily: FONT_BODY,
                    fontSize: 12,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    transition: "background 150ms ease, color 150ms ease",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick filter results */}
      {activeQuick.length > 0 && (
        <div style={{ padding: "22px 20px 0" }}>
          <div
            style={{
              padding: "0 0 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div>
              <h2
                style={{ ...type.sectionTitle, margin: 0 }}
              >
                {activeQuick.join(" + ")}
              </h2>
              <p style={{ ...type.meta, margin: "4px 0 0" }}>
                {quickLoading
                  ? "Loading..."
                  : `${quickFilteredResults.length} ${quickFilteredResults.length === 1 ? "Result" : "Results"}`}
              </p>
            </div>
            <button
              type="button"
              onClick={clearQuickFilters}
              style={{
                height: 32,
                padding: "0 12px",
                borderRadius: 999,
                background: "transparent",
                color: "#715A3D",
                border: `1px solid ${COLORS.chipBorder}`,
                fontFamily: FONT_BODY,
                fontSize: 12,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                cursor: "pointer",
              }}
            >
              <X size={14} strokeWidth={2} />
              Clear
            </button>
          </div>

          {quickLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} style={{ width: "100%", height: QUICK_RESULT_HEIGHT, borderRadius: 16, background: "rgba(2,2,2,0.06)" }} />
              ))}
            </div>
          ) : quickFilteredResults.length === 0 ? (
            <div
              style={{
                background: COLORS.card,
                borderRadius: 16,
                padding: "22px 18px",
                textAlign: "center",
              }}
            >
              <p style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 16, color: COLORS.ink, margin: 0 }}>
                No matches found
              </p>
              <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.muted, margin: "4px 0 0" }}>
                Try a different combination of filters.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {quickFilteredResults.map((listing) => {
                const cardCategories = categoryTitlesFor(listing);
                return (
                <Link
                  key={listing.id}
                  to={`/listing/${listing.id}`}
                  style={{
                    display: "flex",
                    alignItems: "stretch",
                    background: COLORS.card,
                    borderRadius: 16,
                    overflow: "hidden",
                    textDecoration: "none",
                    height: QUICK_RESULT_HEIGHT,
                    minHeight: QUICK_RESULT_HEIGHT,
                    transition: "transform 150ms ease-out",
                  }}
                  onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.99)")}
                  onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <div style={{ width: QUICK_RESULT_HEIGHT, height: QUICK_RESULT_HEIGHT, background: "#e6e0d2", flexShrink: 0 }}>
                    {listing.image_url && (
                      <img
                        src={listing.image_url}
                        alt={listing.title}
                        style={{ width: QUICK_RESULT_HEIGHT, height: QUICK_RESULT_HEIGHT, objectFit: "cover", display: "block" }}
                      />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "flex-start", gap: 12, padding: "11px 14px 12px 14px" }}>
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <p
                        {...noTitleCaseProps(listing)}
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: COLORS.ink,
                          margin: 0,
                          lineHeight: 1.25,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {getDisplayTitle(listing)}
                      </p>
                      <div style={{ minWidth: 0 }}>
                        {cardCategories.length > 0 && (
                          <p
                            style={{
                              display: "flex",
                              alignItems: "center",
                              fontFamily: FONT_BODY,
                              fontSize: 10,
                              fontWeight: 600,
                              letterSpacing: "0.05em",
                              textTransform: "uppercase",
                              color: COLORS.eyebrow,
                              margin: 0,
                              gap: 4,
                              minWidth: 0,
                              lineHeight: 1.3,
                            }}
                          >
                            <Tag size={10} strokeWidth={2} style={{ flexShrink: 0 }} />
                            <span
                              style={{
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                minWidth: 0,
                              }}
                            >
                              {cardCategories.join(" · ")}
                            </span>
                          </p>
                        )}
                        {listing.location && (
                          <p
                            style={{
                              display: "flex",
                              alignItems: "center",
                              fontSize: 12,
                              color: COLORS.muted,
                              margin: 0,
                              marginTop: 3,
                              gap: 4,
                              minWidth: 0,
                            }}
                          >
                            <MapPin size={11} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                            <span
                              style={{
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                minWidth: 0,
                              }}
                            >
                              {listing.location}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                    <ArrowUpRight size={18} color="#1A1A1A" style={{ flexShrink: 0 }} />
                  </div>

                </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* All Categories header + view toggle */}
      {activeQuick.length === 0 && (<>
      <div
        style={{
          padding: "26px 20px 0",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h2
            style={{ ...type.pageTitle, margin: 0 }}
          >
            All Categories
          </h2>
          <p style={{ ...type.meta, margin: "6px 0 0" }}>
            {sortedGrid.length}&nbsp;{sortedGrid.length === 1 ? "Category" : "Categories"} · {totalListings}&nbsp;Listings
          </p>
        </div>

        {/* View toggle */}
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: COLORS.toggleTrack,
            borderRadius: 999,
            padding: 4,
          }}
        >
          {([
            { mode: "grid" as ViewMode, Icon: LayoutGrid, label: "Grid view" },
            { mode: "list" as ViewMode, Icon: List, label: "List view" },
          ]).map(({ mode, Icon, label }) => {
            const active = viewMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                aria-label={label}
                aria-pressed={active}
                style={{
                  width: 40,
                  height: 32,
                  borderRadius: 999,
                  border: "none",
                  background: active ? COLORS.dark : "transparent",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "background 150ms ease",
                }}
              >
                <Icon size={18} strokeWidth={2} color={active ? "#FFFFFF" : COLORS.ink} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Sort toggle */}
      <div style={{ padding: "16px 20px 0", display: "flex", gap: 10 }}>
        {([
          { mode: "default" as SortMode, label: "Default" },
          { mode: "count" as SortMode, label: "Most Listings" },
          { mode: "az" as SortMode, label: "A – Z" },
        ]).map(({ mode, label }) => {
          const active = sortMode === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => setSortMode(mode)}
              style={{
                height: 32,
                padding: "0 14px",
                borderRadius: 999,
                background: active ? COLORS.dark : COLORS.card,
                color: active ? "#FFFFFF" : COLORS.ink,
                border: active ? "none" : `1px solid ${COLORS.chipBorder}`,
                fontFamily: FONT_BODY,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                transition: "background 150ms ease, color 150ms ease",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Categories grid / list */}
      {isLoading ? (
        <div style={{ padding: "18px 20px 0" }}>
          {viewMode === "grid" ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} style={{ width: "100%", aspectRatio: "1 / 1.35", borderRadius: 16, background: "rgba(2,2,2,0.06)" }} />
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} style={{ width: "100%", height: 88, borderRadius: 16, background: "rgba(2,2,2,0.06)" }} />
              ))}
            </div>
          )}
        </div>
      ) : sortedGrid.length === 0 && listingResults.length === 0 ? (
        <div style={{ textAlign: "center", paddingTop: 60, color: COLORS.ink }}>
          <p style={{ ...type.sectionTitle, marginBottom: 6 }}>Nothing here.</p>
          <p style={type.meta}>Try another search term</p>
        </div>
      ) : viewMode === "grid" ? (
        <div style={{ padding: "18px 20px 0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {sortedGrid.map((cat) => {
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
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      aspectRatio: "1 / 1",
                      background: "#e6e0d2",
                      overflow: "hidden",
                    }}
                  >
                    {cat.image_url && (
                      <img
                        src={cat.image_url}
                        alt={cat.title}
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    )}
                  </div>
                  <div style={{ padding: "12px 14px 14px" }}>
                    <p
                      style={{
                        ...type.cardTitleM,
                        color: COLORS.ink,
                        margin: 0,
                        lineHeight: 1.25,
                        minHeight: "2.5em",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {cat.title}
                    </p>
                    <p style={{ ...type.meta, margin: "3px 0 0" }}>
                      {count}&nbsp;{count === 1 ? "Listing" : "Listings"}
                    </p>
                  </div>

                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ padding: "18px 20px 0", display: "flex", flexDirection: "column", gap: 12 }}>
          {sortedGrid.map((cat) => {
            const count = listingCounts?.[cat.id] || 0;
            return (
              <Link
                key={cat.id}
                to={`/category/${cat.id}`}
                style={{
                  display: "flex",
                  alignItems: "stretch",
                  height: 96,
                  background: COLORS.card,
                  borderRadius: 16,
                  padding: 0,
                  textDecoration: "none",
                  transition: "transform 150ms ease-out",
                  overflow: "hidden",
                }}
                onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.99)")}
                onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                <div
                  style={{
                    width: 96,
                    height: 96,
                    overflow: "hidden",
                    background: "#e6e0d2",
                    flexShrink: 0,
                  }}
                >
                  {cat.image_url && (
                    <img
                      src={cat.image_url}
                      alt={cat.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 14, padding: 14 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        ...type.cardTitleM,
                        color: COLORS.ink,
                        margin: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {cat.title}
                    </p>
                    <p
                      style={{
                        margin: "3px 0 0",
                        ...type.meta,
                        color: COLORS.muted,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {count}&nbsp;{count === 1 ? "Listing" : "Listings"}
                    </p>
                  </div>
                  <ArrowUpRight size={20} color="#715A3D" strokeWidth={1.8} style={{ flexShrink: 0 }} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
      </>)}
    </div>
  );
};

export default Categories;
