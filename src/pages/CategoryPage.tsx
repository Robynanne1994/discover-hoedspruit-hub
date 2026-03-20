import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft, MapPin, Phone, Mail, Globe, Star } from "lucide-react";

const CategoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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

  const { data: listings, isLoading } = useQuery({
    queryKey: ["listings-by-category", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("listings").select("*").eq("category_id", id!).order("is_featured", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-24 pb-16 section-padding">
        <div className="container-wide">
          <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>

          {allCategories && allCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {allCategories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/category/${cat.id}`}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${
                    cat.id === id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-accent/20 hover:text-foreground"
                  }`}
                >
                  {cat.title}
                </Link>
              ))}
            </div>
          )}

          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-2">
            {category?.title ?? "Category"}
          </h1>
          {category?.description && (
            <p className="text-muted-foreground text-lg mb-8">{category.description}</p>
          )}

          {isLoading ? (
            <p className="text-muted-foreground">Loading listings...</p>
          ) : listings && listings.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((l) => {
                const hasDetail = !!(
                  (l as any).long_description ||
                  ((l as any).gallery_images && (l as any).gallery_images.length > 0) ||
                  ((l as any).opening_hours && Object.values((l as any).opening_hours as Record<string, string>).some((v) => v)) ||
                  (l as any).show_attributes
                );
                return (
                <div
                  key={l.id}
                  className={`bg-card border border-border rounded-none overflow-hidden shadow-card hover:shadow-warm transition-shadow duration-300 ${hasDetail ? "cursor-pointer" : ""}`}
                  onClick={hasDetail ? () => navigate(`/listing/${l.id}`) : undefined}
                >
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
      <Footer />
    </div>
  );
};

export default CategoryPage;
