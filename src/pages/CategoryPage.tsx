import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ChevronDown, ChevronUp, Globe, Mail, MapPin, MessageCircle, Phone, Star, SlidersHorizontal } from "lucide-react";
import FavouriteButton from "@/components/FavouriteButton";
import { isRestaurantCategory, isAccommodationCategory } from "@/lib/categoryFields";
import { Skeleton } from "@/components/ui/skeleton";

const CUISINE_OPTIONS = ["African", "Italian", "Indian", "Asian", "Mexican", "Mediterranean", "American", "Steakhouse", "Seafood", "Pizza", "Sushi", "Vegetarian"];
const VIBE_OPTIONS = ["Casual", "Fine Dining", "Family", "Romantic", "Outdoor", "Live Music", "Sports Bar", "Trendy", "Cozy"];
const MEAL_OPTIONS = ["Breakfast", "Brunch", "Lunch", "Dinner"];
const SEATING_OPTIONS = ["Indoor", "Outdoor", "Both"];

const font = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const FilterChip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      background: active ? "#020202" : "rgba(18,18,20,0.06)",
      border: "none",
      borderRadius: 9999,
      padding: "8px 16px",
      fontSize: 13,
      fontWeight: 500,
      fontFamily: font,
      color: active ? "#ffffff" : "#2B2420",
      cursor: "pointer",
      transition: "transform 0.12s ease",
    }}
    onPointerDown={(e) => ((e.currentTarget as HTMLElement).style.transform = "scale(0.97)")}
    onPointerUp={(e) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)")}
    onPointerLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)")}
  >
    {label}
  </button>
);

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

  const press = {
    onPointerDown: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(0.98)"),
    onPointerUp: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
    onPointerLeave: (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)"),
  };

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 84, background: "#EBEBEB", fontFamily: font }}>
      {/* Back button */}
      <div style={{ paddingTop: 16, paddingLeft: 24, paddingRight: 24, marginBottom: 8 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <ArrowLeft size={20} strokeWidth={1.8} style={{ color: "#2B2420" }} />
          <span style={{ fontSize: 15, fontWeight: 500, color: "#2B2420", fontFamily: font }}>Back</span>
        </button>
      </div>

      {/* Page title */}
      <h1
        style={{
          fontFamily: "'Helvetica World', Helvetica, Arial, sans-serif",
          fontSize: 40,
          fontWeight: 400,
          lineHeight: 0.95,
          letterSpacing: "-0.01em",
          color: "#020202",
          textTransform: "capitalize",
          paddingLeft: 20,
          paddingRight: 20,
          marginBottom: 4,
          marginTop: 0,
        }}
      >
        {categoryTitle}
      </h1>

      {/* Subtitle */}
      <p
        style={{
          fontFamily: font,
          fontSize: 15,
          fontWeight: 400,
          lineHeight: 1.35,
          color: "rgba(18, 18, 20, 0.55)",
          fontStyle: "italic",
          paddingLeft: 24,
          paddingRight: 24,
          marginBottom: 24,
          marginTop: 0,
        }}
      >
        {categoryDescription}
      </p>

      {/* Filter button */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 24 }}>
        <button
          onClick={() => setShowFilters((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 16px",
            background: "rgba(18, 18, 20, 0.06)",
            border: "none",
            borderRadius: 20,
            cursor: "pointer",
            transition: "transform 0.12s ease",
          }}
          onPointerDown={(e) => ((e.currentTarget as HTMLElement).style.transform = "scale(0.97)")}
          onPointerUp={(e) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)")}
          onPointerLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)")}
        >
          <SlidersHorizontal size={18} strokeWidth={1.8} style={{ color: "#2B2420" }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: "#2B2420", textTransform: "uppercase", letterSpacing: "0.04em", fontFamily: font }}>
            Filter
          </span>
          {activeFilterCount > 0 && (
            <span style={{ background: "#020202", color: "#fff", borderRadius: 999, width: 18, height: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>
              {activeFilterCount}
            </span>
          )}
          <ChevronDown size={14} strokeWidth={1.8} style={{ color: "rgba(18, 18, 20, 0.4)", transform: showFilters ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }} />
        </button>

        {showFilters && (
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                style={{ fontSize: 13, fontWeight: 500, color: "rgba(18,18,20,0.5)", textDecoration: "underline", alignSelf: "flex-start", background: "none", border: "none", cursor: "pointer", fontFamily: font }}
              >
                Clear all filters
              </button>
            )}

            {subcategories && subcategories.length > 0 && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 500, color: "rgba(18,18,20,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: font }}>Category</p>
                <div className="flex flex-wrap" style={{ gap: 8 }}>
                  <FilterChip label="All" active={!activeSubId} onClick={() => handleSubFilter(null)} />
                  {subcategories.map((sub) => (
                    <FilterChip key={sub.id} label={sub.title} active={activeSubId === sub.id} onClick={() => handleSubFilter(sub.id)} />
                  ))}
                </div>
              </div>
            )}

            {isRestaurant && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 500, color: "rgba(18,18,20,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: font }}>Cuisine</p>
                <div className="flex flex-wrap" style={{ gap: 8 }}>
                  {CUISINE_OPTIONS.map((c) => (
                    <FilterChip key={c} label={c} active={filterCuisine.includes(c)} onClick={() => toggleArrayFilter(filterCuisine, c, setFilterCuisine)} />
                  ))}
                </div>
              </div>
            )}

            {isRestaurant && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 500, color: "rgba(18,18,20,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: font }}>Vibe</p>
                <div className="flex flex-wrap" style={{ gap: 8 }}>
                  {VIBE_OPTIONS.map((v) => (
                    <FilterChip key={v} label={v} active={filterVibe.includes(v)} onClick={() => toggleArrayFilter(filterVibe, v, setFilterVibe)} />
                  ))}
                </div>
              </div>
            )}

            {isRestaurant && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 500, color: "rgba(18,18,20,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: font }}>Meal</p>
                <div className="flex flex-wrap" style={{ gap: 8 }}>
                  {MEAL_OPTIONS.map((m) => (
                    <FilterChip key={m} label={m} active={filterMeal.includes(m)} onClick={() => toggleArrayFilter(filterMeal, m, setFilterMeal)} />
                  ))}
                </div>
              </div>
            )}

            {isRestaurant && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 500, color: "rgba(18,18,20,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: font }}>Seating</p>
                <div className="flex flex-wrap" style={{ gap: 8 }}>
                  {SEATING_OPTIONS.map((s) => (
                    <FilterChip key={s} label={s} active={filterSeating.includes(s)} onClick={() => toggleArrayFilter(filterSeating, s, setFilterSeating)} />
                  ))}
                </div>
              </div>
            )}

            <div>
              <p style={{ fontSize: 12, fontWeight: 500, color: "rgba(18,18,20,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: font }}>Amenities</p>
              <div className="flex flex-wrap" style={{ gap: 8 }}>
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
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{ paddingLeft: 24, paddingRight: 24 }}>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="w-full" style={{ height: 280, borderRadius: 16, background: "rgba(18,18,20,0.06)" }} />
            ))}
          </div>
        </div>
      ) : filteredListings && filteredListings.length > 0 ? (
        <div>
          {/* Section overline */}
          <p
            style={{
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "rgba(18, 18, 20, 0.4)",
              lineHeight: 1.3,
              marginBottom: 4,
              paddingLeft: 24,
              fontFamily: font,
            }}
          >
            Local
          </p>
          {/* Section heading */}
          <h2
            className="font-semibold"
            style={{
              fontSize: 26,
              fontWeight: 600,
              lineHeight: 1.15,
              letterSpacing: "0.01em",
              color: "#020202",
              textTransform: "uppercase",
              paddingLeft: 24,
              marginBottom: 16,
              marginTop: 0,
              fontFamily: font,
            }}
          >
            Favourites
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginLeft: 24, marginRight: 24 }}>
            {filteredListings.map((l) => {
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
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid rgba(18, 18, 20, 0.06)",
                    borderRadius: 16,
                    overflow: "hidden",
                    cursor: hasDetail ? "pointer" : "default",
                    transition: "transform 0.15s ease",
                  }}
                  {...(hasDetail ? press : {})}
                >
                  {/* Hero image */}
                  <div style={{ position: "relative", width: "100%", aspectRatio: "16/10", background: "rgba(18,18,20,0.04)" }}>
                    {l.image_url ? (
                      <img src={l.image_url} alt={l.title} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} loading="lazy" />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: "rgba(18,18,20,0.04)" }} />
                    )}

                    {/* Heart / save button */}
                    <div
                      style={{ position: "absolute", top: 12, right: 12, zIndex: 2 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FavouriteButton itemId={l.id} itemType="listing" />
                    </div>

                    {l.is_featured && (
                      <div style={{ position: "absolute", left: 12, bottom: 12 }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            background: "rgba(255,255,255,0.92)",
                            borderRadius: 999,
                            padding: "7px 12px",
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#2B2420",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            fontFamily: font,
                          }}
                        >
                          <Star size={12} strokeWidth={1.8} className="fill-current" />
                          Featured
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card content */}
                  <div style={{ padding: "16px 20px 20px 20px" }}>
                    <h3
                      className="font-semibold"
                      style={{
                        fontFamily: font,
                        fontSize: 22,
                        fontWeight: 600,
                        color: "#020202",
                        textTransform: "uppercase",
                        lineHeight: 1.15,
                        letterSpacing: "0.01em",
                        margin: 0,
                        marginBottom: 6,
                      }}
                    >
                      {l.title}
                    </h3>

                    {l.description && (
                      <p
                        className="line-clamp-2"
                        style={{
                          fontSize: 14,
                          fontWeight: 400,
                          lineHeight: 1.4,
                          color: "rgba(18, 18, 20, 0.55)",
                          margin: 0,
                          marginBottom: 16,
                          fontFamily: font,
                        }}
                      >
                        {l.description}
                      </p>
                    )}

                    {/* Contact rows */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {l.location && (
                        <div style={{ display: "flex", alignItems: "center", padding: "6px 0", gap: 12 }}>
                          <MapPin size={18} strokeWidth={1.8} style={{ flexShrink: 0, color: "rgba(18, 18, 20, 0.3)" }} />
                          <span style={{ fontSize: 14, fontWeight: 400, color: "#2B2420", lineHeight: 1.3, fontFamily: font }} className="truncate">{l.location}</span>
                        </div>
                      )}

                      {l.phone && (
                        <a
                          href={`tel:${l.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{ display: "flex", alignItems: "center", padding: "6px 0", gap: 12, textDecoration: "none", width: "fit-content", transition: "opacity 0.12s ease" }}
                          onPointerDown={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.6")}
                          onPointerUp={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
                          onPointerLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
                        >
                          <Phone size={18} strokeWidth={1.8} style={{ flexShrink: 0, color: "rgba(18, 18, 20, 0.3)" }} />
                          <span style={{ fontSize: 14, fontWeight: 400, color: "#2B2420", lineHeight: 1.3, fontFamily: font }}>{l.phone}</span>
                        </a>
                      )}

                      {l.email && (
                        <a
                          href={`mailto:${l.email}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{ display: "flex", alignItems: "center", padding: "6px 0", gap: 12, textDecoration: "none", width: "fit-content", transition: "opacity 0.12s ease" }}
                          onPointerDown={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.6")}
                          onPointerUp={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
                          onPointerLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
                        >
                          <Mail size={18} strokeWidth={1.8} style={{ flexShrink: 0, color: "rgba(18, 18, 20, 0.3)" }} />
                          <span style={{ fontSize: 14, fontWeight: 400, color: "#2B2420", lineHeight: 1.3, fontFamily: font }} className="truncate">{l.email}</span>
                        </a>
                      )}

                      {l.website && (
                        <a
                          href={l.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{ display: "flex", alignItems: "center", padding: "6px 0", gap: 12, textDecoration: "none", width: "fit-content", transition: "opacity 0.12s ease" }}
                          onPointerDown={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.6")}
                          onPointerUp={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
                          onPointerLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
                        >
                          <Globe size={18} strokeWidth={1.8} style={{ flexShrink: 0, color: "rgba(18, 18, 20, 0.3)" }} />
                          <span style={{ fontSize: 14, fontWeight: 400, color: "#2B2420", lineHeight: 1.3, fontFamily: font }}>Website</span>
                        </a>
                      )}

                      {(l as any).whatsapp && (
                        <a
                          href={`https://wa.me/${(l as any).whatsapp.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{ display: "flex", alignItems: "center", padding: "6px 0", gap: 12, textDecoration: "none", width: "fit-content", transition: "opacity 0.12s ease" }}
                          onPointerDown={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.6")}
                          onPointerUp={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
                          onPointerLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
                        >
                          <MessageCircle size={18} strokeWidth={1.8} style={{ flexShrink: 0, color: "rgba(18, 18, 20, 0.3)" }} />
                          <span style={{ fontSize: 14, fontWeight: 400, color: "#2B2420", lineHeight: 1.3, fontFamily: font }}>WhatsApp</span>
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
        <div style={{ textAlign: "center", paddingTop: 80 }}>
          <p style={{ fontFamily: font, fontWeight: 500, fontSize: 18, color: "#020202", marginBottom: 4 }}>
            No listings found
          </p>
          <p style={{ fontSize: 14, color: "rgba(18,18,20,0.45)", fontFamily: font }}>Check back soon for places in this category</p>
        </div>
      )}
    </div>
  );
};

export default CategoryPage;
