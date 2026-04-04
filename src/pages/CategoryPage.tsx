import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Star,
} from "lucide-react";
import FavouriteButton from "@/components/FavouriteButton";
import { isRestaurantCategory } from "@/lib/categoryFields";
import { Skeleton } from "@/components/ui/skeleton";

const CategoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSubId = searchParams.get("sub");
  const [showCategories, setShowCategories] = useState(false);

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

  const otherCategories = useMemo(() => (allCategories || []).filter((cat) => cat.id !== id), [allCategories, id]);

  const handleSubFilter = (subId: string | null) => {
    if (subId) {
      setSearchParams({ sub: subId });
    } else {
      setSearchParams({});
    }
  };

  const categoryTitle = category?.title || "Category";
  const categoryDescription = category?.description || "Discover places, experiences and local favourites.";
  const isRestaurant = category ? isRestaurantCategory(category.title) : false;

  return (
    <div className="min-h-screen pb-[72px]" style={{ background: "#FFFFFF" }}>
      {/* Back button */}
      <div style={{ paddingTop: 52, paddingLeft: 24, paddingRight: 24, marginBottom: 28 }}>
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
            fontSize: 40,
            lineHeight: 1.0,
            letterSpacing: "-0.5px",
            color: "#121214",
            margin: 0,
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

      {/* Other categories pills */}
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
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="w-full" style={{ height: 128, borderRadius: 16, background: "#f0f0f0" }} />
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
              Curated
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
              Places
            </h2>

            <div>
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
                    className={`relative transition-transform duration-150 ${
                      hasDetail ? "active:scale-[0.99] cursor-pointer" : ""
                    }`}
                    onClick={hasDetail ? () => navigate(`/listing/${l.id}`) : undefined}
                    style={{
                      background: "rgba(18,18,20,0.04)",
                      border: "1px solid rgba(18,18,20,0.06)",
                      borderRadius: 16,
                      padding: 12,
                      marginBottom: 12,
                    }}
                  >
                    <div className="absolute z-10" style={{ top: 12, right: 12 }}>
                      <FavouriteButton itemId={l.id} itemType="listing" />
                    </div>

                    <div className="flex items-start" style={{ gap: 12 }}>
                      <div
                        style={{
                          width: 88,
                          height: 88,
                          borderRadius: 12,
                          overflow: "hidden",
                          background: "#f0f0f0",
                          flexShrink: 0,
                        }}
                      >
                        {l.image_url ? (
                          <img src={l.image_url} alt={l.title} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full" style={{ background: "#f0f0f0" }} />
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0, paddingRight: hasDetail ? 12 : 0 }}>
                        <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                          {l.is_featured && (
                            <span
                              className="inline-flex items-center"
                              style={{
                                gap: 5,
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
                          )}
                        </div>

                        <h3
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: "#121214",
                            lineHeight: 1.2,
                            margin: 0,
                            marginBottom: 4,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {l.title}
                        </h3>

                        {l.description && (
                          <p
                            className="line-clamp-2"
                            style={{
                              fontSize: 12,
                              color: "rgba(18,18,20,0.45)",
                              lineHeight: 1.45,
                              margin: 0,
                              marginBottom: 8,
                            }}
                          >
                            {l.description}
                          </p>
                        )}

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                          }}
                        >
                          {l.location && (
                            <p
                              className="flex items-center"
                              style={{
                                fontSize: 12,
                                color: "rgba(18,18,20,0.42)",
                                margin: 0,
                                gap: 6,
                              }}
                            >
                              <MapPin size={12} strokeWidth={2} />
                              <span className="truncate">{l.location}</span>
                            </p>
                          )}

                          {l.phone && (
                            <a
                              href={`tel:${l.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center"
                              style={{
                                fontSize: 12,
                                color: "rgba(18,18,20,0.42)",
                                gap: 6,
                                width: "fit-content",
                              }}
                            >
                              <Phone size={12} strokeWidth={2} />
                              <span>{l.phone}</span>
                            </a>
                          )}

                          {l.email && (
                            <a
                              href={`mailto:${l.email}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center"
                              style={{
                                fontSize: 12,
                                color: "rgba(18,18,20,0.42)",
                                gap: 6,
                                width: "fit-content",
                              }}
                            >
                              <Mail size={12} strokeWidth={2} />
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
                                fontSize: 12,
                                color: "rgba(18,18,20,0.42)",
                                gap: 6,
                                width: "fit-content",
                              }}
                            >
                              <Globe size={12} strokeWidth={2} />
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
                                fontSize: 12,
                                color: "rgba(18,18,20,0.42)",
                                gap: 6,
                                width: "fit-content",
                              }}
                            >
                              <MessageCircle size={12} strokeWidth={2} />
                              <span>WhatsApp</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {hasDetail && (
                        <ChevronRight
                          size={16}
                          strokeWidth={2}
                          style={{
                            color: "rgba(18,18,20,0.22)",
                            flexShrink: 0,
                            marginTop: 4,
                          }}
                        />
                      )}
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
