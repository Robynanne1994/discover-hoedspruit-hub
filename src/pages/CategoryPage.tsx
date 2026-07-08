import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useIsFavourited, useToggleFavourite } from "@/hooks/useFavourites";
import { supabase } from "@/integrations/supabase/client";
import { SlidersHorizontal, MapPin, Search, X, Heart, Pill as PillIcon, Stethoscope, Eye, HeartPulse, Smile, LayoutGrid, Plus, Activity, Brain, PawPrint, Ambulance, Syringe, Bone, Baby, Ear, Accessibility, Microscope, TestTubes } from "lucide-react";
import SearchBar from "@/components/ui/SearchBar";
import BackArrowIcon from "@/components/ui/BackArrowIcon";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { isRestaurantCategory, isAccommodationCategory } from "@/lib/categoryFields";
import { sanitizeDashesList } from "@/lib/sanitizeListing";
import { Skeleton } from "@/components/ui/skeleton";
import { RefineDrawer, RefineSection, RefineOption, RefineChip, RefineRectOption, RefineToggle, RefineSlider } from "@/components/RefineDrawer";
import { getDisplayTitle, noTitleCaseProps } from "@/lib/displayTitle";
import { bayesianScore } from "@/lib/ratingScore";
import Seo from "@/components/Seo";


const CUISINE_OPTIONS = ["African", "Italian", "Indian", "Asian", "Mexican", "Mediterranean", "American", "Steakhouse", "Seafood", "Pizza", "Sushi", "Vegetarian", "Tapas", "Vegan", "Coffee", "Baked Goods", "Desserts", "Healthy Eats", "Pasta"];
const VIBE_OPTIONS = ["Casual", "Fine Dining", "Family", "Romantic", "Outdoor", "Live Music", "Sports Bar", "Trendy", "Cozy", "Hidden Gem", "Late Nights", "Good for Remote Work", "Cosy", "Rustic", "Lively", "Bushveld Feel", "Local Favourite"];
const MEAL_OPTIONS = ["Breakfast", "Brunch", "Lunch", "Dinner", "Pub Grub", "Snacks", "Light Meals"];
const SEATING_OPTIONS = ["Indoor", "Outdoor", "Both"];

const sans = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const serif = "'Helvetica Neue', Helvetica, Arial, sans-serif";

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
  "Restaurants & Cafés": "places to eat in town.",
  "Restaurants & Cafes": "places to eat in town.",
  Accommodation: "places to spend the night.",
  "Activities & Adventures": "places to get out and about.",
  "Health & Medical": "places when you need them.",
  Shopping: "places to find what you need.",
  "Wellness & Beauty": "places to slow down.",
  Property: "places on the market.",
  "Auto & Mechanical": "places to keep things running.",
  "Home & Garden": "places to make it home.",
  Education: "places to learn.",
  "Trades & Services": "places to call when you need a hand.",
  Community: "places that bring us together.",
  "NGOs & Volunteering": "places where you can pitch in.",
  "Art & Culture": "place to see something made by hand.",
};

const titleSizeFor = (s: string) => {
  const n = s.length;
  if (n < 11) return 64;
  if (n <= 20) return 54;
  if (n <= 28) return 48;
  return 42;
};

type SortKey = "default" | "name_asc" | "name_desc" | "rating" | "distance";

// Resolve an icon for a Health & Medical subcategory by matching keywords in
// its title, falling back to a generic medical icon so EVERY subcategory in the
// category gets a tile (no hardcoded list to fall out of sync with the DB).
const healthIconFor = (title: string) => {
  const t = title.toLowerCase();
  if (/pharmac|chemist|dispensar|tablet|medication/.test(t)) return PillIcon;
  if (/dental|dentist|orthodont|tooth|teeth|oral/.test(t)) return Smile;
  if (/optom|optic|eye|vision|spectacle|glasses|ophthalm/.test(t)) return Eye;
  if (/vaccin|immunis|immuniz|inject/.test(t)) return Syringe;
  if (/vet|veterin|animal/.test(t)) return PawPrint;
  if (/ambulance|emergency|paramedic|rescue|first aid/.test(t)) return Ambulance;
  if (/lab|patholog|blood|diagnost|pathol|test/.test(t)) return TestTubes;
  if (/radiolog|x-ray|xray|scan|imaging|ultrasound|sonograph/.test(t)) return Microscope;
  if (/physio|physiother|rehab|biokinet/.test(t)) return Activity;
  if (/chiro|spine|spinal|orthopaed|orthoped|bone|podiat|foot/.test(t)) return Bone;
  if (/psych|mental|counsel|therap|wellbeing|wellness|social work/.test(t)) return Brain;
  if (/pediatr|paediatr|child|baby|infant|maternity|matern/.test(t)) return Baby;
  if (/ear|nose|throat|\bent\b|hearing|audiolog/.test(t)) return Ear;
  if (/disab|accessib|mobility|wheelchair|special needs/.test(t)) return Accessibility;
  if (/hospital|surger|surgeon|specialist|medical centre|medical center/.test(t)) return Plus;
  if (/clinic/.test(t)) return HeartPulse;
  if (/\bgp\b|general practit|family (doctor|practice)|doctor|physician|practitioner|medical practice/.test(t)) return Stethoscope;
  return HeartPulse; // generic medical fallback
};

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

// Card-internal save heart (rust on save).
// Reads from the shared favourites cache so a category page with 50 listings
// only does ONE favourites query instead of 50.
const CardHeart = ({ listingId }: { listingId: string }) => {
  const { user } = useAuth();
  const saved = useIsFavourited(listingId, "listing");
  const toggle = useToggleFavourite();

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!user) {
          toast.error("Please sign in to save favourites");
          return;
        }
        toggle.mutate({ itemId: listingId, itemType: "listing", currentlyFavourited: saved });
      }}
      aria-label={saved ? "Remove from favourites" : "Add to favourites"}
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        width: 36,
        height: 36,
        borderRadius: 9999,
        background: "rgba(238, 232, 218, 0.85)",
        border: `1.5px solid ${saved ? C.rust : C.ink}`,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      <Heart
        size={16}
        strokeWidth={2}
        color={saved ? C.rust : C.ink}
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

  // Persist filter/sort/search state per category so navigating into a listing
  // and back preserves the filtered view.
  const stateKey = `categoryPageState:${id ?? "_"}`;
  const persisted = (() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem(stateKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const [refineOpen, setRefineOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>(persisted?.sortBy ?? "default");
  const [search, setSearch] = useState<string>(persisted?.search ?? "");
  const [openSection, setOpenSection] = useState<
    "sort" | "subcategory" | "cuisine" | "vibe" | "meal" | "seating" | "list" | "amenities" | null
  >(null);


  const [filterCuisine, setFilterCuisine] = useState<string[]>(persisted?.filterCuisine ?? []);
  const [filterVibe, setFilterVibe] = useState<string[]>(persisted?.filterVibe ?? []);
  const [filterMeal, setFilterMeal] = useState<string[]>(persisted?.filterMeal ?? []);
  const [filterSeating, setFilterSeating] = useState<string[]>(persisted?.filterSeating ?? []);
  const [filterChildFriendly, setFilterChildFriendly] = useState<boolean>(persisted?.filterChildFriendly ?? false);
  const [filterPetFriendly, setFilterPetFriendly] = useState<boolean>(persisted?.filterPetFriendly ?? false);
  const [filterWheelchair, setFilterWheelchair] = useState<boolean>(persisted?.filterWheelchair ?? false);
  const [filterWifi, setFilterWifi] = useState<boolean>(persisted?.filterWifi ?? false);
  const [filterOpenNow, setFilterOpenNow] = useState<boolean>(persisted?.filterOpenNow ?? false);
  const [filterSaved, setFilterSaved] = useState<boolean>(persisted?.filterSaved ?? false);
  const [filterBeenTo, setFilterBeenTo] = useState<boolean>(persisted?.filterBeenTo ?? false);
  const MAX_KM = 25; // "Anywhere"
  const [filterMaxKm, setFilterMaxKm] = useState<number>(persisted?.filterMaxKm ?? MAX_KM);


  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(
        stateKey,
        JSON.stringify({
          sortBy, search,
          filterCuisine, filterVibe, filterMeal, filterSeating,
          filterChildFriendly, filterPetFriendly, filterWheelchair, filterWifi,
          filterOpenNow, filterSaved, filterBeenTo,
          filterMaxKm,
        }),
      );
    } catch {
      // ignore quota / serialization errors
    }
  }, [
    stateKey, sortBy, search,
    filterCuisine, filterVibe, filterMeal, filterSeating,
    filterChildFriendly, filterPetFriendly, filterWheelchair, filterWifi,
    filterOpenNow, filterSaved, filterBeenTo, filterMaxKm,
  ]);



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
        // Include listings assigned directly to this subcategory
        // OR to any sub-subcategory under it (hierarchical refinement)
        const [{ data: subJunction, error: sErr }, { data: ssList }] = await Promise.all([
          supabase.from("listing_subcategories").select("listing_id").eq("subcategory_id", activeSubId),
          supabase.from("sub_subcategories").select("id").eq("subcategory_id", activeSubId),
        ]);
        if (sErr) throw sErr;
        const matchingListingIds = new Set<string>((subJunction || []).map((r: any) => r.listing_id as string));
        const ssIds = (ssList || []).map((s: any) => s.id as string);
        if (ssIds.length > 0) {
          const { data: ssJunction } = await supabase
            .from("listing_sub_subcategories")
            .select("listing_id")
            .in("sub_subcategory_id", ssIds);
          (ssJunction || []).forEach((r: any) => matchingListingIds.add(r.listing_id as string));
        }
        listingIds = listingIds.filter((listingId) => matchingListingIds.has(listingId));
        if (listingIds.length === 0) return [];
      }

      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .in("id", listingIds)
        .order("is_featured", { ascending: false });
      if (error) throw error;

      // Fetch all categories per listing (junction + legacy category_id)
      const [{ data: allJunction }, { data: allCats }, { data: catSubs }] = await Promise.all([
        supabase.from("listing_categories").select("listing_id, category_id").in("listing_id", listingIds),
        supabase.from("categories").select("id, title"),
        supabase.from("subcategories").select("id, title").eq("category_id", id!),
      ]);
      const catTitleById = new Map<string, string>();
      (allCats || []).forEach((c: any) => catTitleById.set(c.id, c.title));
      const listingToCats = new Map<string, Set<string>>();
      (allJunction || []).forEach((r: any) => {
        const title = catTitleById.get(r.category_id);
        if (!title) return;
        if (!listingToCats.has(r.listing_id)) listingToCats.set(r.listing_id, new Set());
        listingToCats.get(r.listing_id)!.add(title);
      });

      // Fetch subcategory assignments for the current category
      const subIdToTitle = new Map<string, string>();
      (catSubs || []).forEach((s: any) => subIdToTitle.set(s.id, s.title));
      const listingToSubs = new Map<string, string[]>();
      if (subIdToTitle.size > 0) {
        const { data: lSubs } = await supabase
          .from("listing_subcategories")
          .select("listing_id, subcategory_id")
          .in("listing_id", listingIds)
          .in("subcategory_id", Array.from(subIdToTitle.keys()));
        (lSubs || []).forEach((r: any) => {
          const t = subIdToTitle.get(r.subcategory_id);
          if (!t) return;
          if (!listingToSubs.has(r.listing_id)) listingToSubs.set(r.listing_id, []);
          const arr = listingToSubs.get(r.listing_id)!;
          if (!arr.includes(t)) arr.push(t);
        });
      }

      (data || []).forEach((l: any) => {
        const set = listingToCats.get(l.id) || new Set<string>();
        if (l.category_id) {
          const legacyTitle = catTitleById.get(l.category_id);
          if (legacyTitle) set.add(legacyTitle);
        }
        l._allCategories = Array.from(set);
        l._subTitles = listingToSubs.get(l.id) || [];
      });


      return sanitizeDashesList(data as any[]);
    },
    enabled: !!id,
  });

  const handleSubFilter = (subId: string | null) => {
    if (subId) setSearchParams({ sub: subId });
    else setSearchParams({});
  };

  // Aggregate internal reviews per listing — only used for "Top Rated" sort.
  const listingIds = useMemo(() => (listings || []).map((l: any) => l.id), [listings]);
  const { data: reviewAggregates } = useQuery({
    queryKey: ["review-aggregates", listingIds],
    enabled: listingIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("listing_id, rating")
        .in("listing_id", listingIds);
      const map = new Map<string, { sum: number; count: number }>();
      (data || []).forEach((r: any) => {
        const cur = map.get(r.listing_id) || { sum: 0, count: 0 };
        cur.sum += r.rating;
        cur.count += 1;
        map.set(r.listing_id, cur);
      });
      return map;
    },
  });

  // Per-facet counts for the filter drawer (independent of the active sub filter
  // so the numbers reflect "how many listings exist in this category that match
  // that option"). Subcategory counts are also calculated against the full
  // category set so users can see distribution before narrowing.
  const { data: facetCounts } = useQuery({
    queryKey: ["category-facet-counts", id, user?.id ?? null],
    enabled: !!id,
    queryFn: async () => {
      const [{ data: junctionData }, { data: legacyData }] = await Promise.all([
        supabase.from("listing_categories").select("listing_id").eq("category_id", id!),
        supabase.from("listings").select("id").eq("category_id", id!),
      ]);
      const idSet = new Set<string>();
      (junctionData || []).forEach((r: any) => idSet.add(r.listing_id as string));
      (legacyData || []).forEach((r: any) => idSet.add(r.id as string));
      const allIds = Array.from(idSet);

      const empty = {
        subCounts: new Map<string, number>(),
        cuisine: new Map<string, number>(),
        vibe: new Map<string, number>(),
        meal: new Map<string, number>(),
        seating: new Map<string, number>(),
        openNow: 0,
        saved: 0,
      };
      if (allIds.length === 0) return empty;

      const [{ data: rows }, { data: subRows }] = await Promise.all([
        supabase
          .from("listings")
          .select("id, cuisine, vibe, meal, seating, opening_hours")
          .in("id", allIds),
        supabase
          .from("listing_subcategories")
          .select("listing_id, subcategory_id")
          .in("listing_id", allIds),
      ]);

      const subCounts = new Map<string, number>();
      (subRows || []).forEach((r: any) => {
        subCounts.set(r.subcategory_id, (subCounts.get(r.subcategory_id) || 0) + 1);
      });

      const cuisine = new Map<string, number>();
      const vibe = new Map<string, number>();
      const meal = new Map<string, number>();
      const seating = new Map<string, number>();
      let openNow = 0;
      const bump = (m: Map<string, number>, v: string) => {
        const k = v.toLowerCase();
        m.set(k, (m.get(k) || 0) + 1);
      };
      (rows || []).forEach((l: any) => {
        (l.cuisine || []).forEach((v: string) => bump(cuisine, v));
        (l.vibe || []).forEach((v: string) => bump(vibe, v));
        (l.meal || []).forEach((v: string) => bump(meal, v));
        (l.seating || []).forEach((v: string) => bump(seating, v));
        if (isOpenNow(l.opening_hours as Record<string, string> | null)) openNow += 1;
      });

      const savedCount = savedIds
        ? allIds.filter((lid) => savedIds.has(lid)).length
        : 0;

      return { subCounts, cuisine, vibe, meal, seating, openNow, saved: savedCount };
    },
  });

  const withCount = (label: string, count: number | undefined) =>
    count && count > 0 ? `${label} (${count})` : label;

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
    filterMaxKm < MAX_KM ? 1 : 0,
  ].reduce((a, b) => a + b, 0);


  const clearAllFilters = () => {
    setSearchParams({});
    setSearch("");
    setSortBy("default");
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
    setFilterMaxKm(MAX_KM);
    setOpenSection(null);
  };


  const toggleArrayFilter = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const categoryTitle = category?.title || "Category";
  const isRestaurant = category ? isRestaurantCategory(category.title) : false;
  const isAccom = category ? isAccommodationCategory(category.title) : false;

  const displayTitle = categoryTitle;
  const titleWithDot = `${displayTitle.toLowerCase()}.`;
  const titleFontSize = titleSizeFor(titleWithDot);

  const filteredListings = useMemo(() => {
    if (!listings) return [];
    const q = search.trim().toLowerCase();
    // When the user is actively searching, bypass the other filters so that
    // an empty filter-result state doesn't prevent search from finding matches.
    const result = listings.filter((l) => {
      if (q) {
        return (l.title || "").toLowerCase().includes(q);
      }
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
      if (filterMaxKm < MAX_KM) {
        const raw = (l as any).km_from_town;
        const km = raw == null || raw === "" ? NaN : parseFloat(String(raw).replace(/[^0-9.]/g, ""));
        if (!Number.isFinite(km) || km > filterMaxKm) return false;
      }
      return true;
    });


    if (sortBy === "name_asc") return [...result].sort((a, b) => a.title.localeCompare(b.title));
    if (sortBy === "name_desc") return [...result].sort((a, b) => b.title.localeCompare(a.title));
    if (sortBy === "distance") {
      const kmOf = (l: any) => {
        const raw = l.km_from_town;
        const n = raw == null || raw === "" ? NaN : parseFloat(String(raw).replace(/[^0-9.]/g, ""));
        return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
      };
      return [...result].sort((a, b) => kmOf(a) - kmOf(b));
    }
    if (sortBy === "rating") {
      const scoreFor = (l: any) => {
        const agg = reviewAggregates?.get(l.id);
        const internalCount = agg?.count ?? 0;
        const internalAvg = internalCount > 0 ? (agg!.sum / internalCount) : 0;
        return bayesianScore({
          googleRating: l.google_rating,
          googleCount: l.google_reviews_count,
          internalAvg,
          internalCount,
        });
      };
      return [...result].sort((a, b) => scoreFor(b) - scoreFor(a));
    }
    return result;

  }, [listings, filterCuisine, filterVibe, filterMeal, filterSeating, filterChildFriendly, filterPetFriendly, filterWheelchair, filterWifi, filterOpenNow, filterSaved, filterBeenTo, filterMaxKm, savedIds, beenIds, sortBy, search, reviewAggregates]);

  const totalCount = listings?.length ?? 0;
  const tagline = TAGLINES[categoryTitle] || "places to discover.";
  const subline = `${totalCount} ${tagline}`;
  const SORT_LABELS: Record<SortKey, string> = {
    default: "Default",
    name_asc: "Alphabetically (A-Z)",
    name_desc: "Alphabetically (Z-A)",
    rating: "Highest Rated",
    distance: "Distance from Town",
  };
  const sortLabel = SORT_LABELS[sortBy];


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

  const PAGE_BG = "#E6E0CC";
  const CARD_BG = "#FFFFFF";
  const INK = "#020202";
  const MUTED = "#6B6A5E";
  const PILL_DARK = "#2A2A24";
  const OPEN_COLOR = "#2E7D4F";
  const CLOSED_COLOR = "#C0392B";

  const [searchOpen, setSearchOpen] = useState(false);

  const Pill = ({
    active,
    onClick,
    icon,
    children,
  }: {
    active: boolean;
    onClick: () => void;
    icon?: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0,
        height: 38,
        padding: "0 16px",
        borderRadius: 9999,
        background: active ? PILL_DARK : "#FFFFFF",
        color: active ? "#FFFFFF" : INK,
        border: "none",
        fontFamily: sans,
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
      }}
    >
      {icon}
      {children}
    </button>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        paddingBottom: 100,
        background: PAGE_BG,
        fontFamily: sans,
        color: INK,
      }}
    >
      <Seo
        title={`${displayTitle} in Hoedspruit`}
        description={`Find ${displayTitle.toLowerCase()} in Hoedspruit and the Lowveld — browse listings, reviews and contact details on Hello Hoedspruit.`}
        path={`/category/${category?.id ?? ""}`}
      />
      {/* Top bar */}
      <PageHeader
        title={displayTitle}
        subtitle={
          <div
            style={{
              fontFamily: sans,
              fontSize: 11,
              fontWeight: 500,
              color: MUTED,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            {totalCount} {totalCount === 1 ? "Listing" : "Listings"}
          </div>
        }
        right={
          <>
            <button
              onClick={() => setSearchOpen((v) => !v)}
              aria-label={searchOpen ? "Close search" : "Search"}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "#FFFFFF",
                border: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              {searchOpen ? (
                <X size={18} strokeWidth={1.8} color={INK} />
              ) : (
                <Search size={18} strokeWidth={1.8} color={INK} />
              )}
            </button>
            <button
              onClick={() => setRefineOpen(true)}
              aria-label="FILTER & SORT"
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: activeFilterCount > 0 ? "#2A2A24" : "#FFFFFF",
                border: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
                position: "relative",
              }}
            >
              <SlidersHorizontal size={16} strokeWidth={2} color={activeFilterCount > 0 ? "#FFFFFF" : "#020202"} />
              {activeFilterCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -3,
                    right: -3,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 999,
                    background: "#C0392B",
                    color: "#FFFFFF",
                    fontFamily: sans,
                    fontSize: 9,
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 3px",
                  }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
          </>
        }
      />

      {searchOpen && (
        <div style={{ padding: "16px 20px 0 20px" }}>
          <SearchBar
            variant="light"
            value={search}
            onChange={setSearch}
            placeholder={`Search ${displayTitle}`}
            autoFocus
          />
        </div>
      )}

      {/* Filter pills */}
      <div
        className="scrollbar-hide"
        style={{
          marginTop: 18,
          marginBottom: 16,
          paddingLeft: 20,
          paddingRight: 20,
          overflowX: "auto",
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          <Pill active={filterOpenNow} onClick={() => setFilterOpenNow(!filterOpenNow)}>
            Open Now
          </Pill>
          {user && (
            <Pill active={filterSaved} onClick={() => setFilterSaved(!filterSaved)}>
              Saved
            </Pill>
          )}
        </div>
      </div>

      {/* Health & Medical quick subcategory tiles */}
      {categoryTitle === "Health & Medical" && subcategories && subcategories.length > 0 && (() => {
        // Build a tile for the "All" option plus EVERY subcategory in this
        // category, so the icon/text filters always stay in sync with the DB.
        const tiles: { key: string; title: string; Icon: any; subId: string | null }[] = [
          { key: "all", title: "All", Icon: LayoutGrid, subId: null },
          ...subcategories.map((sub) => ({
            key: sub.id,
            title: sub.title,
            Icon: healthIconFor(sub.title),
            subId: sub.id as string | null,
          })),
        ];
        const tileWidth = `calc((100vw - 40px - 12px) / 4)`;
        return (
          <div className="scrollbar-hide" style={{ overflowX: "auto", paddingLeft: 20, marginBottom: 18 }}>
            <div style={{ display: "flex", gap: 4, paddingRight: 20 }}>
              {tiles.map(({ key, title, Icon, subId }) => {
                const isActive = subId ? activeSubId === subId : !activeSubId;
                return (
                  <button
                    key={key}
                    onClick={() => handleSubFilter(subId && isActive ? null : subId)}
                    style={{
                      flexShrink: 0,
                      width: tileWidth,
                      background: isActive ? PILL_DARK : "#ffffff",
                      color: isActive ? "#ffffff" : INK,
                      borderRadius: 16,
                      padding: "16px 8px 12px",
                      border: "none",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      cursor: "pointer",
                    }}
                  >
                    <Icon size={26} color={isActive ? "#ffffff" : INK} strokeWidth={1.4} />
                    <span style={{ fontFamily: sans, fontSize: 12, letterSpacing: "0.01em", textAlign: "center", lineHeight: 1.2 }}>{title}</span>
                  </button>
                );
              })}
            </div>
            {activeSubId && (
              <button
                onClick={() => handleSubFilter(null)}
                style={{
                  marginTop: 16,
                  background: "rgba(43, 36, 32, 1)",
                  border: "none",
                  color: "#ffffff",
                  fontFamily: sans,
                  fontSize: 12,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  padding: "6px 12px",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  alignSelf: "flex-end",
                }}
              >
                <span style={{ fontSize: 14, lineHeight: 1 }}>×</span>
                Clear all filters
              </button>
            )}
          </div>
        );
      })()}

      <RefineDrawer
        open={refineOpen}
        onClose={() => setRefineOpen(false)}
        onClear={clearAllFilters}
        resultsCount={filteredListings.length}
        resultsLabel="listings"
        activeChips={[
          ...(activeSubId && subcategories
            ? [{
                label: subcategories.find((s) => s.id === activeSubId)?.title || "Category",
                onRemove: () => handleSubFilter(null),
              }]
            : []),
          ...filterCuisine.map((c) => ({
            label: c,
            onRemove: () => setFilterCuisine(filterCuisine.filter((x) => x !== c)),
          })),
          ...filterVibe.map((v) => ({
            label: v,
            onRemove: () => setFilterVibe(filterVibe.filter((x) => x !== v)),
          })),
          ...filterMeal.map((m) => ({
            label: m,
            onRemove: () => setFilterMeal(filterMeal.filter((x) => x !== m)),
          })),
          ...filterSeating.map((s) => ({
            label: s,
            onRemove: () => setFilterSeating(filterSeating.filter((x) => x !== s)),
          })),
          ...(filterOpenNow ? [{ label: "Open Now", onRemove: () => setFilterOpenNow(false) }] : []),
          ...(filterSaved ? [{ label: "Saved", onRemove: () => setFilterSaved(false) }] : []),
          ...(filterBeenTo ? [{ label: "Been To", onRemove: () => setFilterBeenTo(false) }] : []),
          ...(filterMaxKm < MAX_KM ? [{ label: `Max ${filterMaxKm} km from town`, onRemove: () => setFilterMaxKm(MAX_KM) }] : []),

          ...(filterChildFriendly ? [{ label: "Child Friendly", onRemove: () => setFilterChildFriendly(false) }] : []),
          ...(filterPetFriendly ? [{ label: "Pet Friendly", onRemove: () => setFilterPetFriendly(false) }] : []),
          ...(filterWheelchair ? [{ label: "Wheelchair Accessible", onRemove: () => setFilterWheelchair(false) }] : []),
          ...(filterWifi ? [{ label: "WiFi", onRemove: () => setFilterWifi(false) }] : []),
        ]}
      >
        <RefineSection
          label="Sort By"
          summary={SORT_LABELS[sortBy]}
          open={openSection === "sort"}
          onToggle={() => setOpenSection(openSection === "sort" ? null : "sort")}
        >

          {(["default", "name_asc", "name_desc", "rating", "distance"] as SortKey[]).map((key) => (
            <RefineOption
              key={key}
              label={SORT_LABELS[key]}
              active={sortBy === key}
              onClick={() => setSortBy(key)}
            />
          ))}

        </RefineSection>

        {subcategories && subcategories.length > 0 && (() => {
          const visibleSubs = subcategories.filter(
            (sub) => !facetCounts || (facetCounts.subCounts.get(sub.id) || 0) > 0,
          );
          if (visibleSubs.length === 0) return null;
          return (
            <RefineSection
              label="Category"
              summary={
                activeSubId
                  ? subcategories.find((s) => s.id === activeSubId)?.title
                  : undefined
              }
              open={openSection === "subcategory"}
              onToggle={() => setOpenSection(openSection === "subcategory" ? null : "subcategory")}
            >
              <RefineRectOption label={withCount("All", totalCount)} active={!activeSubId} onClick={() => handleSubFilter(null)} />
              {visibleSubs.map((sub) => (
                <RefineRectOption
                  key={sub.id}
                  label={withCount(sub.title, facetCounts?.subCounts.get(sub.id))}
                  active={activeSubId === sub.id}
                  onClick={() => handleSubFilter(sub.id)}
                />
              ))}
            </RefineSection>
          );
        })()}

        {isRestaurant && (() => {
          const filterOpts = (opts: string[], map?: Map<string, number>) =>
            opts.filter((o) => !map || (map.get(o.toLowerCase()) || 0) > 0);
          const cuisines = filterOpts(CUISINE_OPTIONS, facetCounts?.cuisine);
          const vibes = filterOpts(VIBE_OPTIONS, facetCounts?.vibe);
          const meals = filterOpts(MEAL_OPTIONS, facetCounts?.meal);
          const seatings = filterOpts(SEATING_OPTIONS, facetCounts?.seating);
          return (
            <>
              {cuisines.length > 0 && (
                <RefineSection
                  label="Cuisine"
                  summary={filterCuisine.length > 0 ? `${filterCuisine.length} selected` : undefined}
                  open={openSection === "cuisine"}
                  onToggle={() => setOpenSection(openSection === "cuisine" ? null : "cuisine")}
                >
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {cuisines.map((c) => (
                      <RefineChip key={c} label={withCount(c, facetCounts?.cuisine.get(c.toLowerCase()))} active={filterCuisine.includes(c)} onClick={() => toggleArrayFilter(filterCuisine, c, setFilterCuisine)} />
                    ))}
                  </div>
                </RefineSection>
              )}
              {vibes.length > 0 && (
                <RefineSection
                  label="Vibe"
                  summary={filterVibe.length > 0 ? `${filterVibe.length} selected` : undefined}
                  open={openSection === "vibe"}
                  onToggle={() => setOpenSection(openSection === "vibe" ? null : "vibe")}
                >
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {vibes.map((v) => (
                      <RefineChip key={v} label={withCount(v, facetCounts?.vibe.get(v.toLowerCase()))} active={filterVibe.includes(v)} onClick={() => toggleArrayFilter(filterVibe, v, setFilterVibe)} />
                    ))}
                  </div>
                </RefineSection>
              )}
              {meals.length > 0 && (
                <RefineSection
                  label="Meal"
                  summary={filterMeal.length > 0 ? `${filterMeal.length} selected` : undefined}
                  open={openSection === "meal"}
                  onToggle={() => setOpenSection(openSection === "meal" ? null : "meal")}
                >
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {meals.map((m) => (
                      <RefineChip key={m} label={withCount(m, facetCounts?.meal.get(m.toLowerCase()))} active={filterMeal.includes(m)} onClick={() => toggleArrayFilter(filterMeal, m, setFilterMeal)} />
                    ))}
                  </div>
                </RefineSection>
              )}
              {seatings.length > 0 && (
                <RefineSection
                  label="Seating"
                  summary={filterSeating.length > 0 ? `${filterSeating.length} selected` : undefined}
                  open={openSection === "seating"}
                  onToggle={() => setOpenSection(openSection === "seating" ? null : "seating")}
                >
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {seatings.map((s) => (
                      <RefineChip key={s} label={withCount(s, facetCounts?.seating.get(s.toLowerCase()))} active={filterSeating.includes(s)} onClick={() => toggleArrayFilter(filterSeating, s, setFilterSeating)} />
                    ))}
                  </div>
                </RefineSection>
              )}
            </>
          );
        })()}


        <RefineSection label="Max Distance from Town">
          <RefineSlider
            value={filterMaxKm}
            min={0.5}
            max={MAX_KM}
            step={0.5}
            onChange={setFilterMaxKm}
            formatValue={(v) => `${v} km`}
            minLabel="0.5 km"
            maxLabel="Anywhere"
          />
        </RefineSection>



        <RefineSection>
          <RefineToggle
            label="Open Now"
            description="Only places open right now"
            active={filterOpenNow}
            onClick={() => setFilterOpenNow(!filterOpenNow)}
          />
        </RefineSection>

        {user && (
          <RefineSection>
            <RefineToggle
              label="Saved"
              description="Only places you've saved"
              active={filterSaved}
              onClick={() => setFilterSaved(!filterSaved)}
            />
          </RefineSection>
        )}



      </RefineDrawer>

      {/* Listings */}
      {isLoading ? (
        <div style={{ paddingLeft: 20, paddingRight: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="w-full" style={{ height: 340, borderRadius: 20, background: "rgba(0,0,0,0.06)" }} />
          ))}
        </div>
      ) : filteredListings.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingLeft: 20, paddingRight: 20 }}>
          {filteredListings.map((l) => {
            const hasDetail = !!(
              l.long_description ||
              (l.gallery_images && l.gallery_images.length > 0) ||
              (l.opening_hours && Object.values(l.opening_hours as Record<string, string>).some((v) => v)) ||
              isRestaurant
            );
            const hasHours = l.opening_hours && Object.values(l.opening_hours as Record<string, string>).some((v) => v);
            const open = hasHours ? isOpenNow(l.opening_hours as Record<string, string>) : null;

            const allCats: string[] = (l as any)._allCategories || [];
            let subTitles: string[] = (l as any)._subTitles || [];
            // Hide a generic subcategory (e.g. "Lodges") when a more specific one
            // ending in the same word (e.g. "Luxury Lodges", "Safari Lodges") is also present.
            subTitles = subTitles.filter((s) => {
              const sLower = s.trim().toLowerCase();
              return !subTitles.some((other) => {
                if (other === s) return false;
                const oLower = other.trim().toLowerCase();
                return oLower !== sLower && oLower.endsWith(" " + sLower);
              });
            });
            const otherCats = allCats.filter((c) => c && c !== categoryTitle);
            const orderedCats = subTitles.length > 0 ? subTitles : [categoryTitle, ...otherCats];


            return (
              <article
                key={l.id}
                onClick={hasDetail ? () => navigate(`/listing/${l.id}?from=${encodeURIComponent(categoryTitle)}`, { state: { fromCategory: categoryTitle } }) : undefined}
                style={{
                  background: CARD_BG,
                  borderRadius: 20,
                  overflow: "hidden",
                  cursor: hasDetail ? "pointer" : "default",
                }}
              >
                <div style={{ position: "relative", width: "100%", height: 200, background: "#F4EFE3" }}>
                  {l.image_url ? (
                    <img
                      src={l.image_url}
                      alt={l.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      loading="lazy"
                    />
                  ) : null}

                  {l.google_rating ? (
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        background: "rgba(255,255,255,0.92)",
                        borderRadius: 9999,
                        padding: "5px 10px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        fontFamily: sans,
                        fontSize: 12,
                        fontWeight: 600,
                        color: INK,
                      }}
                    >
                      <span style={{ color: INK }}>★</span>
                      {Number(l.google_rating).toFixed(1).replace(/\.0$/, "")}
                      {l.google_reviews_count ? (
                        <span style={{ fontWeight: 400, color: MUTED }}>({l.google_reviews_count})</span>
                      ) : null}
                    </div>
                  ) : null}

                  <CardHeart listingId={l.id} />
                </div>

                <div style={{ padding: "16px 18px 18px" }}>
                  <h3
                    {...noTitleCaseProps(l)}
                    style={{
                      fontFamily: sans,
                      fontSize: 20,
                      fontWeight: 700,
                      color: INK,
                      lineHeight: 1.2,
                      margin: "0 0 6px 0",
                      wordBreak: "break-word",
                    }}
                  >
                    {getDisplayTitle(l)}
                  </h3>

                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, fontFamily: sans, fontSize: 13, color: MUTED }}>
                    {orderedCats.map((c, i) => (
                      <span key={`${c}-${i}`} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        {i > 0 && (
                          <span
                            aria-hidden
                            style={{
                              width: 3,
                              height: 3,
                              borderRadius: "50%",
                              background: MUTED,
                              display: "inline-block",
                            }}
                          />
                        )}
                        <span>{c}</span>
                      </span>
                    ))}
                  </div>

                  {(l.location || open !== null) && (
                    <>
                      <div style={{ height: 1, background: "rgba(0,0,0,0.08)", margin: "14px 0 12px" }} />
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        {l.location ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: sans, fontSize: 13, color: MUTED, flex: 1, minWidth: 0, lineHeight: 1.35 }}>
                            <MapPin size={13} strokeWidth={1.6} color={MUTED} style={{ flexShrink: 0 }} />
                            <span style={{ wordBreak: "break-word" }}>{l.location}</span>
                          </div>
                        ) : (
                          <span />
                        )}
                        {open !== null && (
                          <span
                            style={{
                              flexShrink: 0,
                              border: `1.5px solid ${open ? "#BFE5C8" : "#F4C9C9"}`,
                              color: open ? OPEN_COLOR : CLOSED_COLOR,
                              background: open ? "#F1FAF3" : "#FBEFEF",
                              fontFamily: sans,
                              fontSize: 12,
                              fontWeight: 700,
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              padding: "5px 14px",
                              borderRadius: 9999,
                            }}
                          >
                            {open ? "Open" : "Closed"}
                          </span>
                        )}
                      </div>
                    </>
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
            padding: "60px 24px 80px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              height: 120,
              width: 120,
              borderRadius: 999,
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 28,
            }}
          >
            <MapPin size={42} strokeWidth={1.6} color={MUTED} />
          </div>
          <h2 style={{ fontFamily: sans, fontSize: 26, fontWeight: 700, color: INK, margin: "0 0 14px", letterSpacing: "-0.3px" }}>
            {isSearchEmpty ? "No matches found." : "Nothing here yet."}
          </h2>
          <p style={{ fontFamily: sans, fontSize: 17, fontWeight: 400, lineHeight: 1.5, color: MUTED, margin: 0 }}>
            {isSearchEmpty ? "Try clearing your filters or search." : "Check back soon as new places join the app."}
          </p>
          {isSearchEmpty && (
            <button
              onClick={clearAllFilters}
              style={{
                marginTop: 28,
                background: PILL_DARK,
                color: "#FFFFFF",
                border: "none",
                borderRadius: 999,
                padding: "16px 36px",
                fontFamily: sans,
                fontSize: 16,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryPage;
