import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useIsFavourited, useToggleFavourite } from "@/hooks/useFavourites";
import { supabase } from "@/integrations/supabase/client";
import { listingImage } from "@/lib/imageFallback";
import { SlidersHorizontal, MapPin, Search, X, Heart } from "lucide-react";
import SearchBar from "@/components/ui/SearchBar";
import BackArrowIcon from "@/components/ui/BackArrowIcon";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { useRequireAuth } from "@/hooks/useGuestAuth";
import { isRestaurantCategory, isAccommodationCategory } from "@/lib/categoryFields";
import { sanitizeDashesList } from "@/lib/sanitizeListing";
import { formatServiceLabel } from "@/lib/serviceLabels";
import { Skeleton } from "@/components/ui/skeleton";
import { RefineDrawer, RefineSection, RefineOption, RefineChip, RefineRectOption, RefineToggle, RefineSlider } from "@/components/RefineDrawer";
import { getDisplayTitle, noTitleCaseProps } from "@/lib/displayTitle";
import { pinFeatured } from "@/lib/featuredFirst";
import { bayesianRating, RATING_FALLBACK_MEAN } from "@/lib/rating";
import { getHoursSchedules, isAnyOpenNow, isMissingHoursColumn, withHoursColumns } from "@/lib/openHours";
import ListingCardMeta from "@/components/listing/ListingCardMeta";
import Seo from "@/components/Seo";
import { BODY_INK, type , MUTED as TOKEN_MUTED} from "@/lib/type";
import { CATEGORY_CARD_CHROME } from "@/lib/cardChrome";
import { CATEGORY_CARD_GRID } from "@/lib/appLayout";


const CUISINE_OPTIONS = ["African", "Italian", "Indian", "Asian", "Mexican", "Mediterranean", "American", "Steakhouse", "Seafood", "Pizza", "Sushi", "Vegetarian", "Tapas", "Vegan", "Coffee", "Baked Goods", "Desserts", "Healthy Eats", "Pasta"];
const VIBE_OPTIONS = ["Casual", "Fine Dining", "Family", "Romantic", "Outdoor", "Live Music", "Sports Bar", "Trendy", "Cozy", "Hidden Gem", "Late Nights", "Good for Remote Work", "Cosy", "Rustic", "Lively", "Bushveld Feel", "Local Favourite"];
const MEAL_OPTIONS = ["Breakfast", "Brunch", "Lunch", "Dinner", "Pub Grub", "Snacks", "Light Meals"];
const SEATING_OPTIONS = ["Indoor", "Outdoor", "Both"];

// Accommodation amenities: each is a boolean column on `listings`. Only the
// ones actually in use on a listing in the category are offered as filters.
const ACCOM_AMENITY_OPTIONS: { key: string; label: string }[] = [
  { key: "has_wifi_accom", label: "WiFi" },
  { key: "breakfast_included", label: "Free Breakfast" },
  { key: "has_aircon", label: "Aircon" },
  { key: "has_swimming_pool", label: "Swimming Pool" },
  { key: "has_restaurant", label: "Restaurant" },
  { key: "has_bar", label: "Bar" },
  { key: "has_room_service", label: "Room Service" },
  { key: "has_spa", label: "Spa" },
  { key: "has_fitness_centre", label: "Fitness Centre" },
  { key: "has_laundry", label: "Laundry Service" },
  { key: "has_airport_shuttle", label: "Airport Shuttle" },
  { key: "has_secure_parking", label: "Secure Parking" },
  { key: "child_friendly", label: "Child Friendly" },
  { key: "pets_allowed", label: "Pet Friendly" },
];

// Restaurant boolean facets. Each is a boolean column on `listings`; only the
// ones actually true on a listing in the category are offered as filters.
const KIDS_OPTIONS: { key: string; label: string }[] = [
  { key: "kids_playground", label: "Kids Playground" },
  { key: "kids_menu", label: "Kids Menu" },
  { key: "nappy_changing_station", label: "Nappy Changing Station" },
  { key: "high_chairs", label: "High Chairs" },
];

const DRINK_OPTIONS: { key: string; label: string }[] = [
  { key: "has_wine_list", label: "Wine List" },
  { key: "has_cocktails", label: "Cocktails" },
  { key: "has_craft_beer", label: "Craft Beer" },
  { key: "has_beers_ciders", label: "Beers / Ciders" },
  { key: "has_champagne", label: "Champagne" },
  { key: "has_mocktails", label: "Mocktails" },
  { key: "has_smoothies", label: "Smoothies" },
  { key: "has_milkshakes", label: "Milkshakes" },
  { key: "has_coffee", label: "Coffee" },
  { key: "has_iced_coffee", label: "Iced Coffee" },
];

const ACCESSIBILITY_OPTIONS: { key: string; label: string }[] = [
  { key: "wheelchair_friendly", label: "Wheelchair Friendly" },
  { key: "wheelchair_car_park", label: "Wheelchair Parking" },
  { key: "wheelchair_entrance", label: "Wheelchair Entrance" },
  { key: "wheelchair_seating", label: "Wheelchair Seating" },
  { key: "wheelchair_toilet", label: "Wheelchair Toilet" },
];

const sans = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const serif = "'Helvetica Neue', Helvetica, Arial, sans-serif";

// Editorial palette
const C = {
  olive: "#5C6446",
  cream: "#EEE8DA",
  softCream: "#F4EFE3",
  ink: BODY_INK,
  mutedInk: TOKEN_MUTED,
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

// google_rating / google_reviews_count can arrive as a number, a numeric string
// or an empty string. Anything that isn't a positive number counts as "no rating".
const ratingNumber = (raw: unknown) => {
  if (raw === null || raw === undefined || raw === "") return 0;
  const n = typeof raw === "number" ? raw : parseFloat(String(raw));
  return Number.isFinite(n) ? n : 0;
};

const hasGoogleRating = (l: { google_rating?: unknown; google_reviews_count?: unknown }) =>
  ratingNumber(l.google_rating) > 0 && ratingNumber(l.google_reviews_count) > 0;

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

// Card-internal save heart (matches the events card heart).
// Reads from the shared favourites cache so a category page with 50 listings
// only does ONE favourites query instead of 50.
//
// Its size and inset come from `cardChrome.ts`, which is also what the admin
// crop tool draws its guide from — so the heart you position a photo around in
// the editor is the heart that lands on it here.
const HEART = CATEGORY_CARD_CHROME.heart;
const RATING_CHIP = CATEGORY_CARD_CHROME.rating;
// The two-column grid these cards sit in. `appLayout.ts` works the card's width
// out from exactly these numbers, which is what makes the crop guides land
// where the chrome above really lands.
const GRID = CATEGORY_CARD_GRID;

const CardHeart = ({ listingId }: { listingId: string }) => {
  const saved = useIsFavourited(listingId, "listing");
  const toggle = useToggleFavourite();
  const requireAuth = useRequireAuth();

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!requireAuth("save favourites")) return;
        toggle.mutate({ itemId: listingId, itemType: "listing", currentlyFavourited: saved });
      }}
      aria-label={saved ? "Remove from favourites" : "Add to favourites"}
      style={{
        position: "absolute",
        top: HEART.top,
        right: HEART.right,
        width: HEART.size,
        height: HEART.size,
        borderRadius: 9999,
        background: HEART.background,
        border: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        boxShadow: HEART.shadow,
        backdropFilter: HEART.blur,
      }}
    >
      <Heart
        size={HEART.iconSize}
        strokeWidth={HEART.strokeWidth}
        color={saved ? HEART.savedColor : HEART.idleColor}
        fill={saved ? HEART.savedColor : "none"}
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

  // Persist filter/sort/search state in history state so that navigating into a
  // detail page and back preserves filters, but navigating anywhere else and
  // returning to this list resets them (a fresh history entry starts empty).
  const location = useLocation();
  const persisted = (location.state as { filters?: any } | null)?.filters ?? null;

  const [refineOpen, setRefineOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>(persisted?.sortBy ?? "default");
  const [search, setSearch] = useState<string>(persisted?.search ?? "");
  const [openSection, setOpenSection] = useState<
    "sort" | "subcategory" | "cuisine" | "vibe" | "meal" | "seating" | "list" | "amenities" | "proptype" | "minstay" | "grading" | "accomamen" | "kids" | "drinks" | "foods" | "servicetype" | "access" | null
  >(null);


  const [filterCuisine, setFilterCuisine] = useState<string[]>(persisted?.filterCuisine ?? []);
  const [filterVibe, setFilterVibe] = useState<string[]>(persisted?.filterVibe ?? []);
  const [filterMeal, setFilterMeal] = useState<string[]>(persisted?.filterMeal ?? []);
  const [filterSeating, setFilterSeating] = useState<string[]>(persisted?.filterSeating ?? []);
  // Restaurant & cafe facets
  const [filterFoods, setFilterFoods] = useState<string[]>(persisted?.filterFoods ?? []);
  const [filterServiceType, setFilterServiceType] = useState<string[]>(persisted?.filterServiceType ?? []);
  const [filterKids, setFilterKids] = useState<string[]>(persisted?.filterKids ?? []);
  const [filterDrinks, setFilterDrinks] = useState<string[]>(persisted?.filterDrinks ?? []);
  const [filterAccessibility, setFilterAccessibility] = useState<string[]>(persisted?.filterAccessibility ?? []);
  const [filterChildFriendly, setFilterChildFriendly] = useState<boolean>(persisted?.filterChildFriendly ?? false);
  const [filterPetFriendly, setFilterPetFriendly] = useState<boolean>(persisted?.filterPetFriendly ?? false);
  const [filterWheelchair, setFilterWheelchair] = useState<boolean>(persisted?.filterWheelchair ?? false);
  const [filterWifi, setFilterWifi] = useState<boolean>(persisted?.filterWifi ?? false);
  const [filterOpenNow, setFilterOpenNow] = useState<boolean>(persisted?.filterOpenNow ?? false);
  const [filterSaved, setFilterSaved] = useState<boolean>(persisted?.filterSaved ?? false);
  const [filterBeenTo, setFilterBeenTo] = useState<boolean>(persisted?.filterBeenTo ?? false);
  const MAX_KM = 25; // "Anywhere"
  const [filterMaxKm, setFilterMaxKm] = useState<number>(persisted?.filterMaxKm ?? MAX_KM);
  // Accommodation-only filters
  const [filterPropertyTypes, setFilterPropertyTypes] = useState<string[]>(persisted?.filterPropertyTypes ?? []);
  const [filterMinNights, setFilterMinNights] = useState<number[]>(persisted?.filterMinNights ?? []);
  const [filterGrading, setFilterGrading] = useState<number[]>(persisted?.filterGrading ?? []);
  const [filterAccomAmenities, setFilterAccomAmenities] = useState<string[]>(persisted?.filterAccomAmenities ?? []);


  useEffect(() => {
    navigate(location.pathname + location.search, {
      replace: true,
      state: {
        ...(location.state as object | null),
        filters: {
          sortBy, search,
          filterCuisine, filterVibe, filterMeal, filterSeating,
          filterChildFriendly, filterPetFriendly, filterWheelchair, filterWifi,
          filterOpenNow, filterSaved, filterBeenTo,
          filterMaxKm,
          filterPropertyTypes, filterMinNights, filterGrading, filterAccomAmenities,
          filterFoods, filterServiceType, filterKids, filterDrinks, filterAccessibility,
        },
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sortBy, search,
    filterCuisine, filterVibe, filterMeal, filterSeating,
    filterChildFriendly, filterPetFriendly, filterWheelchair, filterWifi,
    filterOpenNow, filterSaved, filterBeenTo, filterMaxKm,
    filterPropertyTypes, filterMinNights, filterGrading, filterAccomAmenities,
    filterFoods, filterServiceType, filterKids, filterDrinks, filterAccessibility,
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

  const { data: category, isLoading: categoryLoading, isError: categoryError, refetch: refetchCategory, isFetching: categoryFetching } = useQuery({
    queryKey: ["category", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").eq("id", id!).maybeSingle();
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

  const { data: listings, isLoading, isError: listingsError, refetch: refetchListings, isFetching: listingsFetching } = useQuery({
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

      const [{ data, error }, { data: orderRows }] = await Promise.all([
        supabase
          .from("listings")
          .select("*")
          .in("id", listingIds)
          .order("is_featured", { ascending: false }),
        supabase
          .from("listing_category_order")
          .select("listing_id, position")
          .eq("category_id", id!),
      ]);
      if (error) throw error;

      // Apply custom per-category ordering: keep is_featured pin at top,
      // then within each featured/non-featured group, listings with a custom
      // position come first (asc), the rest keep their existing arbitrary order.
      const posMap = new Map<string, number>();
      (orderRows || []).forEach((r: any) => posMap.set(r.listing_id, r.position));
      if (posMap.size > 0 && data) {
        const featured = data.filter((l: any) => l.is_featured);
        const others = data.filter((l: any) => !l.is_featured);
        const sortGroup = (arr: any[]) => {
          const withPos = arr.filter((l) => posMap.has(l.id))
            .sort((a, b) => (posMap.get(a.id)! - posMap.get(b.id)!));
          const withoutPos = arr.filter((l) => !posMap.has(l.id));
          return [...withPos, ...withoutPos];
        };
        const reordered = [...sortGroup(featured), ...sortGroup(others)];
        (data as any).length = 0;
        (data as any).push(...reordered);
      }


      // Fetch all categories per listing (junction + legacy category_id).
      // The junction also carries the card label chosen for this listing *in this
      // category*, so a listing in several categories can read differently on
      // each category page.
      const fetchJunction = async () => {
        const res = await supabase
          .from("listing_categories")
          .select("listing_id, category_id, card_primary_subcategory")
          .in("listing_id", listingIds);
        // The per-category label column may not exist yet (migration not applied);
        // fall back to the plain junction rather than breaking the whole page.
        if (res.error) {
          return supabase.from("listing_categories").select("listing_id, category_id").in("listing_id", listingIds);
        }
        return res;
      };

      const [{ data: allJunction }, { data: allCats }, { data: catSubs }] = await Promise.all([
        fetchJunction(),
        supabase.from("categories").select("id, title"),
        supabase.from("subcategories").select("id, title").eq("category_id", id!),
      ]);
      const catTitleById = new Map<string, string>();
      (allCats || []).forEach((c: any) => catTitleById.set(c.id, c.title));
      const listingToCats = new Map<string, Set<string>>();
      const listingToCategoryLabel = new Map<string, string>();
      (allJunction || []).forEach((r: any) => {
        if (r.category_id === id && r.card_primary_subcategory) {
          listingToCategoryLabel.set(r.listing_id, r.card_primary_subcategory);
        }
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
        l._categoryCardLabel = listingToCategoryLabel.get(l.id) || null;
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
        total: 0,
        subCounts: new Map<string, number>(),
        cuisine: new Map<string, number>(),
        vibe: new Map<string, number>(),
        meal: new Map<string, number>(),
        seating: new Map<string, number>(),
        openNow: 0,
        saved: 0,
      };
      if (allIds.length === 0) return empty;

      const [rows, { data: subRows }] = await Promise.all([
        withHoursColumns(async (hoursCols) => {
          const { data, error } = await supabase
            .from("listings")
            .select(`id, cuisine, vibe, meal, seating, ${hoursCols}`)
            .in("id", allIds);
          // Only a missing hours column is worth retrying for; every other
          // error keeps the old behaviour of leaving the facets empty.
          if (error && isMissingHoursColumn(error)) throw error;
          return data;
        }),
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
        if (isAnyOpenNow(l)) openNow += 1;
      });

      const savedCount = savedIds
        ? allIds.filter((lid) => savedIds.has(lid)).length
        : 0;

      return { total: allIds.length, subCounts, cuisine, vibe, meal, seating, openNow, saved: savedCount };
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
    filterPropertyTypes.length > 0 ? 1 : 0,
    filterMinNights.length > 0 ? 1 : 0,
    filterGrading.length > 0 ? 1 : 0,
    filterAccomAmenities.length > 0 ? 1 : 0,
    filterFoods.length > 0 ? 1 : 0,
    filterServiceType.length > 0 ? 1 : 0,
    filterKids.length > 0 ? 1 : 0,
    filterDrinks.length > 0 ? 1 : 0,
    filterAccessibility.length > 0 ? 1 : 0,
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
    setFilterPropertyTypes([]);
    setFilterMinNights([]);
    setFilterGrading([]);
    setFilterAccomAmenities([]);
    setFilterFoods([]);
    setFilterServiceType([]);
    setFilterKids([]);
    setFilterDrinks([]);
    setFilterAccessibility([]);
    setOpenSection(null);
  };


  const toggleArrayFilter = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const categoryTitle = category?.title || "Category";
  const isRestaurant = category ? isRestaurantCategory(category.title) : false;
  const isAccom = category ? isAccommodationCategory(category.title) : false;

  // Restaurant & cafe facets, all derived from what the listings actually carry
  // so that values added later show up as filters on their own.
  const arrayFacetOptions = (field: string) => {
    if (!isRestaurant || !listings) return [];
    const counts = new Map<string, number>();
    const labels = new Map<string, string>();
    (listings as any[]).forEach((l) => {
      (l[field] || []).forEach((raw: string) => {
        const val = (raw || "").trim();
        if (!val) return;
        const key = val.toLowerCase();
        if (!labels.has(key)) labels.set(key, formatServiceLabel(val));
        counts.set(key, (counts.get(key) || 0) + 1);
      });
    });
    return Array.from(labels.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([key, label]) => ({ value: key, label: withCount(label, counts.get(key)) }));
  };

  const boolFacetOptions = (opts: { key: string; label: string }[]) => {
    if (!isRestaurant || !listings) return [];
    return opts
      .map(({ key, label }) => {
        const count = (listings as any[]).filter((l) => l[key] === true).length;
        return { key, label: withCount(label, count), count };
      })
      .filter((o) => o.count > 0);
  };

  const foodsOptions = useMemo(() => arrayFacetOptions("foods"), [isRestaurant, listings]);
  const serviceTypeOptions = useMemo(() => arrayFacetOptions("service_type"), [isRestaurant, listings]);
  const seatingOptions = useMemo(() => arrayFacetOptions("seating"), [isRestaurant, listings]);
  const kidsOptions = useMemo(() => boolFacetOptions(KIDS_OPTIONS), [isRestaurant, listings]);
  const drinkOptions = useMemo(() => boolFacetOptions(DRINK_OPTIONS), [isRestaurant, listings]);
  const accessibilityOptions = useMemo(() => boolFacetOptions(ACCESSIBILITY_OPTIONS), [isRestaurant, listings]);


  // Accommodation filter options derived from what is actually in use.
  const propertyTypeOptions = useMemo(() => {
    if (!isAccom || !listings) return [];
    const counts = new Map<string, number>();
    const labels = new Map<string, string>();
    (listings as any[]).forEach((l) => {
      const raw = (l.property_type || "").trim();
      if (!raw) return;
      const key = raw.toLowerCase();
      if (!labels.has(key)) labels.set(key, raw);
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(labels.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([key, label]) => ({ value: label, label: withCount(label, counts.get(key)) }));
  }, [isAccom, listings]);

  const gradingOptions = useMemo(() => {
    if (!isAccom || !listings) return [];
    const set = new Set<number>();
    (listings as any[]).forEach((l) => {
      const sr = Number(l.star_rating);
      if (sr >= 1 && sr <= 5) set.add(sr);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [isAccom, listings]);

  const minNightsOptions = useMemo(() => {
    if (!isAccom || !listings) return [];
    const counts = new Map<number, number>();
    (listings as any[]).forEach((l) => {
      const mn = Number(l.min_nights) || 1;
      counts.set(mn, (counts.get(mn) || 0) + 1);
    });
    const vals = Array.from(counts.keys())
      .filter((v) => v > 1)
      .sort((a, b) => a - b);
    if (vals.length === 0) return [];
    return [
      { value: 1, label: withCount("1 Night", counts.get(1)) },
      ...vals.map((n) => ({ value: n, label: withCount(`${n} Nights`, counts.get(n)) })),
    ];
  }, [isAccom, listings]);

  const accomAmenityOptions = useMemo(() => {
    if (!isAccom || !listings) return [];
    return ACCOM_AMENITY_OPTIONS.map(({ key, label }) => {
      const count = (listings as any[]).filter((l) => l[key] === true).length;
      return { key, label: withCount(label, count), count };
    }).filter((o) => o.count > 0);
  }, [isAccom, listings]);


  const displayTitle = categoryTitle;
  const titleWithDot = `${displayTitle.toLowerCase()}.`;
  const titleFontSize = titleSizeFor(titleWithDot);

  // Mean rating (C) for the Bayesian score — calculated from the full unfiltered
  // category dataset so that active filters never move the baseline. Falls back
  // to the shared constant when too few listings carry reviews to be meaningful.
  const categoryRatingMean = useMemo(() => {
    const rated = (listings || []).filter((l) => hasGoogleRating(l));
    if (rated.length < 5) return RATING_FALLBACK_MEAN;
    const sum = rated.reduce((acc, l) => acc + ratingNumber(l.google_rating), 0);
    return sum / rated.length;
  }, [listings]);

  const filteredListings = useMemo(() => {
    if (!listings) return [];
    const q = search.trim().toLowerCase();
    // When the user is actively searching, bypass the other filters so that
    // an empty filter-result state doesn't prevent search from finding matches.
    const result = listings.filter((l) => {
      // Highest Rated only ranks listings that actually have a rating, so
      // unrated listings drop out entirely while that sort is active.
      if (sortBy === "rating" && !hasGoogleRating(l)) return false;
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
      if (filterFoods.length > 0) {
        const lf = ((l as any).foods || []).map((f: string) => f.toLowerCase());
        if (!filterFoods.some((f) => lf.includes(f.toLowerCase()))) return false;
      }
      if (filterServiceType.length > 0) {
        const lst = ((l as any).service_type || []).map((s: string) => s.toLowerCase());
        if (!filterServiceType.some((s) => lst.includes(s.toLowerCase()))) return false;
      }
      if (filterKids.length > 0 && !filterKids.every((k) => (l as any)[k] === true)) return false;
      if (filterDrinks.length > 0 && !filterDrinks.every((k) => (l as any)[k] === true)) return false;
      if (filterAccessibility.length > 0 && !filterAccessibility.every((k) => (l as any)[k] === true)) return false;
      if (filterSeating.length > 0) {
        const ls = (l.seating || []).map((s) => s.toLowerCase());
        if (!filterSeating.some((s) => ls.includes(s.toLowerCase()))) return false;
      }
      if (filterChildFriendly && !l.good_for_kids && !l.child_friendly) return false;
      if (filterPetFriendly && !l.pets_allowed) return false;
      if (filterWheelchair && !l.wheelchair_friendly) return false;
      if (filterWifi && !l.has_wifi && !l.has_free_wifi && !l.has_wifi_accom) return false;
      if (filterOpenNow && !isAnyOpenNow(l)) return false;
      if (filterSaved && !(savedIds && savedIds.has(l.id))) return false;
      if (filterBeenTo && !(beenIds && beenIds.has(l.id))) return false;
      if (filterMaxKm < MAX_KM) {
        const raw = (l as any).km_from_town;
        const km = raw == null || raw === "" ? NaN : parseFloat(String(raw).replace(",", ".").replace(/[^0-9.]/g, ""));
        if (!Number.isFinite(km) || km > filterMaxKm) return false;
      }
      if (filterPropertyTypes.length > 0) {
        const pt = ((l as any).property_type || "").trim().toLowerCase();
        if (!pt || !filterPropertyTypes.some((t) => t.toLowerCase() === pt)) return false;
      }
      if (filterMinNights.length > 0) {
        // A place qualifies if its minimum stay fits within any selected
        // maximum — an empty value is treated as a 1-night minimum.
        const mn = Number((l as any).min_nights) || 1;
        if (!filterMinNights.some((n) => mn <= n)) return false;
      }
      if (filterGrading.length > 0) {
        const sr = Number((l as any).star_rating) || 0;
        if (!filterGrading.includes(sr)) return false;
      }
      if (filterAccomAmenities.length > 0) {
        // Every selected amenity must be present on the listing.
        if (!filterAccomAmenities.every((k) => (l as any)[k] === true)) return false;
      }
      return true;
    });


    // Featured listings pin to the top of every sort, including the ones the
    // visitor picks — the chosen sort still orders within each group.
    if (sortBy === "name_asc") return pinFeatured([...result].sort((a, b) => a.title.localeCompare(b.title)));
    if (sortBy === "name_desc") return pinFeatured([...result].sort((a, b) => b.title.localeCompare(a.title)));
    if (sortBy === "distance") {
      const kmOf = (l: any) => {
        const raw = l.km_from_town;
        const n = raw == null || raw === "" ? NaN : parseFloat(String(raw).replace(",", ".").replace(/[^0-9.]/g, ""));
        return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
      };
      return pinFeatured([...result].sort((a, b) => kmOf(a) - kmOf(b)));
    }
    if (sortBy === "rating") {
      // Score is internal to sorting only — never displayed.
      const scoreFor = (l: { google_rating?: unknown; google_reviews_count?: unknown }) =>
        bayesianRating(
          ratingNumber(l.google_rating),
          ratingNumber(l.google_reviews_count),
          categoryRatingMean,
        );
      return pinFeatured([...result].sort((a, b) => {
        const byScore = scoreFor(b) - scoreFor(a);
        if (byScore !== 0) return byScore;
        const byCount = ratingNumber(b.google_reviews_count) - ratingNumber(a.google_reviews_count);
        if (byCount !== 0) return byCount;
        return (a.title || "").localeCompare(b.title || "");
      }));
    }
    return pinFeatured(result);

  }, [listings, filterCuisine, filterVibe, filterMeal, filterSeating, filterFoods, filterServiceType, filterKids, filterDrinks, filterAccessibility, filterChildFriendly, filterPetFriendly, filterWheelchair, filterWifi, filterOpenNow, filterSaved, filterBeenTo, filterMaxKm, filterPropertyTypes, filterMinNights, filterGrading, filterAccomAmenities, savedIds, beenIds, sortBy, search, categoryRatingMean]);

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
    ...type.label,
    color: "rgba(238,232,218,0.7)",
    textTransform: "uppercase",
    letterSpacing: "2px",
    marginBottom: 10,
    fontFamily: sans,
  };

  const isSearchEmpty = (search.trim().length > 0 || activeFilterCount > 0) && filteredListings.length === 0 && totalCount > 0;

  const PAGE_BG = "#E6E0CC";
  const CARD_BG = "#FFFFFF";
  const INK = "#1A1A1A";
  const MUTED = TOKEN_MUTED;
  const PILL_DARK = "#423324";
  const OPEN_COLOR = "#2b7f3f";
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
        height: 30,
        padding: "0 12px",
        borderRadius: 9999,
        background: active ? "#423324" : "#FFFFFF",
        color: active ? "#FFFFFF" : INK,
        border: active ? "1px solid #423324" : "none",
        fontFamily: sans,
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        cursor: "pointer",
      }}
    >
      {icon}
      {children}
    </button>
  );

  if (categoryError) {
    return (
      <div style={{ minHeight: "100vh", paddingBottom: 100, background: PAGE_BG, fontFamily: sans, color: INK }}>
        <PageHeader title="Explore" />
        <div style={{ padding: "80px 24px", textAlign: "center" }}>
          <h2 style={{ ...type.sectionTitle, margin: "0 0 10px" }}>
            Something went wrong
          </h2>
          <p style={{ ...type.body, color: MUTED, margin: "0 0 24px" }}>
            We couldn't load this category. Please check your connection and try again.
          </p>
          <button
            onClick={() => refetchCategory()}
            disabled={categoryFetching}
            style={{ background: "#423324", color: "#fff", border: "none", borderRadius: 999, height: 48, padding: "0 28px", ...type.button, cursor: categoryFetching ? "default" : "pointer", opacity: categoryFetching ? 0.6 : 1 }}
          >
            {categoryFetching ? "Trying…" : "Try again"}
          </button>
        </div>
      </div>
    );
  }

  if (!categoryLoading && !category) {
    return (
      <div style={{ minHeight: "100vh", paddingBottom: 100, background: PAGE_BG, fontFamily: sans, color: INK }}>
        <PageHeader title="Explore" />
        <div style={{ padding: "80px 24px", textAlign: "center" }}>
          <h2 style={{ ...type.sectionTitle, margin: "0 0 10px" }}>
            Category not found
          </h2>
          <p style={{ ...type.body, color: MUTED, margin: "0 0 24px" }}>
            This category doesn't exist or the link is out of date.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 260, margin: "0 auto" }}>
            <button onClick={() => navigate("/categories")} style={{ background: "#423324", color: "#fff", border: "none", borderRadius: 999, height: 48, padding: "0 24px", ...type.button, cursor: "pointer" }}>
              Back to Explore
            </button>
            <button onClick={() => navigate("/")} style={{ background: "transparent", color: INK, border: "1px solid #E8E4DF", borderRadius: 999, height: 48, padding: "0 24px", ...type.button, cursor: "pointer" }}>
              Back to home
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            style={type.label}
          >
            {totalCount} {totalCount === 1 ? "Listing" : "Listings"}
          </div>
        }
        right={
          <>
            <button
              onClick={() => {
                setSearchOpen((v) => {
                  if (v) setSearch("");
                  return !v;
                });
              }}
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
                background: activeFilterCount > 0 ? "#423324" : "#FFFFFF",
                border: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
                position: "relative",
              }}
            >
              <SlidersHorizontal size={16} strokeWidth={2} color={activeFilterCount > 0 ? "#FFFFFF" : "#1A1A1A"} />
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
            label: formatServiceLabel(s),
            onRemove: () => setFilterSeating(filterSeating.filter((x) => x !== s)),
          })),
          ...filterFoods.map((f) => ({
            label: formatServiceLabel(f),
            onRemove: () => setFilterFoods(filterFoods.filter((x) => x !== f)),
          })),
          ...filterServiceType.map((s) => ({
            label: formatServiceLabel(s),
            onRemove: () => setFilterServiceType(filterServiceType.filter((x) => x !== s)),
          })),
          ...filterKids.map((k) => ({
            label: KIDS_OPTIONS.find((o) => o.key === k)?.label ?? k,
            onRemove: () => setFilterKids(filterKids.filter((x) => x !== k)),
          })),
          ...filterDrinks.map((k) => ({
            label: DRINK_OPTIONS.find((o) => o.key === k)?.label ?? k,
            onRemove: () => setFilterDrinks(filterDrinks.filter((x) => x !== k)),
          })),
          ...filterAccessibility.map((k) => ({
            label: ACCESSIBILITY_OPTIONS.find((o) => o.key === k)?.label ?? k,
            onRemove: () => setFilterAccessibility(filterAccessibility.filter((x) => x !== k)),
          })),
          ...(filterOpenNow ? [{ label: "Open Now", onRemove: () => setFilterOpenNow(false) }] : []),
          ...(user && filterSaved ? [{ label: "Saved", onRemove: () => setFilterSaved(false) }] : []),
          ...(filterBeenTo ? [{ label: "Been To", onRemove: () => setFilterBeenTo(false) }] : []),
          ...(filterMaxKm < MAX_KM ? [{ label: `Max ${filterMaxKm} km from town`, onRemove: () => setFilterMaxKm(MAX_KM) }] : []),

          ...(filterChildFriendly ? [{ label: "Child Friendly", onRemove: () => setFilterChildFriendly(false) }] : []),
          ...(filterPetFriendly ? [{ label: "Pet Friendly", onRemove: () => setFilterPetFriendly(false) }] : []),
          ...(filterWheelchair ? [{ label: "Wheelchair Accessible", onRemove: () => setFilterWheelchair(false) }] : []),
          ...(filterWifi ? [{ label: "WiFi", onRemove: () => setFilterWifi(false) }] : []),
          ...filterPropertyTypes.map((t) => ({
            label: t,
            onRemove: () => setFilterPropertyTypes(filterPropertyTypes.filter((x) => x !== t)),
          })),
          ...filterMinNights.map((n) => ({
            label: `Max ${n}-night min stay`,
            onRemove: () => setFilterMinNights(filterMinNights.filter((x) => x !== n)),
          })),
          ...filterGrading.map((g) => ({
            label: `${g}-Star Grading`,
            onRemove: () => setFilterGrading(filterGrading.filter((x) => x !== g)),
          })),
          ...filterAccomAmenities.map((k) => ({
            label: ACCOM_AMENITY_OPTIONS.find((o) => o.key === k)?.label ?? k,
            onRemove: () => setFilterAccomAmenities(filterAccomAmenities.filter((x) => x !== k)),
          })),
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
              <RefineRectOption label={withCount("All", facetCounts?.total)} active={!activeSubId} onClick={() => handleSubFilter(null)} />
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
              {seatingOptions.length > 0 && (
                <RefineSection
                  label="Seating"
                  summary={filterSeating.length > 0 ? `${filterSeating.length} selected` : undefined}
                  open={openSection === "seating"}
                  onToggle={() => setOpenSection(openSection === "seating" ? null : "seating")}
                >
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {seatingOptions.map((s) => (
                      <RefineChip key={s.value} label={s.label} active={filterSeating.includes(s.value)} onClick={() => toggleArrayFilter(filterSeating, s.value, setFilterSeating)} />
                    ))}
                  </div>
                </RefineSection>
              )}
              {foodsOptions.length > 0 && (
                <RefineSection
                  label="Foods"
                  summary={filterFoods.length > 0 ? `${filterFoods.length} selected` : undefined}
                  open={openSection === "foods"}
                  onToggle={() => setOpenSection(openSection === "foods" ? null : "foods")}
                >
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {foodsOptions.map((f) => (
                      <RefineChip key={f.value} label={f.label} active={filterFoods.includes(f.value)} onClick={() => toggleArrayFilter(filterFoods, f.value, setFilterFoods)} />
                    ))}
                  </div>
                </RefineSection>
              )}
              {drinkOptions.length > 0 && (
                <RefineSection
                  label="Drinks"
                  summary={filterDrinks.length > 0 ? `${filterDrinks.length} selected` : undefined}
                  open={openSection === "drinks"}
                  onToggle={() => setOpenSection(openSection === "drinks" ? null : "drinks")}
                >
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {drinkOptions.map((d) => (
                      <RefineChip key={d.key} label={d.label} active={filterDrinks.includes(d.key)} onClick={() => toggleArrayFilter(filterDrinks, d.key, setFilterDrinks)} />
                    ))}
                  </div>
                </RefineSection>
              )}
              {serviceTypeOptions.length > 0 && (
                <RefineSection
                  label="Service Type"
                  summary={filterServiceType.length > 0 ? `${filterServiceType.length} selected` : undefined}
                  open={openSection === "servicetype"}
                  onToggle={() => setOpenSection(openSection === "servicetype" ? null : "servicetype")}
                >
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {serviceTypeOptions.map((s) => (
                      <RefineChip key={s.value} label={s.label} active={filterServiceType.includes(s.value)} onClick={() => toggleArrayFilter(filterServiceType, s.value, setFilterServiceType)} />
                    ))}
                  </div>
                </RefineSection>
              )}
              {kidsOptions.length > 0 && (
                <RefineSection
                  label="Kids"
                  summary={filterKids.length > 0 ? `${filterKids.length} selected` : undefined}
                  open={openSection === "kids"}
                  onToggle={() => setOpenSection(openSection === "kids" ? null : "kids")}
                >
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {kidsOptions.map((k) => (
                      <RefineChip key={k.key} label={k.label} active={filterKids.includes(k.key)} onClick={() => toggleArrayFilter(filterKids, k.key, setFilterKids)} />
                    ))}
                  </div>
                </RefineSection>
              )}
              {accessibilityOptions.length > 0 && (
                <RefineSection
                  label="Accessibility"
                  summary={filterAccessibility.length > 0 ? `${filterAccessibility.length} selected` : undefined}
                  open={openSection === "access"}
                  onToggle={() => setOpenSection(openSection === "access" ? null : "access")}
                >
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {accessibilityOptions.map((a) => (
                      <RefineChip key={a.key} label={a.label} active={filterAccessibility.includes(a.key)} onClick={() => toggleArrayFilter(filterAccessibility, a.key, setFilterAccessibility)} />
                    ))}
                  </div>
                </RefineSection>
              )}
            </>

          );
        })()}


        {isAccom && propertyTypeOptions.length > 0 && (
          <RefineSection
            label="Property Type"
            summary={filterPropertyTypes.length > 0 ? `${filterPropertyTypes.length} selected` : undefined}
            open={openSection === "proptype"}
            onToggle={() => setOpenSection(openSection === "proptype" ? null : "proptype")}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {propertyTypeOptions.map((t) => (
                <RefineChip
                  key={t.value}
                  label={t.label}
                  active={filterPropertyTypes.includes(t.value)}
                  onClick={() => toggleArrayFilter(filterPropertyTypes, t.value, setFilterPropertyTypes)}
                />
              ))}
            </div>
          </RefineSection>
        )}

        {isAccom && minNightsOptions.length > 0 && (
          <RefineSection
            label="Minimum Nights Stay"
            summary={filterMinNights.length > 0 ? `${filterMinNights.length} selected` : undefined}
            open={openSection === "minstay"}
            onToggle={() => setOpenSection(openSection === "minstay" ? null : "minstay")}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {minNightsOptions.map((n) => (
                <RefineChip
                  key={n.value}
                  label={n.label}
                  active={filterMinNights.includes(n.value)}
                  onClick={() =>
                    setFilterMinNights(filterMinNights.includes(n.value)
                      ? filterMinNights.filter((x) => x !== n.value)
                      : [...filterMinNights, n.value])
                  }
                />
              ))}
            </div>
          </RefineSection>
        )}

        {isAccom && gradingOptions.length > 0 && (
          <RefineSection
            label="Star Grading"
            summary={filterGrading.length > 0 ? `${filterGrading.length} selected` : undefined}
            open={openSection === "grading"}
            onToggle={() => setOpenSection(openSection === "grading" ? null : "grading")}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {gradingOptions.map((g) => (
                <RefineChip
                  key={g}
                  label={`${g}-Star`}
                  active={filterGrading.includes(g)}
                  onClick={() =>
                    setFilterGrading(filterGrading.includes(g)
                      ? filterGrading.filter((x) => x !== g)
                      : [...filterGrading, g])
                  }
                />
              ))}
            </div>
          </RefineSection>
        )}

        {isAccom && accomAmenityOptions.length > 0 && (
          <RefineSection
            label="Amenities"
            summary={filterAccomAmenities.length > 0 ? `${filterAccomAmenities.length} selected` : undefined}
            open={openSection === "accomamen"}
            onToggle={() => setOpenSection(openSection === "accomamen" ? null : "accomamen")}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {accomAmenityOptions.map((a) => (
                <RefineChip
                  key={a.key}
                  label={a.label}
                  active={filterAccomAmenities.includes(a.key)}
                  onClick={() => toggleArrayFilter(filterAccomAmenities, a.key, setFilterAccomAmenities)}
                />
              ))}
            </div>
          </RefineSection>
        )}


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
        <div style={{ paddingLeft: GRID.pageInset, paddingRight: GRID.pageInset, display: "grid", gridTemplateColumns: "1fr 1fr", gap: GRID.gutter }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="w-full" style={{ height: 220, borderRadius: 16, background: "rgba(0,0,0,0.06)" }} />
          ))}
        </div>
      ) : listingsError ? (
        <div style={{ textAlign: "center", padding: "60px 24px 80px" }}>
          <h2 style={{ ...type.sectionTitle, margin: "0 0 10px" }}>
            Something went wrong
          </h2>
          <p style={{ ...type.body, color: MUTED, margin: "0 0 24px" }}>
            We couldn't load these listings. Please check your connection and try again.
          </p>
          <button
            onClick={() => refetchListings()}
            disabled={listingsFetching}
            style={{ background: "#423324", color: "#fff", border: "none", borderRadius: 999, height: 48, padding: "0 28px", ...type.button, cursor: listingsFetching ? "default" : "pointer", opacity: listingsFetching ? 0.6 : 1 }}
          >
            {listingsFetching ? "Trying…" : "Try again"}
          </button>
        </div>
      ) : filteredListings.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: GRID.gutter, paddingLeft: GRID.pageInset, paddingRight: GRID.pageInset }}>
          {filteredListings.map((l) => {
            // Every listing has a detail page worth opening, even a sparse one —
            // gating this on content left image-less rows unclickable.
            const hasDetail = true;


            const allCats: string[] = (l as any)._allCategories || [];
            const rawSubTitles: string[] = (l as any)._subTitles || [];
            const subTitles = rawSubTitles.filter((s) => {
              const sLower = s.trim().toLowerCase();
              return !rawSubTitles.some((other) => {
                if (other === s) return false;
                const oLower = other.trim().toLowerCase();
                return oLower !== sLower && oLower.endsWith(" " + sLower);
              });
            });
            // Show a single label under the title. A listing can sit in several
            // categories, so the label chosen for *this* category wins — that's what
            // lets the same listing read "Nurseries" on Home & Garden and "Builders"
            // on Building & Renovation. Falls back to the listing-wide choice, then
            // the first populated sub, then the category title.
            const chosenLabel = (
              (l as any)._categoryCardLabel ||
              (l as any).card_primary_subcategory ||
              ""
            ).trim();
            const chosenLower = chosenLabel.toLowerCase();
            const primaryLabel = chosenLower
              ? chosenLower === categoryTitle.trim().toLowerCase()
                ? categoryTitle
                : rawSubTitles.find((s) => s.trim().toLowerCase() === chosenLower) || subTitles[0]
              : subTitles[0];
            const eyebrow = primaryLabel || categoryTitle;

            return (
              <article
                key={l.id}
                onClick={hasDetail ? () => navigate(`/listing/${l.id}?from=${encodeURIComponent(categoryTitle)}`, { state: { fromCategory: categoryTitle } }) : undefined}
                style={{
                  background: CARD_BG,
                  borderRadius: 16,
                  overflow: "hidden",
                  cursor: hasDetail ? "pointer" : "default",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3", background: "#F4EFE3" }}>
                  {listingImage(l, "card") ? (
                    <img
                      src={listingImage(l, "card")!}
                      alt={l.title}
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      loading="lazy"
                    />
                  ) : null}

                  {l.google_rating ? (
                    <div
                      style={{
                        position: "absolute",
                        top: RATING_CHIP.top,
                        left: RATING_CHIP.left,
                        background: RATING_CHIP.background,
                        borderRadius: 9999,
                        padding: `${RATING_CHIP.paddingY}px ${RATING_CHIP.paddingX}px`,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: RATING_CHIP.gap,
                        fontFamily: RATING_CHIP.fontFamily,
                        fontSize: RATING_CHIP.fontSize,
                        fontWeight: RATING_CHIP.fontWeight,
                        color: RATING_CHIP.color,
                        lineHeight: RATING_CHIP.lineHeight,
                      }}
                    >
                      <span style={{ color: RATING_CHIP.starColor }}>★</span>
                      {Number(l.google_rating).toFixed(1).replace(/\.0$/, "")}
                      {l.google_reviews_count ? (
                        <span style={{ fontWeight: RATING_CHIP.countWeight, color: RATING_CHIP.countColor }}>
                          ({l.google_reviews_count})
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  <CardHeart listingId={l.id} />
                </div>

                <ListingCardMeta
                  title={getDisplayTitle(l)}
                  titleProps={noTitleCaseProps(l)}
                  titleStyle={{
                    ...type.cardTitleM,
                    color: INK,
                    lineHeight: 1.2,
                    margin: 0,
                    wordBreak: "break-word",
                  }}
                  eyebrow={eyebrow}
                  location={l.location}
                  listing={l}
                />

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
          <h2 style={{ ...type.sectionTitle, margin: "0 0 14px" }}>
            {isSearchEmpty ? "No matches found." : "Nothing here yet."}
          </h2>
          <p style={{ ...type.body, color: MUTED, margin: 0 }}>
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
                height: 48,
                padding: "0 36px",
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
