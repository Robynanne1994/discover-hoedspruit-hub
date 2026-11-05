import { formatDetailLabel } from "@/lib/detailLabel";
import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useIsFavourited, useToggleFavourite } from "@/hooks/useFavourites";
import { supabase } from "@/integrations/supabase/client";
import { listingImage } from "@/lib/imageFallback";
import { SlidersHorizontal, MapPin, Search, X, Heart, Loader2 } from "lucide-react";
import SearchBar from "@/components/ui/SearchBar";
import BackArrowIcon from "@/components/ui/BackArrowIcon";
import PageHeader from "@/components/PageHeader";
import StickyHeader from "@/components/StickyHeader";

import { useAuth } from "@/hooks/useAuth";
import { useRequireAuth } from "@/hooks/useGuestAuth";
import { isRestaurantCategory, isAccommodationCategory, isShoppingCategory } from "@/lib/categoryFields";
import { buildSubOptions, subIdsForKey, type SubOption } from "@/lib/subcategoryGroups";
import { sanitizeDashesList } from "@/lib/sanitizeListing";
import { formatServiceLabel } from "@/lib/serviceLabels";
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
import { MEAL_OPTIONS, isRestaurantOptionAllowed } from "@/lib/restaurantOptions";
import { allPillActive, pillToggle } from "@/lib/filterPill";
import { useFilterBarReset } from "@/hooks/useFilterBarReset";
import { PILL_ICON_SIZE, PILL_ICON_NUDGE, PILL_BADGE_SIZE, PILL_BADGE_NUDGE } from "@/lib/pillIcon";
import { NOHEMI, tab as tabStyle } from "@/lib/type";
const PILL_HEIGHT = 29;


// Coffee is deliberately absent — it is a drink, not a cuisine (Robyn).
const CUISINE_OPTIONS = ["African", "Italian", "Indian", "Asian", "Mexican", "Mediterranean", "American", "Steakhouse", "Seafood", "Pizza", "Sushi", "Vegetarian", "Tapas", "Vegan", "Baked Goods", "Healthy Eats", "Pasta"];
const VIBE_OPTIONS = ["Casual", "Fine Dining", "Family", "Romantic", "Outdoor", "Live Music", "Sports Bar", "Trendy", "Cozy", "Hidden Gem", "Late Nights", "Good for Remote Work", "Cosy", "Rustic", "Lively", "Bushveld Feel", "Local Favourite"];

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
  { key: "child_friendly", label: "Child-Friendly" },
  { key: "pets_allowed", label: "Pet-Friendly" },
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
  { key: "has_wine_list", label: "Wine" },
  { key: "has_cocktails", label: "Cocktails" },
  { key: "has_craft_beer", label: "Craft Beer" },
  { key: "has_beers_ciders", label: "Beers & Ciders" },
  { key: "has_champagne", label: "Champagne" },
  { key: "has_mocktails", label: "Mocktails" },
  { key: "has_smoothies", label: "Smoothies" },
  { key: "has_milkshakes", label: "Milkshakes" },
  { key: "has_coffee", label: "Coffee" },
  { key: "has_iced_coffee", label: "Iced Coffee" },
];

const ACCESSIBILITY_OPTIONS: { key: string; label: string }[] = [
  { key: "wheelchair_car_park", label: "Wheelchair Parking" },
  { key: "wheelchair_entrance", label: "Wheelchair Entrance" },
  { key: "wheelchair_seating", label: "Wheelchair Seating" },
  { key: "wheelchair_toilet", label: "Wheelchair Toilet" },
];

// Shopping boolean facets.
const SHOPPING_SERVICE_OPTIONS: { key: string; label: string }[] = [
  { key: "order_online", label: "Order Online" },
  { key: "delivery_available", label: "Delivery" },
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
    "sort" | "subcategory" | "cuisine" | "vibe" | "meal" | "seating" | "list" | "amenities" | "proptype" | "minstay" | "grading" | "accomamen" | "kids" | "drinks" | "foods" | "servicetype" | "access" | "shoptype" | "pricerange" | "shopservices" | "prodcat" | null
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
  // Shopping-only filters
  const [filterShopTypes, setFilterShopTypes] = useState<string[]>(persisted?.filterShopTypes ?? []);
  const [filterPriceRanges, setFilterPriceRanges] = useState<string[]>(persisted?.filterPriceRanges ?? []);
  const [filterShopServices, setFilterShopServices] = useState<string[]>(persisted?.filterShopServices ?? []);
  const [filterProductCategories, setFilterProductCategories] = useState<string[]>(persisted?.filterProductCategories ?? []);


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
          filterShopTypes, filterPriceRanges, filterShopServices, filterProductCategories,
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
    filterShopTypes, filterPriceRanges, filterShopServices, filterProductCategories,
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

  // The subcategory ids the active `sub` URL param stands for. A merged group
  // key expands to every member id; a plain id stays as-is. `undefined` means a
  // merged key that cannot be resolved yet (subcategories still loading);
  // `null` means no sub filter at all.
  const activeSubIds = useMemo<string[] | null | undefined>(() => {
    if (!activeSubId) return null;
    if (activeSubId.startsWith("merged:")) {
      if (!subcategories) return undefined;
      const ids = subIdsForKey(activeSubId, subcategories);
      return ids && ids.length > 0 ? ids : null;
    }
    return [activeSubId];
  }, [activeSubId, subcategories]);

  const { data: listings, isLoading, isError: listingsError, refetch: refetchListings, isFetching: listingsFetching } = useQuery({
    queryKey: ["listings-by-category", id, activeSubIds ? activeSubIds.join(",") : ""],
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
      if (activeSubIds === undefined) return []; // merged key not resolvable yet
      if (activeSubIds) {
        // Include listings assigned directly to these subcategories (one, or
        // every member of a merged group) OR to any sub-subcategory under them
        // (hierarchical refinement)
        const [{ data: subJunction, error: sErr }, { data: ssList }] = await Promise.all([
          supabase.from("listing_subcategories").select("listing_id").in("subcategory_id", activeSubIds),
          supabase.from("sub_subcategories").select("id").in("subcategory_id", activeSubIds),
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

  // Drawer options for the Category section: merged groups collapsed into one
  // option each (e.g. "Nurseries & Florists"), the rest standalone.
  const subOptions = useMemo<SubOption[]>(
    () => (subcategories ? buildSubOptions(subcategories, category?.title) : []),
    [subcategories, category?.title],
  );
  // Unique listings behind a sub option. A merged group counts listings once
  // even when one is tagged with two of its subcategories, so the pill count
  // matches the result list.
  const subCountFor = (opt: SubOption): number => {
    if (!facetCounts) return 0;
    // With no sub picked, only listings passing the other filters count.
    const keep = !activeSubId && listings ? new Set(poolFor().map((l: any) => l.id)) : null;
    const unique = new Set<string>();
    for (const sid of opt.subIds) {
      const ids = facetCounts.subListings.get(sid);
      if (ids) ids.forEach((lid: string) => { if (!keep || keep.has(lid)) unique.add(lid); });
    }
    return unique.size;
  };
  // Label the active filter shows in the drawer summary and the chip row.
  const activeSubLabel = useMemo(() => {
    if (!activeSubId) return null;
    return subOptions.find((o) => o.key === activeSubId || o.subIds.includes(activeSubId))?.label || null;
  }, [subOptions, activeSubId]);


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
        subListings: new Map<string, Set<string>>(),
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
      const subListings = new Map<string, Set<string>>();
      (subRows || []).forEach((r: any) => {
        subCounts.set(r.subcategory_id, (subCounts.get(r.subcategory_id) || 0) + 1);
        let ids = subListings.get(r.subcategory_id);
        if (!ids) { ids = new Set<string>(); subListings.set(r.subcategory_id, ids); }
        ids.add(r.listing_id);
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

      return { total: allIds.length, subCounts, subListings, cuisine, vibe, meal, seating, openNow, saved: savedCount };
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
    filterShopTypes.length > 0 ? 1 : 0,
    filterPriceRanges.length > 0 ? 1 : 0,
    filterShopServices.length > 0 ? 1 : 0,
    filterProductCategories.length > 0 ? 1 : 0,
  ].reduce((a, b) => a + b, 0);
  const filterBarRef = useRef<HTMLDivElement | null>(null);
  useFilterBarReset(filterBarRef, activeFilterCount > 0 || !!search.trim());


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
    setFilterShopTypes([]);
    setFilterPriceRanges([]);
    setFilterShopServices([]);
    setFilterProductCategories([]);
    setOpenSection(null);
  };


  const toggleArrayFilter = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const categoryTitle = category?.title || "Category";
  const isRestaurant = category ? isRestaurantCategory(category.title) : false;
  const isAccom = category ? isAccommodationCategory(category.title) : false;
  const isShopping = category ? isShoppingCategory(category.title) : false;

  // Faceted filtering: each option list counts against the listings that
  // already pass every other active filter, so the drawer never offers a
  // choice that would leave no results. "Any of" sections skip their own
  // filter; "all of" sections (yes/no ticks) count with it applied.
  const passesFilters = (l: any, skip?: string): boolean => {
    const anyOf = (vals: unknown, picked: string[]) => {
      const have = ((vals as string[]) || []).map((v) => (v || "").trim().toLowerCase());
      return picked.some((p) => have.includes(p.toLowerCase()));
    };
    const scalar = (v: unknown) => String(v ?? "").trim().toLowerCase();
    if (sortBy === "rating" && !hasGoogleRating(l)) return false;
    if (skip !== "cuisine" && filterCuisine.length > 0 && !anyOf(l.cuisine, filterCuisine)) return false;
    if (skip !== "vibe" && filterVibe.length > 0 && !anyOf(l.vibe, filterVibe)) return false;
    if (skip !== "meal" && filterMeal.length > 0 && !anyOf(l.meal, filterMeal)) return false;
    if (skip !== "foods" && filterFoods.length > 0 && !anyOf(l.foods, filterFoods)) return false;
    if (skip !== "service_type" && filterServiceType.length > 0 && !anyOf(l.service_type, filterServiceType)) return false;
    if (skip !== "seating" && filterSeating.length > 0 && !anyOf(l.seating, filterSeating)) return false;
    if (filterKids.length > 0 && !filterKids.every((k) => l[k] === true)) return false;
    if (filterDrinks.length > 0 && !filterDrinks.every((k) => l[k] === true)) return false;
    if (filterAccessibility.length > 0 && !filterAccessibility.every((k) => l[k] === true)) return false;
    if (filterChildFriendly && !l.good_for_kids && !l.child_friendly) return false;
    if (filterPetFriendly && !l.pets_allowed) return false;
    if (filterWheelchair && !l.wheelchair_friendly) return false;
    if (filterWifi && !l.has_wifi && !l.has_free_wifi && !l.has_wifi_accom) return false;
    if (filterOpenNow && !isAnyOpenNow(l)) return false;
    if (filterSaved && !(savedIds && savedIds.has(l.id))) return false;
    if (filterBeenTo && !(beenIds && beenIds.has(l.id))) return false;
    if (skip !== "km" && filterMaxKm < MAX_KM) {
      const raw = l.km_from_town;
      const km = raw == null || raw === "" ? NaN : parseFloat(String(raw).replace(",", ".").replace(/[^0-9.]/g, ""));
      if (!Number.isFinite(km) || km > filterMaxKm) return false;
    }
    if (skip !== "property_type" && filterPropertyTypes.length > 0) {
      const pt = scalar(l.property_type);
      if (!pt || !filterPropertyTypes.some((t) => t.toLowerCase() === pt)) return false;
    }
    if (skip !== "min_nights" && filterMinNights.length > 0) {
      // An empty minimum stay counts as one night.
      const mn = Number(l.min_nights) || 1;
      if (!filterMinNights.some((n) => mn <= n)) return false;
    }
    if (skip !== "grading" && filterGrading.length > 0 && !filterGrading.includes(Number(l.star_rating) || 0)) return false;
    if (skip !== "shop_type" && filterShopTypes.length > 0) {
      const st = scalar(l.shop_type);
      if (!st || !filterShopTypes.includes(st)) return false;
    }
    if (skip !== "price_range" && filterPriceRanges.length > 0) {
      const pr = scalar(l.price_range);
      if (!pr || !filterPriceRanges.includes(pr)) return false;
    }
    if (skip !== "product_categories" && filterProductCategories.length > 0 && !anyOf(l.primary_product_categories, filterProductCategories)) return false;
    if (filterShopServices.length > 0 && !filterShopServices.every((k) => l[k] === true)) return false;
    if (filterAccomAmenities.length > 0 && !filterAccomAmenities.every((k) => l[k] === true)) return false;
    return true;
  };
  const poolFor = (skip?: string): any[] => (listings || []).filter((l: any) => passesFilters(l, skip));
  const countValues = (field: string, pool: any[]) => {
    const m = new Map<string, number>();
    pool.forEach((l) => {
      const seen = new Set<string>();
      ((l[field] as string[]) || []).forEach((v) => { const k = (v || "").trim().toLowerCase(); if (k) seen.add(k); });
      seen.forEach((k) => m.set(k, (m.get(k) || 0) + 1));
    });
    return m;
  };
  const cuisineCounts = countValues("cuisine", poolFor("cuisine"));
  const vibeCounts = countValues("vibe", poolFor("vibe"));
  const mealCounts = countValues("meal", poolFor("meal"));
  // Top pill counts follow every filter already applied, like the drawer.
  const barPool = poolFor();
  const savedInPool = savedIds ? barPool.filter((l: any) => savedIds.has(l.id)).length : 0;

  // Restaurant & cafe facets, all derived from what the listings actually carry
  // so that values added later show up as filters on their own.
  const arrayFacetOptions = (field: string, picked: string[]) => {
    if (!isRestaurant || !listings) return [];
    const counts = countValues(field, poolFor(field));
    const labels = new Map<string, string>();
    (listings as any[]).forEach((l) => {
      (l[field] || []).forEach((raw: string) => {
        const val = (raw || "").trim();
        if (!val) return;
        if (!isRestaurantOptionAllowed(field, val)) return;
        const key = val.toLowerCase();
        if (!(counts.get(key) || picked.some((p) => p.toLowerCase() === key))) return;
        if (!labels.has(key)) labels.set(key, formatServiceLabel(val));
      });
    });
    return Array.from(labels.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([key, label]) => ({ value: key, label: withCount(label, counts.get(key)) }));
  };

  const boolFacetOptions = (opts: { key: string; label: string }[], picked: string[]) => {
    if (!isRestaurant || !listings) return [];
    const pool = poolFor();
    return opts
      .map(({ key, label }) => {
        const count = pool.filter((l) => l[key] === true).length;
        return { key, label: withCount(label, count), count };
      })
      .filter((o) => o.count > 0 || picked.includes(o.key));
  };

  const foodsOptions = arrayFacetOptions("foods", filterFoods);
  const serviceTypeOptions = arrayFacetOptions("service_type", filterServiceType);
  const seatingOptions = arrayFacetOptions("seating", filterSeating);
  const kidsOptions = boolFacetOptions(KIDS_OPTIONS, filterKids);
  const drinkOptions = boolFacetOptions(DRINK_OPTIONS, filterDrinks);
  const accessibilityOptions = boolFacetOptions(ACCESSIBILITY_OPTIONS, filterAccessibility);


  // Accommodation filter options derived from what is actually in use.
  // Shared builder for single-value fields: labels come from the whole
  // category, counts from listings passing the other filters; an option with
  // nothing left drops out unless it is the one already picked.
  const scalarOptions = (field: string, pickedKeys: string[], valueOf: (key: string, label: string) => string) => {
    if (!listings) return [];
    const counts = new Map<string, number>();
    poolFor(field).forEach((l) => {
      const k = String(l[field] ?? "").trim().toLowerCase();
      if (k) counts.set(k, (counts.get(k) || 0) + 1);
    });
    const labels = new Map<string, string>();
    (listings as any[]).forEach((l) => {
      const raw = String(l[field] ?? "").trim();
      if (!raw) return;
      const key = raw.toLowerCase();
      if (!labels.has(key)) labels.set(key, raw);
    });
    return Array.from(labels.entries())
      .filter(([key]) => (counts.get(key) || 0) > 0 || pickedKeys.includes(key))
      .sort((x, y) => x[1].localeCompare(y[1]))
      .map(([key, label]) => ({ value: valueOf(key, label), label: withCount(label, counts.get(key)), plain: label }));
  };

  const boolOptions = (opts: { key: string; label: string }[], picked: string[]) => {
    const pool = poolFor();
    return opts
      .map(({ key, label }) => {
        const count = pool.filter((l) => l[key] === true).length;
        return { key, label: withCount(label, count), count };
      })
      .filter((o) => o.count > 0 || picked.includes(o.key));
  };

  // Accommodation filter options derived from what is actually in use.
  const propertyTypeOptions = isAccom
    ? scalarOptions("property_type", filterPropertyTypes.map((t) => t.toLowerCase()), (_k, label) => label)
    : [];

  const gradingOptions = (() => {
    if (!isAccom || !listings) return [];
    // Star value 0 means "Not Graded": anything without a usable 1-5 rating.
    const counts = new Map<number, number>();
    poolFor("grading").forEach((l) => {
      const sr = Number(l.star_rating) || 0;
      const v = sr >= 1 && sr <= 5 ? sr : 0;
      counts.set(v, (counts.get(v) || 0) + 1);
    });
    return [5, 4, 3, 2, 1, 0]
      .filter((v) => (counts.get(v) || 0) > 0 || filterGrading.includes(v))
      .map((v) => ({
        value: v,
        plain: v === 0 ? "Not Graded" : `${v}-Star`,
        label: withCount(v === 0 ? "Not Graded" : `${v}-Star`, counts.get(v)),
      }));
  })();

  const minNightsOptions = (() => {
    if (!isAccom || !listings) return [];
    // Stay lengths come from the whole category; each counts places whose minimum fits, under the other filters.
    const vals = Array.from(new Set((listings as any[]).map((l) => Number(l.min_nights) || 1)))
      .filter((v) => v > 1)
      .sort((x, y) => x - y);
    if (vals.length === 0) return [];
    const pool = poolFor("min_nights");
    const fits = (n: number) => pool.filter((l) => (Number(l.min_nights) || 1) <= n).length;
    return [
      { value: 1, label: withCount("1 Night", fits(1)), n: fits(1) },
      ...vals.map((n) => ({ value: n, label: withCount(`${n} Nights`, fits(n)), n: fits(n) })),
    ].filter((o) => o.n > 0 || filterMinNights.includes(o.value));
  })();

  const accomAmenityOptions = isAccom && listings ? boolOptions(ACCOM_AMENITY_OPTIONS, filterAccomAmenities) : [];

  // Shopping facets, derived from the listings so new values appear on their own.
  const shopTypeOptions = isShopping ? scalarOptions("shop_type", filterShopTypes, (k) => k) : [];
  // Accommodation reads its price band (Budget, Mid-Range, Luxury) cheapest first.
  const PRICE_BAND_ORDER = ["budget", "mid-range", "luxury"];
  const priceRangeOptions = isShopping
    ? scalarOptions("price_range", filterPriceRanges, (k) => k)
    : isAccom
      ? scalarOptions("price_range", filterPriceRanges, (k) => k)
          .map((o) => ({ ...o, label: formatDetailLabel(o.label), plain: formatDetailLabel(o.plain) }))
          .sort((x, y) => {
            const rank = (v: string) => { const i = PRICE_BAND_ORDER.indexOf(v.replace(/[–—\s]+/g, "-")); return i < 0 ? 99 : i; };
            return rank(x.value) - rank(y.value) || x.plain.localeCompare(y.plain);
          })
      : [];
  const productCategoryOptions = (() => {
    if (!isShopping || !listings) return [];
    // Filter-only field: the displayed `product_categories` never contribute.
    const counts = countValues("primary_product_categories", poolFor("product_categories"));
    const labels = new Map<string, string>();
    (listings as any[]).forEach((l) => {
      ((l.primary_product_categories as string[]) || []).forEach((raw) => {
        const val = (raw || "").trim();
        if (val && !labels.has(val.toLowerCase())) labels.set(val.toLowerCase(), val);
      });
    });
    return Array.from(labels.entries())
      .filter(([key]) => (counts.get(key) || 0) > 0 || filterProductCategories.includes(key))
      .sort((x, y) => x[1].localeCompare(y[1]))
      .map(([key, label]) => ({ value: key, label: withCount(label, counts.get(key)), plain: label }));
  })();

  const shopServiceOptions = isShopping && listings ? boolOptions(SHOPPING_SERVICE_OPTIONS, filterShopServices) : [];


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
      return passesFilters(l);
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

  }, [listings, filterCuisine, filterVibe, filterMeal, filterSeating, filterFoods, filterServiceType, filterKids, filterDrinks, filterAccessibility, filterChildFriendly, filterPetFriendly, filterWheelchair, filterWifi, filterOpenNow, filterSaved, filterBeenTo, filterMaxKm, filterPropertyTypes, filterMinNights, filterGrading, filterAccomAmenities, filterShopTypes, filterPriceRanges, filterShopServices, filterProductCategories, savedIds, beenIds, sortBy, search, categoryRatingMean]);

  const totalCount = listings?.length ?? 0;
  // The count only appears once the listings have actually arrived — a header
  // that reads "0 Listings" while the query is still in flight reads as broken.
  const countReady = listings != null && !listingsError;

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
      <div style={{ minHeight: "100vh", paddingBottom: "var(--nav-clearance)", background: PAGE_BG, fontFamily: sans, color: INK }}>
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
      <div style={{ minHeight: "100vh", paddingBottom: "var(--nav-clearance)", background: PAGE_BG, fontFamily: sans, color: INK }}>
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

  const barPill = (active: boolean): React.CSSProperties => ({
    background: active ? "#423324" : "#FFFFFF",
    border: `1px solid ${active ? "#423324" : "rgba(26,26,26,0.08)"}`,
    borderRadius: 999, height: PILL_HEIGHT, padding: "7px 14px", cursor: "pointer",
    ...tabStyle(active), lineHeight: 1, color: active ? "#FFFFFF" : "#1A1A1A",
    whiteSpace: "nowrap", flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6,
  });
  const outlinePill: React.CSSProperties = {
    background: "transparent", border: "1.5px solid #423324", borderRadius: 999, height: PILL_HEIGHT,
    padding: "6.5px 12px", cursor: "pointer", ...tabStyle(false), lineHeight: 1, color: "#423324",
    whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 6,
  };
  const handleQuickPill = (apply: () => void) => {
    apply();
    window.scrollTo({ top: 0, behavior: "smooth" });
    filterBarRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  };
  const appliedChips: { label: string; onRemove: () => void }[] = [
          ...(activeSubId
            ? [{
                label: activeSubLabel || "Category",
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
          ...(filterMaxKm < MAX_KM ? [{ label: `Max ${filterMaxKm}km from town`, onRemove: () => setFilterMaxKm(MAX_KM) }] : []),

          ...(filterChildFriendly ? [{ label: "Child-Friendly", onRemove: () => setFilterChildFriendly(false) }] : []),
          ...(filterPetFriendly ? [{ label: "Pet-Friendly", onRemove: () => setFilterPetFriendly(false) }] : []),
          ...(filterWheelchair ? [{ label: "Wheelchair-Friendly", onRemove: () => setFilterWheelchair(false) }] : []),
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
            label: g === 0 ? "Not Graded" : `${g}-Star Grading`,
            onRemove: () => setFilterGrading(filterGrading.filter((x) => x !== g)),
          })),
          ...filterAccomAmenities.map((k) => ({
            label: ACCOM_AMENITY_OPTIONS.find((o) => o.key === k)?.label ?? k,
            onRemove: () => setFilterAccomAmenities(filterAccomAmenities.filter((x) => x !== k)),
          })),
          ...filterShopTypes.map((t) => ({
            label: shopTypeOptions.find((o) => o.value === t)?.plain ?? t,
            onRemove: () => setFilterShopTypes(filterShopTypes.filter((x) => x !== t)),
          })),
          ...filterPriceRanges.map((t) => ({
            label: priceRangeOptions.find((o) => o.value === t)?.plain ?? t,
            onRemove: () => setFilterPriceRanges(filterPriceRanges.filter((x) => x !== t)),
          })),
          ...filterProductCategories.map((t) => ({
            label: productCategoryOptions.find((o) => o.value === t)?.plain ?? t,
            onRemove: () => setFilterProductCategories(filterProductCategories.filter((x) => x !== t)),
          })),
          ...filterShopServices.map((k) => ({
            label: SHOPPING_SERVICE_OPTIONS.find((o) => o.key === k)?.label ?? k,
            onRemove: () => setFilterShopServices(filterShopServices.filter((x) => x !== k)),
          })),
        ];
  const filtersOn = activeFilterCount > 0;

  // The header row and its pinned copy are the same bar, so they are built
  // once here and handed to both.
  const headerSubtitle = countReady ? (
    <div style={type.label}>
      {totalCount} {totalCount === 1 ? "Listing" : "Listings"}
    </div>
  ) : undefined;

  const headerActions = (
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
    </>
  );

  return (
    <div
      style={{
        minHeight: "100vh",

        paddingBottom: "var(--nav-clearance)",
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
        subtitle={headerSubtitle}
        right={headerActions}
      />
      <StickyHeader
        background={PAGE_BG}
        title={displayTitle}
        subtitle={headerSubtitle}
        right={headerActions}
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

      {/* Filters button inline at the head of the pill row, matching Events and Specials. */}
      <div
        ref={filterBarRef}
        className="scrollbar-hide"
        style={{ marginTop: 12, paddingLeft: 20, paddingTop: 4, paddingBottom: 4, display: "flex", alignItems: "center", gap: 8, overflowX: "auto", scrollbarWidth: "none" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <button
            aria-label="Filters and sort"
            aria-haspopup="dialog"
            onClick={() => setRefineOpen(true)}
            style={{ ...barPill(false), padding: "7px 12px 7px 14px" }}
          >
            <SlidersHorizontal size={PILL_ICON_SIZE} strokeWidth={1.9} style={{ flexShrink: 0, transform: `translateY(${PILL_ICON_NUDGE})` }} />
            Filters
            {activeFilterCount > 0 && (
              <span
                aria-label={`${activeFilterCount} ${activeFilterCount === 1 ? "filter" : "filters"} applied`}
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: PILL_BADGE_SIZE, height: PILL_BADGE_SIZE, padding: "0 4px", borderRadius: 999, background: "#423324", color: "#FFFFFF", fontFamily: sans, fontSize: 10, fontWeight: 700, lineHeight: 1, letterSpacing: 0 }}
              >
                <span style={{ display: "block", transform: `translateY(${PILL_BADGE_NUDGE})` }}>{activeFilterCount}</span>
              </span>
            )}
          </button>
          <span aria-hidden="true" style={{ width: 1, height: 20, background: "rgba(26,26,26,0.10)", flexShrink: 0 }} />
          {filtersOn && (
            <button onClick={clearAllFilters} style={outlinePill}>
              <X size={PILL_ICON_SIZE} strokeWidth={2} style={{ flexShrink: 0, transform: `translateY(${PILL_ICON_NUDGE})` }} />
              Clear All
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0, paddingRight: 20 }}>
          <button onClick={() => { clearAllFilters(); }} style={barPill(allPillActive(filtersOn, !!search.trim()))}>
            All{facetCounts ? ` (${facetCounts.total})` : ""}
          </button>
          <button onClick={() => handleQuickPill(() => setFilterOpenNow(!filterOpenNow))} style={barPill(filterOpenNow)}>
            Open Now{listings ? ` (${barPool.filter((l: any) => isAnyOpenNow(l)).length})` : ""}
          </button>
          {user && (filterSaved || savedInPool > 0) && (
            <button onClick={() => handleQuickPill(() => setFilterSaved(!filterSaved))} style={barPill(filterSaved)}>
              My Saved{listings ? ` (${savedInPool})` : ""}
            </button>
          )}
          {isRestaurant && ([
            { label: "Pet-Friendly", on: filterPetFriendly, set: setFilterPetFriendly, n: barPool.filter((l: any) => l.pets_allowed === true).length },
            { label: "Child-Friendly", on: filterChildFriendly, set: setFilterChildFriendly, n: barPool.filter((l: any) => l.good_for_kids === true || l.child_friendly === true).length },
            { label: "Wheelchair-Friendly", on: filterWheelchair, set: setFilterWheelchair, n: barPool.filter((l: any) => l.wheelchair_friendly === true).length },
          ].filter((p) => p.on || p.n > 0).map((p) => (
            <button key={p.label} onClick={() => handleQuickPill(() => p.set(!p.on))} style={barPill(p.on)}>
              {p.label}{listings ? ` (${p.n})` : ""}
            </button>
          )))}
          {isAccom && ([
            { label: "Free Breakfast", on: filterAccomAmenities.includes("breakfast_included"), toggle: () => toggleArrayFilter(filterAccomAmenities, "breakfast_included", setFilterAccomAmenities), n: barPool.filter((l: any) => l.breakfast_included === true).length },
            { label: "Child-Friendly", on: filterAccomAmenities.includes("child_friendly"), toggle: () => toggleArrayFilter(filterAccomAmenities, "child_friendly", setFilterAccomAmenities), n: barPool.filter((l: any) => l.child_friendly === true).length },
            { label: "5-Star", on: filterGrading.includes(5), toggle: () => setFilterGrading(filterGrading.includes(5) ? filterGrading.filter((g) => g !== 5) : [...filterGrading, 5]), n: barPool.filter((l: any) => Number(l.star_rating) === 5).length },
          ].filter((p) => p.on || p.n > 0).map((p) => (
            <button key={p.label} onClick={() => handleQuickPill(p.toggle)} style={barPill(p.on)}>
              {p.label}{listings ? ` (${p.n})` : ""}
            </button>
          )))}
        </div>
      </div>

      {/* Applied filters, one removable chip each */}
      {appliedChips.length > 0 && (
        <div className="scrollbar-hide" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "6px 20px 4px" }}>
          {appliedChips.map((chip, i) => (
            <button key={`${chip.label}-${i}`} onClick={chip.onRemove} aria-label={`Remove ${chip.label} filter`} style={{ ...outlinePill, flexShrink: 0 }}>
              <X size={PILL_ICON_SIZE} strokeWidth={2} style={{ flexShrink: 0, transform: `translateY(${PILL_ICON_NUDGE})` }} />
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Results heading once anything is narrowed: one filter names itself. */}
      {(filtersOn || search.trim()) && (
        <h2 style={{ fontFamily: NOHEMI, fontSize: 24, fontWeight: 550, color: "#1A1A1A", margin: "42px 20px 14px", lineHeight: 1.2, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {appliedChips.length === 1 && !search.trim() ? appliedChips[0].label : "Listings"}
          {!isLoading && <span style={{ color: TOKEN_MUTED, fontWeight: 400, fontSize: 16, fontFamily: sans, lineHeight: 1, transform: "translateY(1px)" }}>({filteredListings.length})</span>}
        </h2>
      )}
      {!(filtersOn || search.trim()) && <div style={{ height: 16 }} />}

      <RefineDrawer
        open={refineOpen}
        onClose={() => setRefineOpen(false)}
        onClear={clearAllFilters}
        resultsCount={filteredListings.length}
        resultsLabel="listings"
        activeChips={appliedChips}
      >
        <RefineSection
          label="Sort By"
          onClear={sortBy !== "default" ? () => setSortBy("default") : undefined}
          summary={SORT_LABELS[sortBy]}
          open={openSection === "sort"}
          onToggle={() => setOpenSection(openSection === "sort" ? null : "sort")}
        >

          {(["default", "name_asc", "name_desc", "rating", "distance"] as SortKey[]).map((key) => (
            <RefineOption
              key={key}
              label={SORT_LABELS[key]}
              active={sortBy === key}
              onClick={() => setSortBy(pillToggle(sortBy, key, "default"))}
            />
          ))}

        </RefineSection>

        {subOptions.length > 0 && (() => {
          const visibleOpts = subOptions.filter(
            (opt) => !facetCounts || subCountFor(opt) > 0,
          );
          if (visibleOpts.length === 0) return null;
          return (
            <RefineSection
              label="Category"
              onClear={activeSubId ? () => handleSubFilter(null) : undefined}
              summary={
                activeSubId
                  ? activeSubLabel || undefined
                  : undefined
              }
              open={openSection === "subcategory"}
              onToggle={() => setOpenSection(openSection === "subcategory" ? null : "subcategory")}
            >
              <RefineRectOption label={withCount("All", facetCounts?.total)} active={!activeSubId} onClick={() => handleSubFilter(null)} />
              {visibleOpts.map((opt) => (
                <RefineRectOption
                  key={opt.key}
                  label={withCount(opt.label, subCountFor(opt))}
                  active={activeSubId != null && (activeSubId === opt.key || opt.subIds.includes(activeSubId))}
                  onClick={() =>
                    handleSubFilter(
                      activeSubId != null &&
                        (activeSubId === opt.key || opt.subIds.includes(activeSubId))
                        ? null
                        : opt.key,
                    )
                  }
                />
              ))}
            </RefineSection>
          );
        })()}

        {isRestaurant && (() => {
          const filterOpts = (opts: string[], map: Map<string, number>, picked: string[]) =>
            opts.filter((o) => (map.get(o.toLowerCase()) || 0) > 0 || picked.includes(o));
          const cuisines = filterOpts(CUISINE_OPTIONS, cuisineCounts, filterCuisine).filter((c) => isRestaurantOptionAllowed("cuisine", c));
          const vibes = filterOpts(VIBE_OPTIONS, vibeCounts, filterVibe);
          const meals = filterOpts(MEAL_OPTIONS, mealCounts, filterMeal);
          return (
            <>
              {cuisines.length > 0 && (
                <RefineSection
                  label="Cuisine"
                  onClear={filterCuisine.length > 0 ? () => setFilterCuisine([]) : undefined}
                  summary={filterCuisine.length > 0 ? `${filterCuisine.length} selected` : undefined}
                  open={openSection === "cuisine"}
                  onToggle={() => setOpenSection(openSection === "cuisine" ? null : "cuisine")}
                >
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {cuisines.map((c) => (
                      <RefineChip key={c} label={withCount(c, cuisineCounts.get(c.toLowerCase()))} active={filterCuisine.includes(c)} onClick={() => toggleArrayFilter(filterCuisine, c, setFilterCuisine)} />
                    ))}
                  </div>
                </RefineSection>
              )}
              {vibes.length > 0 && (
                <RefineSection
                  label="Vibe"
                  onClear={filterVibe.length > 0 ? () => setFilterVibe([]) : undefined}
                  summary={filterVibe.length > 0 ? `${filterVibe.length} selected` : undefined}
                  open={openSection === "vibe"}
                  onToggle={() => setOpenSection(openSection === "vibe" ? null : "vibe")}
                >
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {vibes.map((v) => (
                      <RefineChip key={v} label={withCount(v, vibeCounts.get(v.toLowerCase()))} active={filterVibe.includes(v)} onClick={() => toggleArrayFilter(filterVibe, v, setFilterVibe)} />
                    ))}
                  </div>
                </RefineSection>
              )}
              {meals.length > 0 && (
                <RefineSection
                  label="Meal"
                  onClear={filterMeal.length > 0 ? () => setFilterMeal([]) : undefined}
                  summary={filterMeal.length > 0 ? `${filterMeal.length} selected` : undefined}
                  open={openSection === "meal"}
                  onToggle={() => setOpenSection(openSection === "meal" ? null : "meal")}
                >
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {meals.map((m) => (
                      <RefineChip key={m} label={withCount(m, mealCounts.get(m.toLowerCase()))} active={filterMeal.includes(m)} onClick={() => toggleArrayFilter(filterMeal, m, setFilterMeal)} />
                    ))}
                  </div>
                </RefineSection>
              )}
              {seatingOptions.length > 0 && (
                <RefineSection
                  label="Seating"
                  onClear={filterSeating.length > 0 ? () => setFilterSeating([]) : undefined}
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
                  onClear={filterFoods.length > 0 ? () => setFilterFoods([]) : undefined}
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
                  onClear={filterDrinks.length > 0 ? () => setFilterDrinks([]) : undefined}
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
                  onClear={filterServiceType.length > 0 ? () => setFilterServiceType([]) : undefined}
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
                  label="Kids & Babies"
                  onClear={filterKids.length > 0 ? () => setFilterKids([]) : undefined}
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
                  onClear={filterAccessibility.length > 0 ? () => setFilterAccessibility([]) : undefined}
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
            onClear={filterPropertyTypes.length > 0 ? () => setFilterPropertyTypes([]) : undefined}
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
            onClear={filterMinNights.length > 0 ? () => setFilterMinNights([]) : undefined}
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
            onClear={filterGrading.length > 0 ? () => setFilterGrading([]) : undefined}
            summary={filterGrading.length > 0 ? `${filterGrading.length} selected` : undefined}
            open={openSection === "grading"}
            onToggle={() => setOpenSection(openSection === "grading" ? null : "grading")}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {gradingOptions.map((g) => (
                <RefineChip
                  key={g.value}
                  label={g.label}
                  active={filterGrading.includes(g.value)}
                  onClick={() =>
                    setFilterGrading(filterGrading.includes(g.value)
                      ? filterGrading.filter((x) => x !== g.value)
                      : [...filterGrading, g.value])
                  }
                />
              ))}
            </div>
          </RefineSection>
        )}

        {isAccom && accomAmenityOptions.length > 0 && (
          <RefineSection
            label="Amenities"
            onClear={filterAccomAmenities.length > 0 ? () => setFilterAccomAmenities([]) : undefined}
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


        {isShopping && shopTypeOptions.length > 0 && (
          <RefineSection
            label="Shop Type"
            onClear={filterShopTypes.length > 0 ? () => setFilterShopTypes([]) : undefined}
            summary={filterShopTypes.length > 0 ? `${filterShopTypes.length} selected` : undefined}
            open={openSection === "shoptype"}
            onToggle={() => setOpenSection(openSection === "shoptype" ? null : "shoptype")}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {shopTypeOptions.map((t) => (
                <RefineChip
                  key={t.value}
                  label={t.label}
                  active={filterShopTypes.includes(t.value)}
                  onClick={() => toggleArrayFilter(filterShopTypes, t.value, setFilterShopTypes)}
                />
              ))}
            </div>
          </RefineSection>
        )}

        {(isShopping || isAccom) && priceRangeOptions.length > 0 && (
          <RefineSection
            label={isAccom ? "Pricing" : "Price Range"}
            onClear={filterPriceRanges.length > 0 ? () => setFilterPriceRanges([]) : undefined}
            summary={filterPriceRanges.length > 0 ? `${filterPriceRanges.length} selected` : undefined}
            open={openSection === "pricerange"}
            onToggle={() => setOpenSection(openSection === "pricerange" ? null : "pricerange")}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {priceRangeOptions.map((t) => (
                <RefineChip
                  key={t.value}
                  label={t.label}
                  active={filterPriceRanges.includes(t.value)}
                  onClick={() => toggleArrayFilter(filterPriceRanges, t.value, setFilterPriceRanges)}
                />
              ))}
            </div>
          </RefineSection>
        )}

        {isShopping && productCategoryOptions.length > 0 && (
          <RefineSection
            label="Product Categories"
            onClear={filterProductCategories.length > 0 ? () => setFilterProductCategories([]) : undefined}
            summary={filterProductCategories.length > 0 ? `${filterProductCategories.length} selected` : undefined}
            open={openSection === "prodcat"}
            onToggle={() => setOpenSection(openSection === "prodcat" ? null : "prodcat")}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {productCategoryOptions.map((t) => (
                <RefineChip
                  key={t.value}
                  label={t.label}
                  active={filterProductCategories.includes(t.value)}
                  onClick={() => toggleArrayFilter(filterProductCategories, t.value, setFilterProductCategories)}
                />
              ))}
            </div>
          </RefineSection>
        )}

        {isShopping && shopServiceOptions.length > 0 && (
          <RefineSection
            label="Shopping Options"
            onClear={filterShopServices.length > 0 ? () => setFilterShopServices([]) : undefined}
            summary={filterShopServices.length > 0 ? `${filterShopServices.length} selected` : undefined}
            open={openSection === "shopservices"}
            onToggle={() => setOpenSection(openSection === "shopservices" ? null : "shopservices")}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {shopServiceOptions.map((o) => (
                <RefineChip
                  key={o.key}
                  label={o.label}
                  active={filterShopServices.includes(o.key)}
                  onClick={() => toggleArrayFilter(filterShopServices, o.key, setFilterShopServices)}
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
            formatValue={(v) => `${v}km`}
            minLabel="0.5km"
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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: "72px 24px 80px",
          }}
        >
          <Loader2 size={22} className="animate-spin" color={MUTED} />
          <span style={{ ...type.label, color: MUTED }}>Loading</span>
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
