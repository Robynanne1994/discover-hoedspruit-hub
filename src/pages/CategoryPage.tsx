import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronDown, SlidersHorizontal, Phone, MessageCircle, MapPin, Globe, Star } from "lucide-react";
import FavouriteButton from "@/components/FavouriteButton";
import BackButton from "@/components/BackButton";
import { isRestaurantCategory, isAccommodationCategory } from "@/lib/categoryFields";
import { Skeleton } from "@/components/ui/skeleton";

const CUISINE_OPTIONS = ["African", "Italian", "Indian", "Asian", "Mexican", "Mediterranean", "American", "Steakhouse", "Seafood", "Pizza", "Sushi", "Vegetarian"];
const VIBE_OPTIONS = ["Casual", "Fine Dining", "Family", "Romantic", "Outdoor", "Live Music", "Sports Bar", "Trendy", "Cozy"];
const MEAL_OPTIONS = ["Breakfast", "Brunch", "Lunch", "Dinner"];
const SEATING_OPTIONS = ["Indoor", "Outdoor", "Both"];

const font = "'Helvetica Neue', 'Helvetica World', Helvetica, Arial, sans-serif";

// Palette
const C = {
  bg: "#EBEBEB",
  card: "#FFFFFF",
  text: "#0A0A0A",
  muted: "#8A8480",
  panel: "#F2EFEC",
  border: "#E8E4DF",
};

const FilterChip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      background: active ? C.text : C.card,
      border: `1px solid ${active ? C.text : C.border}`,
      borderRadius: 9999,
      padding: "8px 14px",
      fontSize: 13,
      fontWeight: 400,
      fontFamily: font,
      color: active ? "#FFFFFF" : C.text,
      cursor: "pointer",
      lineHeight: 1.2,
    }}
  >
    {label}
  </button>
);

type SortKey = "default" | "favourites" | "name" | "rating" | "open_now";

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const isOpenNow = (openingHours: Record<string, string> | null | undefined): boolean => {
  if (!openingHours) return false;
  const now = new Date();
  const todayIdx = now.getDay(); // 0 Sun..6 Sat
  const todayLabel = todayIdx === 0 ? "Sunday" : DAY_LABELS[todayIdx - 1];
  const todayVal = openingHours[todayLabel.toLowerCase()] || "";
  if (!todayVal || /closed/i.test(todayVal)) return false;
  const m = todayVal.match(/(\d{1,2}[:.]?\d{0,2})\s*[-–]\s*(\d{1,2}[:.]?\d{0,2})/);
  if (!m) return false;
  const parse = (s: string) => {
    const [h, mm] = s.replace(".", ":").split(":");
    return parseInt(h, 10) * 60 + (mm ? parseInt(mm, 10) : 0);
  };
  const cur = now.getHours() * 60 + now.getMinutes();
  const o = parse(m[1]);
  let c = parse(m[2]);
  if (c <= o) c += 24 * 60; // crosses midnight
  return cur >= o && cur <= c;
};

const CategoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSubId = searchParams.get("sub");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("default");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showSortMenu) return;
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSortMenu]);
  const [filterCuisine, setFilterCuisine] = useState<string[]>([]);
  const [filterVibe, setFilterVibe] = useState<string[]>([]);
  const [filterMeal, setFilterMeal] = useState<string[]>([]);
  const [filterSeating, setFilterSeating] = useState<string[]>([]);
  const [filterChildFriendly, setFilterChildFriendly] = useState(false);
  const [filterPetFriendly, setFilterPetFriendly] = useState(false);
  const [filterWheelchair, setFilterWheelchair] = useState(false);
  const [filterWifi, setFilterWifi] = useState(false);

  const { data: category } = useQuery({
    queryKey: ["category", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: subcategories } = useQuery({
    queryKey: ["subcategories", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subcategories")
        .select("*")
        .eq("category_id", id!)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: listings, isLoading } = useQuery({
    queryKey: ["listings-by-category", id, activeSubId],
    queryFn: async () => {
      const { data: junctionData, error: jErr } = await supabase
        .from("listing_categories")
        .select("listing_id")
        .eq("category_id", id!);
      if (jErr) throw jErr;
      let listingIds = junctionData.map((r: any) => r.listing_id as string);
      if (listingIds.length === 0) return [];
      if (activeSubId) {
        const { data: subJunction, error: sErr } = await supabase
          .from("listing_subcategories")
          .select("listing_id")
          .eq("subcategory_id", activeSubId);
        if (sErr) throw sErr;
        const subListingIds = new Set(subJunction.map((r: any) => r.listing_id as string));
        listingIds = listingIds.filter((listingId) => subListingIds.has(listingId));
        if (listingIds.length === 0) return [];
      }
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .in("id", listingIds)
        .order("is_featured", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const handleSubFilter = (subId: string | null) => {
    if (subId) setSearchParams({ sub: subId });
    else setSearchParams({});
  };

  const activeFilterCount = [
    activeSubId ? 1 : 0,
    filterCuisine.length > 0 ? 1 : 0,
    filterVibe.length > 0 ? 1 : 0,
    filterMeal.length > 0 ? 1 : 0,
    filterSeating.length > 0 ? 1 : 0,
    filterChildFriendly ? 1 : 0,
    filterPetFriendly ? 1 : 0,
    filterWheelchair ? 1 : 0,
    filterWifi ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const clearAllFilters = () => {
    setSearchParams({});
    setFilterCuisine([]);
    setFilterVibe([]);
    setFilterMeal([]);
    setFilterSeating([]);
    setFilterChildFriendly(false);
    setFilterPetFriendly(false);
    setFilterWheelchair(false);
    setFilterWifi(false);
  };

  const toggleArrayFilter = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const categoryTitle = category?.title || "Category";
  const subtitle = category?.description || "Local cafés, great meals and favourite places to eat in Hoedspruit.";
  const isRestaurant = category ? isRestaurantCategory(category.title) : false;
  const isAccom = category ? isAccommodationCategory(category.title) : false;

  // Split title into two lines (try first space, otherwise keep on one line)
  const titleParts = useMemo(() => {
    const t = categoryTitle.trim();
    const firstSpace = t.indexOf(" ");
    if (firstSpace === -1) return [t];
    return [t.slice(0, firstSpace), t.slice(firstSpace + 1)];
  }, [categoryTitle]);

  const filteredListings = useMemo(() => {
    if (!listings) return [];
    const result = listings.filter((l) => {
      if (filterCuisine.length > 0) {
        const lc = (l.cuisine || []).map((c) => c.toLowerCase());
        if (!filterCuisine.some((c) => lc.includes(c.toLowerCase()))) return false;
      }
      if (filterVibe.length > 0) {
        const lv = (l.vibe || []).map((v) => v.toLowerCase());
        if (!filterVibe.some((v) => lv.includes(v.toLowerCase()))) return false;
      }
      if (filterMeal.length > 0) {
        const lm = (l.meal || []).map((m) => m.toLowerCase());
        if (!filterMeal.some((m) => lm.includes(m.toLowerCase()))) return false;
      }
      if (filterSeating.length > 0) {
        const ls = (l.seating || []).map((s) => s.toLowerCase());
        if (!filterSeating.some((s) => ls.includes(s.toLowerCase()))) return false;
      }
      if (filterChildFriendly && !l.good_for_kids && !l.child_friendly) return false;
      if (filterPetFriendly && !l.pets_allowed) return false;
      if (filterWheelchair && !l.wheelchair_friendly) return false;
      if (filterWifi && !l.has_wifi && !l.has_free_wifi && !l.has_wifi_accom) return false;
      return true;
    });

    if (sortBy === "name") {
      return [...result].sort((a, b) => a.title.localeCompare(b.title));
    }
    if (sortBy === "rating") {
      return [...result].sort((a, b) => (b.google_rating || 0) - (a.google_rating || 0));
    }
    if (sortBy === "open_now") {
      return result.filter((l) => isOpenNow(l.opening_hours as Record<string, string> | null));
    }
    return result;
  }, [listings, filterCuisine, filterVibe, filterMeal, filterSeating, filterChildFriendly, filterPetFriendly, filterWheelchair, filterWifi, sortBy]);

  const sortLabel = sortBy === "default" ? "Default" : sortBy === "favourites" ? "Saved" : sortBy === "name" ? "Name" : sortBy === "open_now" ? "Open Now" : "Rating";
  const count = filteredListings.length;

  // Section eyebrow style for filter panel
  const sectionEyebrow: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 400,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: "0.24px",
    marginBottom: 10,
    fontFamily: font,
  };

  // Secondary action button (icon circle pill)
  const secondaryAction: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 9999,
    padding: "10px 18px",
    fontSize: 13,
    fontWeight: 400,
    fontFamily: font,
    color: C.text,
    textDecoration: "none",
    cursor: "pointer",
    lineHeight: 1,
  };
  const iconCircle: React.CSSProperties = {
    width: 24,
    height: 24,
    borderRadius: 9999,
    background: C.panel,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };
  const primaryCTA: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    background: C.card,
    color: C.text,
    border: `1px solid ${C.border}`,
    borderRadius: 9999,
    padding: "10px 18px",
    fontSize: 13,
    fontWeight: 400,
    fontFamily: font,
    textDecoration: "none",
    cursor: "pointer",
    lineHeight: 1,
  };

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 100, background: C.bg, fontFamily: font, color: C.text }}>
      {/* Top bar — 56px */}
      <div
        style={{
          height: 56,
          paddingLeft: 24,
          paddingRight: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <BackButton />


      </div>

      {/* Title block */}
      <div style={{ paddingTop: 32, paddingLeft: 24, paddingRight: 24 }}>
        <h1
          style={{
            fontFamily: "'Helvetica World', Helvetica, Arial, sans-serif",
            fontWeight: 500,
            fontSize: 40,
            lineHeight: 1,
            letterSpacing: "-0.02em",
            color: C.text,
            margin: 0,
          }}
        >
          {titleParts[0]}
          {titleParts[1] && (
            <>
              <br />
              {titleParts[1]}
            </>
          )}
        </h1>
      </div>

      {/* Filter row */}
      <div
        style={{
          paddingTop: 16,
          paddingBottom: 24,
          paddingLeft: 24,
          paddingRight: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
        }}
      >
        <button
          onClick={() => setShowFilters((v) => !v)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            height: 40,
            padding: "0 16px",
            background: C.card,
            border: "none",
            borderRadius: 9999,
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            cursor: "pointer",
            fontFamily: font,
            fontWeight: 400,
            fontSize: 14,
            lineHeight: "16.8px",
            color: C.text,
          }}
        >
          <SlidersHorizontal size={16} strokeWidth={1.8} color={C.text} />
          <span>Filter</span>
          {activeFilterCount > 0 && (
            <span
              style={{
                background: C.text,
                color: "#FFFFFF",
                borderRadius: 9999,
                minWidth: 18,
                height: 18,
                padding: "0 5px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>

        <div ref={sortRef} style={{ position: "relative" }}>
          <button
            onClick={() => setShowSortMenu((v) => !v)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "transparent",
              border: "none",
              padding: "8px 0",
              cursor: "pointer",
            }}
          >
            <span style={{ fontFamily: font, fontSize: 14, lineHeight: "16.8px", color: C.muted, fontWeight: 400 }}>
              Sort By:{" "}
              <span style={{ color: C.text }}>{sortLabel}</span>
            </span>
            <ChevronDown size={14} strokeWidth={1.75} color={C.text} />
          </button>

          {showSortMenu && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% - 4px)",
                right: 0,
                background: C.panel,
                borderRadius: 16,
                padding: 6,
                zIndex: 20,
                boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                minWidth: 200,
              }}
            >
              {(["default", "open_now", "favourites", "name", "rating"] as SortKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    setSortBy(key);
                    setShowSortMenu(false);
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 12px",
                    background: sortBy === key ? C.card : "transparent",
                    border: "none",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 400,
                    color: C.text,
                    fontFamily: font,
                    cursor: "pointer",
                  }}
                >
                  {key === "default" ? "Default" : key === "open_now" ? "Open Now" : key === "favourites" ? "Saved" : key === "name" ? "Name" : "Rating"}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              style={{
                fontSize: 13,
                fontWeight: 400,
                color: C.muted,
                textDecoration: "underline",
                alignSelf: "flex-start",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: font,
              }}
            >
              Clear all filters
            </button>
          )}

          {subcategories && subcategories.length > 0 && (
            <div>
              <p style={sectionEyebrow}>Category</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <FilterChip label="All" active={!activeSubId} onClick={() => handleSubFilter(null)} />
                {subcategories.map((sub) => (
                  <FilterChip key={sub.id} label={sub.title} active={activeSubId === sub.id} onClick={() => handleSubFilter(sub.id)} />
                ))}
              </div>
            </div>
          )}

          {isRestaurant && (
            <>
              <div>
                <p style={sectionEyebrow}>Cuisine</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {CUISINE_OPTIONS.map((c) => (
                    <FilterChip key={c} label={c} active={filterCuisine.includes(c)} onClick={() => toggleArrayFilter(filterCuisine, c, setFilterCuisine)} />
                  ))}
                </div>
              </div>
              <div>
                <p style={sectionEyebrow}>Vibe</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {VIBE_OPTIONS.map((v) => (
                    <FilterChip key={v} label={v} active={filterVibe.includes(v)} onClick={() => toggleArrayFilter(filterVibe, v, setFilterVibe)} />
                  ))}
                </div>
              </div>
              <div>
                <p style={sectionEyebrow}>Meal</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {MEAL_OPTIONS.map((m) => (
                    <FilterChip key={m} label={m} active={filterMeal.includes(m)} onClick={() => toggleArrayFilter(filterMeal, m, setFilterMeal)} />
                  ))}
                </div>
              </div>
              <div>
                <p style={sectionEyebrow}>Seating</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {SEATING_OPTIONS.map((s) => (
                    <FilterChip key={s} label={s} active={filterSeating.includes(s)} onClick={() => toggleArrayFilter(filterSeating, s, setFilterSeating)} />
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <p style={sectionEyebrow}>Amenities</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {(isRestaurant || isAccom) && (
                <FilterChip label="Child Friendly" active={filterChildFriendly} onClick={() => setFilterChildFriendly(!filterChildFriendly)} />
              )}
              <FilterChip label="Pet Friendly" active={filterPetFriendly} onClick={() => setFilterPetFriendly(!filterPetFriendly)} />
              <FilterChip label="Wheelchair Accessible" active={filterWheelchair} onClick={() => setFilterWheelchair(!filterWheelchair)} />
              <FilterChip label="WiFi" active={filterWifi} onClick={() => setFilterWifi(!filterWifi)} />
            </div>
          </div>
        </div>
      )}

      {/* Listings */}
      {isLoading ? (
        <div style={{ paddingLeft: 24, paddingRight: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="w-full" style={{ height: 320, borderRadius: 24, background: "rgba(10,10,10,0.05)" }} />
          ))}
        </div>
      ) : filteredListings.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingLeft: 24, paddingRight: 24 }}>
          {filteredListings.map((l) => {
            const hasDetail = !!(
              l.long_description ||
              (l.gallery_images && l.gallery_images.length > 0) ||
              (l.opening_hours && Object.values(l.opening_hours as Record<string, string>).some((v) => v)) ||
              (isRestaurant && l.show_attributes)
            );

            const whatsappRaw = (l as any).whatsapp as string | null | undefined;
            const directionsHref = l.google_maps_link
              ? l.google_maps_link
              : l.location
              ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.location + ", Hoedspruit")}`
              : null;

            const hasImage = !!l.image_url;

            return (
              <article
                key={l.id}
                onClick={hasDetail ? () => navigate(`/listing/${l.id}`) : undefined}
                style={{
                  background: C.card,
                  border: "none",
                  borderRadius: 24,
                  overflow: "hidden",
                  cursor: hasDetail ? "pointer" : "default",
                }}
              >
                {hasImage && (
                  <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", background: C.panel }}>
                    <img
                      src={l.image_url!}
                      alt={l.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      loading="lazy"
                    />
                    <div onClick={(e) => e.stopPropagation()}>
                      <FavouriteButton itemId={l.id} itemType="listing" />
                    </div>
                  </div>
                )}

                {/* Body */}
                <div style={{ padding: 24 }}>
                  <h3
                    style={{
                      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                      fontSize: 22,
                      fontWeight: 400,
                      color: "#0A0A0A",
                      lineHeight: 1.2,
                      margin: 0,
                    }}
                  >
                    {l.title}
                  </h3>

                  {(l.google_rating || l.location) && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginTop: 6,
                        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                        fontSize: 12,
                        fontWeight: 400,
                        lineHeight: "15.6px",
                        letterSpacing: "0.12px",
                        color: "#8A8480",
                      }}
                    >
                      {l.google_rating && (
                        <>
                          <Star size={12} fill="#F26A48" stroke="#F26A48" />
                          <span>{Number(l.google_rating).toFixed(1)}</span>
                        </>
                      )}
                      {l.google_rating && l.location && (
                        <span
                          style={{
                            display: "inline-block",
                            width: 3,
                            height: 3,
                            borderRadius: "50%",
                            background: "#8A8480",
                          }}
                        />
                      )}
                      {l.location && (
                        <>
                          <MapPin size={12} strokeWidth={1.5} color="#8A8480" />
                          <span>{l.location}</span>
                        </>
                      )}
                    </div>
                  )}

                  {l.description && (
                    <p
                      style={{
                        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                        fontSize: 14,
                        fontWeight: 400,
                        lineHeight: "20.3px",
                        color: "#0A0A0A",
                        margin: 0,
                        marginTop: 14,
                      }}
                    >
                      {l.description}
                    </p>
                  )}

                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: "center", paddingTop: 80, paddingLeft: 24, paddingRight: 24 }}>
          <p style={{ fontFamily: font, fontWeight: 700, fontSize: 18, color: C.text, marginBottom: 6 }}>
            No listings found
          </p>
          <p style={{ fontSize: 14, color: C.muted, fontFamily: font }}>
            Check back soon for places in this category
          </p>
        </div>
      )}
    </div>
  );
};

export default CategoryPage;
