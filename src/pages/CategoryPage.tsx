import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, SlidersHorizontal, MapPin, Search, Heart } from "lucide-react";
import BackArrowIcon from "@/components/ui/BackArrowIcon";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { isRestaurantCategory, isAccommodationCategory } from "@/lib/categoryFields";
import { sanitizeDashesList } from "@/lib/sanitizeListing";
import { Skeleton } from "@/components/ui/skeleton";

const CUISINE_OPTIONS = ["African", "Italian", "Indian", "Asian", "Mexican", "Mediterranean", "American", "Steakhouse", "Seafood", "Pizza", "Sushi", "Vegetarian", "Tapas", "Vegan", "Coffee", "Baked Goods", "Desserts", "Healthy Eats", "Pasta"];
const VIBE_OPTIONS = ["Casual", "Fine Dining", "Family", "Romantic", "Outdoor", "Live Music", "Sports Bar", "Trendy", "Cozy", "Hidden Gem", "Late Nights", "Good for Remote Work", "Cosy", "Rustic"];
const MEAL_OPTIONS = ["Breakfast", "Brunch", "Lunch", "Dinner", "Pub Grub", "Snacks", "Light Meals"];
const SEATING_OPTIONS = ["Indoor", "Outdoor", "Both"];

const sans = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const serif = "'Playfair Display', Georgia, serif";

// Editorial palette
const C = {
  olive: "#5C6446",
  cream: "#EEE8DA",
  softCream: "#F4EFE3",
  ink: "#2A2A24",
  mutedInk: "#6B6A5E",
  line: "#D9D2C0",
  rust: "#9B5A3C",
  gold: "#D9C36B",
};

const TAGLINES: Record<string, string> = {
  "restaurants & cafés": "places to eat in town.",
  "restaurants & cafes": "places to eat in town.",
  accommodation: "places to spend the night.",
  "activities & adventures": "places to get out and about.",
  "health & medical": "places when you need them.",
  shopping: "places to find what you need.",
  "wellness & beauty": "places to slow down.",
  property: "places on the market.",
  "auto & mechanical": "places to keep things running.",
  "home & garden": "places to make it home.",
  education: "places to learn.",
  "trades & services": "places to call when you need a hand.",
  community: "places that bring us together.",
  "ngos & volunteering": "places where you can pitch in.",
  "art & culture": "place to see something made by hand.",
};

const titleSizeFor = (s: string) => {
  const n = s.length;
  if (n < 11) return 64;
  if (n <= 20) return 54;
  if (n <= 28) return 48;
  return 42;
};

type SortKey = "default" | "name" | "rating";

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const parseTime = (s: string) => {
  const [h, mm] = s.replace(".", ":").split(":");
  return parseInt(h, 10) * 60 + (mm ? parseInt(mm, 10) : 0);
};

const todayHours = (openingHours: Record<string, string> | null | undefined) => {
  if (!openingHours) return null;
  const now = new Date();
  const todayIdx = now.getDay();
  const todayLabel = todayIdx === 0 ? "Sunday" : DAY_LABELS[todayIdx - 1];
  const raw = openingHours[todayLabel.toLowerCase()];
  return typeof raw === "string" ? raw : null;
};

const isAlwaysOpen = (v: string | null | undefined): boolean => {
  if (!v) return false;
  return /always\s*open|24\s*\/?\s*7|open\s*24|24\s*hours?|24h\b/i.test(v);
};

const isOpenNow = (openingHours: Record<string, string> | null | undefined): boolean => {
  const v = todayHours(openingHours);
  if (!v || /closed/i.test(v)) return false;
  if (isAlwaysOpen(v)) return true;
  const m = v.match(/(\d{1,2}[:.]?\d{0,2})\s*[-–]\s*(\d{1,2}[:.]?\d{0,2})/);
  if (!m) return false;
  const cur = new Date().getHours() * 60 + new Date().getMinutes();
  const o = parseTime(m[1]);
  let c = parseTime(m[2]);
  if (c <= o) c += 24 * 60;
  return cur >= o && cur <= c;
};

const opensAt = (openingHours: Record<string, string> | null | undefined): string | null => {
  const v = todayHours(openingHours);
  if (!v || /closed/i.test(v)) return null;
  const m = v.match(/(\d{1,2}[:.]?\d{0,2})\s*[-–]/);
  return m ? m[1].replace(".", ":") : null;
};

// Filter chip used inside the filter sheet
const FilterChip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      background: active ? C.ink : "transparent",
      border: `1px solid ${active ? C.ink : "rgba(238,232,218,0.45)"}`,
      borderRadius: 9999,
      padding: "8px 14px",
      fontSize: 13,
      fontWeight: 400,
      fontFamily: sans,
      color: active ? C.cream : C.cream,
      cursor: "pointer",
      lineHeight: 1.2,
    }}
  >
    {label}
  </button>
);

// Card-internal save heart (rust on save)
const CardHeart = ({ listingId }: { listingId: string }) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: saved } = useQuery({
    queryKey: ["favourite", "listing", listingId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("favourites" as any)
        .select("id")
        .eq("user_id", user.id)
        .eq("item_id", listingId)
        .eq("item_type", "listing")
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const toggle = useMutation({
    mutationFn: async () => {
      if (!user) {
        toast.error("Please sign in to save favourites");
        return;
      }
      if (saved) {
        await supabase
          .from("favourites" as any)
          .delete()
          .eq("user_id", user.id)
          .eq("item_id", listingId)
          .eq("item_type", "listing");
      } else {
        await supabase
          .from("favourites" as any)
          .insert({ user_id: user.id, item_id: listingId, item_type: "listing" });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favourite", "listing", listingId] });
      qc.invalidateQueries({ queryKey: ["favourites"] });
    },
  });

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        toggle.mutate();
      }}
      aria-label={saved ? "Remove from favourites" : "Add to favourites"}
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        width: 36,
        height: 36,
        borderRadius: 9999,
        background: "rgba(238, 232, 218, 0.4)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      <Heart
        size={16}
        strokeWidth={2}
        color={saved ? C.rust : C.cream}
        fill={saved ? C.rust : "none"}
      />
    </button>
  );
};

const CategoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSubId = searchParams.get("sub");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("default");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [search, setSearch] = useState("");
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
  const [filterOpenNow, setFilterOpenNow] = useState(false);
  const [filterSaved, setFilterSaved] = useState(false);
  const [filterBeenTo, setFilterBeenTo] = useState(false);

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

  const { data: beenIds } = useQuery({
    queryKey: ["user-been-listings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("been_here")
        .select("listing_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return new Set((data as any[]).map((r) => r.listing_id as string));
    },
    enabled: !!user,
  });

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
      const [{ data: junctionData, error: jErr }, { data: legacyData, error: lErr }] = await Promise.all([
        supabase.from("listing_categories").select("listing_id").eq("category_id", id!),
        supabase.from("listings").select("id").eq("category_id", id!),
      ]);
      if (jErr) throw jErr;
      if (lErr) throw lErr;
      const idSet = new Set<string>();
      (junctionData || []).forEach((r: any) => idSet.add(r.listing_id as string));
      (legacyData || []).forEach((r: any) => idSet.add(r.id as string));
      let listingIds = Array.from(idSet);
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
      return sanitizeDashesList(data as any[]);
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
    filterOpenNow ? 1 : 0,
    filterSaved ? 1 : 0,
    filterBeenTo ? 1 : 0,
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
    setFilterOpenNow(false);
    setFilterSaved(false);
    setFilterBeenTo(false);
  };

  const toggleArrayFilter = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const categoryTitle = category?.title || "Category";
  const isRestaurant = category ? isRestaurantCategory(category.title) : false;
  const isAccom = category ? isAccommodationCategory(category.title) : false;

  const lowerTitle = categoryTitle.toLowerCase();
  const titleWithDot = `${lowerTitle}.`;
  const titleFontSize = titleSizeFor(titleWithDot);

  const filteredListings = useMemo(() => {
    if (!listings) return [];
    const q = search.trim().toLowerCase();
    const result = listings.filter((l) => {
      if (q && !(l.title || "").toLowerCase().includes(q)) return false;
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
      if (filterOpenNow && !isOpenNow(l.opening_hours as Record<string, string> | null)) return false;
      if (filterSaved && !(savedIds && savedIds.has(l.id))) return false;
      if (filterBeenTo && !(beenIds && beenIds.has(l.id))) return false;
      return true;
    });

    if (sortBy === "name") return [...result].sort((a, b) => a.title.localeCompare(b.title));
    if (sortBy === "rating") return [...result].sort((a, b) => (b.google_rating || 0) - (a.google_rating || 0));
    return result;
  }, [listings, filterCuisine, filterVibe, filterMeal, filterSeating, filterChildFriendly, filterPetFriendly, filterWheelchair, filterWifi, filterOpenNow, filterSaved, filterBeenTo, savedIds, beenIds, sortBy, search]);

  const totalCount = listings?.length ?? 0;
  const tagline = TAGLINES[lowerTitle] || "places to discover.";
  const subline = `${totalCount} ${tagline}`;
  const sortLabel = sortBy === "default" ? "Default" : sortBy === "name" ? "Alphabetically" : "Highest Rated";

  const sectionEyebrow: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 400,
    color: "rgba(238,232,218,0.7)",
    textTransform: "uppercase",
    letterSpacing: "2px",
    marginBottom: 10,
    fontFamily: sans,
  };

  const isSearchEmpty = (search.trim().length > 0 || activeFilterCount > 0) && filteredListings.length === 0 && totalCount > 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        paddingBottom: 100,
        background: C.olive,
        fontFamily: sans,
        color: C.cream,
      }}
    >
      {/* Top bar */}
      <div
        style={{
          paddingTop: 32,
          paddingLeft: 24,
          paddingRight: 24,
          display: "flex",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          style={{
            width: 44,
            height: 44,
            borderRadius: 9999,
            background: C.cream,
            border: "none",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <BackArrowIcon size={18} color={C.ink} />
        </button>
      </div>

      {/* Hero */}
      <div style={{ paddingTop: 18, paddingLeft: 24, paddingRight: 24 }}>
        <div
          style={{
            fontFamily: sans,
            fontSize: 12,
            fontWeight: 400,
            letterSpacing: "2.4px",
            textTransform: "uppercase",
            color: "rgba(238,232,218,0.7)",
            marginBottom: 14,
          }}
        >
          Explore ({totalCount})
        </div>
        <h1
          style={{
            fontFamily: serif,
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: titleFontSize,
            lineHeight: 0.95,
            letterSpacing: "-1.8px",
            color: C.cream,
            margin: 0,
            textTransform: "lowercase",
          }}
        >
          {titleWithDot}
        </h1>
        <div style={{ marginBottom: 24 }} />
      </div>

      {/* Search */}
      <div style={{ paddingLeft: 24, paddingRight: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: 52,
            background: "rgba(238, 232, 218, 0.92)",
            borderRadius: 9999,
            padding: "0 22px",
            gap: 12,
          }}
        >
          <Search size={18} strokeWidth={1.6} color={C.mutedInk} style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder={`Search ${lowerTitle}`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontFamily: sans,
              fontSize: 15,
              fontWeight: 400,
              color: C.ink,
            }}
            className="placeholder:text-[#6B6A5E]"
          />
        </div>
      </div>

      {/* Filter / Sort row */}
      <div
        style={{
          paddingTop: 22,
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
            height: 38,
            padding: "0 18px",
            background: C.cream,
            border: "none",
            borderRadius: 9999,
            cursor: "pointer",
            fontFamily: sans,
            fontWeight: 400,
            fontSize: 14,
            color: C.ink,
            lineHeight: 1,
          }}
        >
          <SlidersHorizontal size={14} strokeWidth={1.8} color={C.ink} />
          <span>Filter</span>
          {activeFilterCount > 0 && (
            <span
              style={{
                background: C.ink,
                color: C.cream,
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
              background: "transparent",
              border: "none",
              padding: "8px 0",
              cursor: "pointer",
            }}
          >
            <span style={{ fontFamily: sans, fontSize: 13, color: "rgba(238,232,218,0.7)" }}>Sort by</span>
            <span style={{ fontFamily: sans, fontSize: 13, color: C.cream, marginLeft: 6 }}>{sortLabel}</span>
            <ChevronDown size={11} strokeWidth={1.8} color="rgba(238,232,218,0.85)" style={{ marginLeft: 4 }} />
          </button>

          {showSortMenu && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                right: 0,
                background: C.cream,
                borderRadius: 16,
                padding: 6,
                zIndex: 20,
                boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
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
                    background: sortBy === key ? C.softCream : "transparent",
                    border: "none",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 400,
                    color: C.ink,
                    fontFamily: sans,
                    cursor: "pointer",
                  }}
                >
                  {key === "default" ? "Default" : key === "open_now" ? "Open Now" : key === "favourites" ? "Saved" : key === "name" ? "Name" : "Top Rated"}
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
                color: "rgba(238,232,218,0.75)",
                textDecoration: "underline",
                alignSelf: "flex-start",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: sans,
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
        <div style={{ paddingLeft: 24, paddingRight: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="w-full" style={{ height: 380, borderRadius: 24, background: "rgba(238,232,218,0.12)" }} />
          ))}
        </div>
      ) : filteredListings.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingLeft: 24, paddingRight: 24 }}>
          {filteredListings.map((l) => {
            const hasDetail = !!(
              l.long_description ||
              (l.gallery_images && l.gallery_images.length > 0) ||
              (l.opening_hours && Object.values(l.opening_hours as Record<string, string>).some((v) => v)) ||
              (isRestaurant && l.show_attributes)
            );
            const hasHours = l.opening_hours && Object.values(l.opening_hours as Record<string, string>).some((v) => v);
            const open = hasHours ? isOpenNow(l.opening_hours as Record<string, string>) : null;
            const opensTime = hasHours && open === false ? opensAt(l.opening_hours as Record<string, string>) : null;

            return (
              <article
                key={l.id}
                onClick={hasDetail ? () => navigate(`/listing/${l.id}`) : undefined}
                style={{
                  background: C.cream,
                  borderRadius: 24,
                  overflow: "hidden",
                  cursor: hasDetail ? "pointer" : "default",
                }}
              >
                <div style={{ position: "relative", width: "100%", height: 220, background: C.softCream }}>
                  {l.image_url ? (
                    <img
                      src={l.image_url}
                      alt={l.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      loading="lazy"
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background: `linear-gradient(135deg, ${C.softCream}, ${C.cream})`,
                      }}
                    />
                  )}
                  <CardHeart listingId={l.id} />
                </div>

                <div style={{ padding: "18px 22px 22px" }}>
                  <h3
                    style={{
                      fontFamily: sans,
                      fontSize: 20,
                      fontWeight: 400,
                      color: C.ink,
                      lineHeight: 1.2,
                      letterSpacing: "-0.3px",
                      margin: 0,
                      marginBottom: 10,
                    }}
                  >
                    {l.title}
                  </h3>

                  {(l.google_rating || open !== null) && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                        fontFamily: sans,
                        fontSize: 13,
                        marginBottom: 6,
                      }}
                    >
                      {l.google_rating ? (
                        <span style={{ color: C.ink }}>
                          <span style={{ color: C.ink }}>★</span> {Number(l.google_rating).toFixed(1)}
                        </span>
                      ) : null}
                      {l.google_rating && open !== null && (
                        <span
                          style={{
                            display: "inline-block",
                            width: 4,
                            height: 4,
                            borderRadius: "50%",
                            background: "rgba(107,106,94,0.6)",
                          }}
                        />
                      )}
                      {open === true && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.ink }}>
                          <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: C.gold }} />
                          Open now
                        </span>
                      )}
                      {open === false && (
                        <span style={{ color: C.mutedInk }}>
                          {opensTime ? `Closed · Opens ${opensTime}` : "Closed"}
                        </span>
                      )}
                    </div>
                  )}

                  {l.location && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontFamily: sans,
                        fontSize: 13,
                        color: C.mutedInk,
                        marginBottom: 12,
                      }}
                    >
                      <MapPin size={13} strokeWidth={1.6} color={C.mutedInk} style={{ flexShrink: 0 }} />
                      <span>{l.location}</span>
                    </div>
                  )}

                  {l.description && (
                    <p
                      style={{
                        fontFamily: sans,
                        fontSize: 14,
                        fontWeight: 400,
                        lineHeight: 1.55,
                        color: "rgba(42,42,36,0.85)",
                        margin: 0,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
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
        <div
          style={{
            textAlign: "center",
            paddingTop: 60,
            paddingLeft: 24,
            paddingRight: 24,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <MapPin size={48} strokeWidth={1.5} color="rgba(238,232,218,0.5)" style={{ marginBottom: 16 }} />
          <p
            style={{
              fontFamily: serif,
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 22,
              color: "rgba(238,232,218,0.8)",
              margin: 0,
              marginBottom: 8,
            }}
          >
            {isSearchEmpty ? "No matches found." : "Nothing here yet."}
          </p>
          <p
            style={{
              fontFamily: sans,
              fontSize: 14,
              fontWeight: 400,
              lineHeight: 1.55,
              color: "rgba(238,232,218,0.7)",
              maxWidth: 260,
              margin: 0,
            }}
          >
            {isSearchEmpty ? "Try clearing your filters or search." : "Check back soon as new places join the app."}
          </p>
        </div>
      )}
    </div>
  );
};

export default CategoryPage;
