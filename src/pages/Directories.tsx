import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Globe, Mail, Phone, MapPin } from "lucide-react";

const Directories = () => {
  const { data: categories, isLoading: catsLoading } = useQuery({
    queryKey: ["directory-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, title")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: listings, isLoading: listingsLoading } = useQuery({
    queryKey: ["directory-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id, title, phone, email, website, location, category_id")
        .order("title");
      if (error) throw error;
      return data;
    },
  });

  const isLoading = catsLoading || listingsLoading;

  const grouped = categories?.map((cat) => ({
    ...cat,
    listings: listings?.filter((l) => l.category_id === cat.id) ?? [],
  })).filter((cat) => cat.listings.length > 0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container-wide px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground font-sans mb-2">
              Directories
            </h1>
            <p className="text-muted-foreground text-lg">
              Find local vendors and businesses with their contact details, organised by category.
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-8 w-48 bg-muted rounded mb-4" />
                  <div className="space-y-3">
                    {[1, 2].map((j) => (
                      <div key={j} className="h-20 bg-muted rounded-lg" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : grouped && grouped.length > 0 ? (
            <div className="space-y-12">
              {grouped.map((cat) => (
                <section key={cat.id}>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground font-sans mb-4 border-b border-border pb-2">
                    {cat.title}
                  </h2>
                  <div className="grid gap-3">
                    {cat.listings.map((listing) => (
                      <div
                        key={listing.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-card border border-border hover:shadow-md transition-shadow"
                      >
                        <div>
                          <h3 className="font-semibold text-foreground font-sans">
                            {listing.title}
                          </h3>
                          {listing.location && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {listing.location}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          {listing.phone && (
                            <a
                              href={`tel:${listing.phone}`}
                              className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                            >
                              <Phone className="h-4 w-4" />
                              {listing.phone}
                            </a>
                          )}
                          {listing.email && (
                            <a
                              href={`mailto:${listing.email}`}
                              className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                            >
                              <Mail className="h-4 w-4" />
                              {listing.email}
                            </a>
                          )}
                          {listing.website && (
                            <a
                              href={listing.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                            >
                              <Globe className="h-4 w-4" />
                              Website
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-12">
              No directory listings available yet.
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Directories;
