import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ChevronDown, ChevronUp, Globe, Mail, MapPin, MessageCircle, Phone, Star, SlidersHorizontal, X } from "lucide-react";
import FavouriteButton from "@/components/FavouriteButton";
import { isRestaurantCategory, isAccommodationCategory } from "@/lib/categoryFields";
import { Skeleton } from "@/components/ui/skeleton";

const CUISINE_OPTIONS = ["African", "Italian", "Indian", "Asian", "Mexican", "Mediterranean", "American", "Steakhouse", "Seafood", "Pizza", "Sushi", "Vegetarian"];
const VIBE_OPTIONS = ["Casual", "Fine Dining", "Family", "Romantic", "Outdoor", "Live Music", "Sports Bar", "Trendy", "Cozy"];
const MEAL_OPTIONS = ["Breakfast", "Brunch", "Lunch", "Dinner"];
const SEATING_OPTIONS = ["Indoor", "Outdoor", "Both"];

const CategoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSubId = searchParams.get("sub");
  const [showFilters, setShowFilters] = useState(false);
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

  const { data: allCategories } = useQuery({
    queryKey: ["all-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, title").order("sort_order");

      if (error) throw error;
      return data;
    },
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
    if (subId) {
      setSearchParams({ sub: subId });
    } else {
      setSearchParams({});
    }
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
    setter(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };

  const categoryTitle = category?.title || "Category";
  const categoryDescription = category?.description || "Discover local cafés, great meals and favourite places to eat.";
  const isRestaurant = category ? isRestaurantCategory(category.title) : false;
  const isAccom = category ? isAccommodationCategory(category.title) : false;

  const filteredListings = useMemo(() => {
    if (!listings) return [];
    return listings.filter(l => {
      if (filterCuisine.length > 0) {
        const lc = (l.cuisine || []).map(c => c.toLowerCase());
        if (!filterCuisine.some(c => lc.includes(c.toLowerCase()))) return false;
      }
      if (filterVibe.length > 0) {
        const lv = (l.vibe || []).map(v => v.toLowerCase());
        if (!filterVibe.some(v => lv.includes(v.toLowerCase()))) return false;
      }
      if (filterMeal.length > 0) {
        const lm = (l.meal || []).map(m => m.toLowerCase());
        if (!filterMeal.some(m => lm.includes(m.toLowerCase()))) return false;
      }
      if (filterSeating.length > 0) {
        const ls = (l.seating || []).map(s => s.toLowerCase());
        if (!filterSeating.some(s => ls.includes(s.toLowerCase()))) return false;
      }
      if (filterChildFriendly && !l.good_for_kids && !l.child_friendly) return false;
      if (filterPetFriendly && !l.pets_allowed) return false;
      if (filterWheelchair && !l.wheelchair_friendly) return false;
      if (filterWifi && !l.has_wifi && !l.has_free_wifi && !l.has_wifi_accom) return false;
      return true;
    });
  }, [listings, filterCuisine, filterVibe, filterMeal, filterSeating, filterChildFriendly, filterPetFriendly, filterWheelchair, filterWifi]);

  return (
    <div className="min-h-screen pb-[72px]" style={{ background: "#FFFFFF" }}>
      {/* Back button */}
      <div style={{ paddingTop: 16, paddingLeft: 24, paddingRight: 24, marginBottom: 28 }}>
        <button onClick={() => navigate(-1)} className="flex items-center" style={{ gap: 6 }}>
          <ArrowLeft size={18} strokeWidth={2} style={{ color: "rgba(18,18,20,0.5)" }} />
          <span
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: "rgba(18,18,20,0.5)",
              letterSpacing: "0.2px",
            }}
          >
            Back
          </span>
        </button>
      </div>

      {/* Heading */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 12 }}>
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            textTransform: "uppercase",
            fontWeight: 900,
            fontSize: "clamp(28px, 8vw, 40px)",
            lineHeight: 1,
            letterSpacing: "-0.5px",
            color: "#121214",
            margin: 0,
            wordBreak: "break-word",
            overflowWrap: "break-word",
          }}
        >
          {categoryTitle}
        </h1>
      </div>

      {/* Subtitle */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 24 }}>
        <p
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontStyle: "italic",
            fontSize: 14,
            color: "rgba(18,18,20,0.45)",
            letterSpacing: "0.2px",
            lineHeight: 1.4,
            margin: 0,
          }}
        >
          {categoryDescription}
        </p>
      </div>

      {/* Other categories toggle */}
      {otherCategories.length > 0 && (
        <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 18 }}>
          <button onClick={() => setShowCategories((v) => !v)} className="flex items-center" style={{ gap: 8 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "rgba(18,18,20,0.4)",
                textTransform: "uppercase",
                letterSpacing: "1.5px",
              }}
            >
              Other Categories
            </span>
            {showCategories ? (
              <ChevronUp size={16} strokeWidth={2} style={{ color: "rgba(18,18,20,0.35)" }} />
            ) : (
              <ChevronDown size={16} strokeWidth={2} style={{ color: "rgba(18,18,20,0.35)" }} />
            )}
          </button>
        </div>
      )}

      {/* Other category pills */}
      {showCategories && otherCategories.length > 0 && (
        <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 28 }}>
          <div className="flex overflow-x-auto scrollbar-hide" style={{ gap: 8 }}>
            {otherCategories.map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.id}`}
                className="whitespace-nowrap"
                style={{
                  background: "rgba(18,18,20,0.04)",
                  border: "1px solid rgba(18,18,20,0.08)",
                  borderRadius: 10,
                  padding: "9px 16px",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "rgba(18,18,20,0.55)",
                }}
              >
                {cat.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Subcategory pills */}
      {subcategories && subcategories.length > 0 && (
        <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 32 }}>
          <div className="flex overflow-x-auto scrollbar-hide" style={{ gap: 8 }}>
            <button
              onClick={() => handleSubFilter(null)}
              className="whitespace-nowrap"
              style={{
                background: !activeSubId ? "#121214" : "rgba(18,18,20,0.04)",
                border: !activeSubId ? "1px solid #121214" : "1px solid rgba(18,18,20,0.08)",
                borderRadius: 10,
                padding: "9px 18px",
                fontSize: 13,
                fontWeight: !activeSubId ? 600 : 500,
                color: !activeSubId ? "#ffffff" : "rgba(18,18,20,0.5)",
              }}
            >
              All
            </button>

            {subcategories.map((sub) => (
              <button
                key={sub.id}
                onClick={() => handleSubFilter(sub.id)}
                className="whitespace-nowrap"
                style={{
                  background: activeSubId === sub.id ? "#121214" : "rgba(18,18,20,0.04)",
                  border: activeSubId === sub.id ? "1px solid #121214" : "1px solid rgba(18,18,20,0.08)",
                  borderRadius: 10,
                  padding: "9px 18px",
                  fontSize: 13,
                  fontWeight: activeSubId === sub.id ? 600 : 500,
                  color: activeSubId === sub.id ? "#ffffff" : "rgba(18,18,20,0.5)",
                }}
              >
                {sub.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ paddingLeft: 24, paddingRight: 24 }}>
        {isLoading ? (
          <div className="space-y-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="w-full" style={{ height: 280, borderRadius: 18, background: "#f0f0f0" }} />
            ))}
          </div>
        ) : listings && listings.length > 0 ? (
          <div>
            <p
              style={{
                textTransform: "uppercase",
                fontSize: 11,
                fontWeight: 600,
                color: "rgba(18,18,20,0.35)",
                letterSpacing: 3,
                marginBottom: 6,
              }}
            >
              LOCAL
            </p>
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 900,
                fontSize: 22,
                color: "#121214",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: 18,
              }}
            >
              FAVOURITES
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {listings.map((l) => {
                const hasDetail = !!(
                  l.long_description ||
                  (l.gallery_images && l.gallery_images.length > 0) ||
                  (l.opening_hours && Object.values(l.opening_hours as Record<string, string>).some((v) => v)) ||
                  (isRestaurant && l.show_attributes)
                );

                return (
                  <div
                    key={l.id}
                    onClick={hasDetail ? () => navigate(`/listing/${l.id}`) : undefined}
                    className={hasDetail ? "cursor-pointer active:scale-[0.99] transition-transform duration-150" : ""}
                    style={{
                      background: "rgba(18,18,20,0.04)",
                      border: "1px solid rgba(18,18,20,0.06)",
                      borderRadius: 18,
                      overflow: "hidden",
                    }}
                  >
                    {/* Image */}
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        height: 190,
                        background: "#f0f0f0",
                      }}
                    >
                      {l.image_url ? (
                        <img src={l.image_url} alt={l.title} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full" style={{ background: "#f0f0f0" }} />
                      )}

                      {/* Heart */}
                      <div
                        style={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          zIndex: 2,
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FavouriteButton itemId={l.id} itemType="listing" />
                      </div>

                      {l.is_featured && (
                        <div style={{ position: "absolute", left: 12, bottom: 12 }}>
                          <span
                            className="inline-flex items-center"
                            style={{
                              gap: 5,
                              background: "rgba(255,255,255,0.92)",
                              borderRadius: 999,
                              padding: "7px 12px",
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#121214",
                              textTransform: "uppercase",
                              letterSpacing: "0.6px",
                            }}
                          >
                            <Star size={12} className="fill-current" />
                            Featured
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div style={{ padding: 16 }}>
                      <h3
                        style={{
                          fontFamily: "var(--font-heading)",
                          fontWeight: 900,
                          fontSize: 28,
                          lineHeight: 0.98,
                          letterSpacing: "-0.4px",
                          color: "#121214",
                          margin: 0,
                          marginBottom: 10,
                        }}
                      >
                        {l.title}
                      </h3>

                      {l.description && (
                        <p
                          className="line-clamp-2"
                          style={{
                            fontSize: 14,
                            color: "rgba(18,18,20,0.5)",
                            lineHeight: 1.5,
                            margin: 0,
                            marginBottom: 14,
                          }}
                        >
                          {l.description}
                        </p>
                      )}

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                        }}
                      >
                        {l.location && (
                          <p
                            className="flex items-center"
                            style={{
                              fontSize: 14,
                              color: "rgba(18,18,20,0.45)",
                              margin: 0,
                              gap: 8,
                            }}
                          >
                            <MapPin size={15} strokeWidth={2} style={{ flexShrink: 0, color: "#000000" }} />
                            <span className="truncate">{l.location}</span>
                          </p>
                        )}

                        {l.phone && (
                          <a
                            href={`tel:${l.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center"
                            style={{
                              fontSize: 14,
                              color: "rgba(18,18,20,0.45)",
                              gap: 8,
                              width: "fit-content",
                            }}
                          >
                            <Phone size={15} strokeWidth={2} style={{ flexShrink: 0, color: "#000000" }} />
                            <span>{l.phone}</span>
                          </a>
                        )}

                        {l.email && (
                          <a
                            href={`mailto:${l.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center"
                            style={{
                              fontSize: 14,
                              color: "rgba(18,18,20,0.45)",
                              gap: 8,
                              width: "fit-content",
                            }}
                          >
                            <Mail size={15} strokeWidth={2} style={{ flexShrink: 0, color: "#000000" }} />
                            <span className="truncate">{l.email}</span>
                          </a>
                        )}

                        {l.website && (
                          <a
                            href={l.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center"
                            style={{
                              fontSize: 14,
                              color: "rgba(18,18,20,0.45)",
                              gap: 8,
                              width: "fit-content",
                            }}
                          >
                            <Globe size={15} strokeWidth={2} style={{ flexShrink: 0, color: "#000000" }} />
                            <span>Website</span>
                          </a>
                        )}

                        {(l as any).whatsapp && (
                          <a
                            href={`https://wa.me/${(l as any).whatsapp.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center"
                            style={{
                              fontSize: 14,
                              color: "rgba(18,18,20,0.45)",
                              gap: 8,
                              width: "fit-content",
                            }}
                          >
                            <MessageCircle size={15} strokeWidth={2} style={{ flexShrink: 0, color: "#000000" }} />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center" style={{ paddingTop: 80 }}>
            <p
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 600,
                fontSize: 18,
                color: "#121214",
                marginBottom: 4,
              }}
            >
              No listings found
            </p>
            <p style={{ fontSize: 13, color: "rgba(18,18,20,0.45)" }}>Check back soon for places in this category</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
