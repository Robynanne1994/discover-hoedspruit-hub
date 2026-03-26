import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { MapPin, Phone, Mail, Globe, Star, ChevronDown, ChevronUp } from "lucide-react";
import BackButton from "@/components/BackButton";
import FavouriteButton from "@/components/FavouriteButton";

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
      const { data, error } = await supabase.from("subcategories").select("*").eq("category_id", id!).order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: listings, isLoading } = useQuery({
    queryKey: ["listings-by-category", id, activeSubId],
    queryFn: async () => {
      // Get listing IDs belonging to this category via junction table
      const { data: junctionData, error: jErr } = await supabase
        .from("listing_categories")
        .select("listing_id")
        .eq("category_id", id!);
      if (jErr) throw jErr;
      let listingIds = junctionData.map((r: any) => r.listing_id as string);
      if (listingIds.length === 0) return [];

      if (activeSubId) {
        // Further filter by subcategory
        const { data: subJunction, error: sErr } = await supabase
          .from("listing_subcategories")
          .select("listing_id")
          .eq("subcategory_id", activeSubId);
        if (sErr) throw sErr;
        const subListingIds = new Set(subJunction.map((r: any) => r.listing_id as string));
        listingIds = listingIds.filter((id) => subListingIds.has(id));
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-24 pb-24 section-padding">
        <div className="container-wide">
          <div className="flex items-center justify-between mb-6">
            <BackButton className="mb-0" />
            {allCategories && allCategories.length > 0 && (
              <button
                onClick={() => setShowCategories((v) => !v)}
                className="flex items-center gap-1 text-sm font-bold text-foreground hover:text-primary transition-colors duration-200"
              >
                Other Categories
                {showCategories ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            )}
          </div>
          {showCategories && allCategories && allCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {allCategories
                .filter((cat) => cat.id !== id)
                .map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.id}`}
                    className="px-4 py-1.5 rounded-full text-sm font-medium bg-muted text-muted-foreground hover:bg-accent/20 hover:text-foreground transition-colors duration-200"
                  >
                    {cat.title}
                  </Link>
                ))}
            </div>
          )}

          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mt-16 mb-2">
            {category?.title ?? "Category"}
          </h1>
          {category?.description && (
            <p className="text-muted-foreground text-lg mb-4">{category.description}</p>
          )}

          {subcategories && subcategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              <button
                onClick={() => handleSubFilter(null)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${
                  !activeSubId
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent/20 hover:text-foreground"
                }`}
              >
                All
              </button>
              {subcategories.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => handleSubFilter(sub.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${
                    activeSubId === sub.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent/20 hover:text-foreground"
                  }`}
                >
                  {sub.title}
                </button>
              ))}
            </div>
          )}

          {isLoading ? (
            <p className="text-muted-foreground">Loading listings...</p>
          ) : listings && listings.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((l) => {
                const hasDetail = !!(
                  l.long_description ||
                  (l.gallery_images && l.gallery_images.length > 0) ||
                  (l.opening_hours && Object.values(l.opening_hours as Record<string, string>).some((v) => v)) ||
                  l.show_attributes
                );
                return (
                <div
                  key={l.id}
                  className={`relative bg-card border border-border rounded-none overflow-hidden shadow-card hover:shadow-warm transition-shadow duration-300 ${hasDetail ? "cursor-pointer" : ""}`}
                  onClick={hasDetail ? () => navigate(`/listing/${l.id}`) : undefined}
                >
                  <FavouriteButton itemId={l.id} itemType="listing" />
                  {l.image_url && (
                    <img src={l.image_url} alt={l.title} className="w-full h-48 object-cover" />
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-1">
                      {l.is_featured && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent">
                          <Star className="h-3 w-3 fill-current" /> Featured
                        </span>
                      )}
                    </div>
                    <h3 className="font-heading text-xl font-bold text-foreground mb-2">{l.title}</h3>
                    {l.description && (
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{l.description}</p>
                    )}
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {l.location && (
                        <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> {l.location}</div>
                      )}
                      {l.phone && (
                        <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> <a href={`tel:${l.phone}`} className="hover:text-primary">{l.phone}</a></div>
                      )}
                      {l.email && (
                        <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> <a href={`mailto:${l.email}`} className="hover:text-primary">{l.email}</a></div>
                      )}
                      {l.website && (
                        <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> <a href={l.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary">Website</a></div>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">No listings in this category yet.</p>
              <p className="text-muted-foreground text-sm mt-1">Check back soon!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CategoryPage;
