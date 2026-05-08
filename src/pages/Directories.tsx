import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Globe, Mail, MapPin, Phone } from "lucide-react";
import BackButton from "@/components/BackButton";
import { sanitizeDashesList } from "@/lib/sanitizeListing";

const Directories = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data: categories } = useQuery({
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

  const { data: listings, isLoading } = useQuery({
    queryKey: ["directory-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id, title, phone, email, website, location, google_maps_link, category_id")
        .order("title");
      if (error) throw error;
      return sanitizeDashesList(data as any[]);
    },
  });

  const grouped = categories
    ?.map((cat) => ({
      ...cat,
      listings: listings?.filter((l) => l.category_id === cat.id) ?? [],
    }))
    .filter((cat) => cat.listings.length > 0)
    .filter((cat) => !activeCategory || cat.id === activeCategory);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#5C6446" }}>
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container-wide px-6">
          <BackButton />
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground font-sans mb-2">
              Directories
            </h1>
            <p className="text-muted-foreground text-lg">
              Find local vendors and businesses with their contact details.
            </p>
          </div>

          {/* Category filter pills */}
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                !activeCategory
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              All
            </button>
            {categories
              ?.filter((cat) => listings?.some((l) => l.category_id === cat.id))
              .map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id === activeCategory ? null : cat.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                    activeCategory === cat.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  {cat.title}
                </button>
              ))}
          </div>

          {isLoading ? (
            <div className="space-y-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-8 w-48 bg-muted rounded mb-4" />
                  <div className="space-y-3">
                    {[1, 2].map((j) => (
                      <div key={j} className="h-12 bg-muted rounded" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : grouped && grouped.length > 0 ? (
            <div className="space-y-10">
              {grouped.map((cat) => (
                <section key={cat.id}>
                  <h2 className="text-2xl font-bold text-foreground font-heading mb-0 border-b-2 border-primary/30 pb-3">
                    {cat.title}
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                         <tr className="text-left border-b-2 border-border bg-primary/10 rounded">
                           <th className="py-3 pr-4 font-bold text-primary text-sm uppercase tracking-wide">Business</th>
                           <th className="py-3 pr-4 font-bold text-primary text-sm uppercase tracking-wide">Location</th>
                           <th className="py-3 pr-4 font-bold text-primary text-sm uppercase tracking-wide">Phone</th>
                           <th className="py-3 pr-4 font-bold text-primary text-sm uppercase tracking-wide">Email</th>
                           <th className="py-3 font-bold text-primary text-sm uppercase tracking-wide">Website</th>
                         </tr>
                      </thead>
                      <tbody>
                        {cat.listings.map((listing) => (
                          <tr
                            key={listing.id}
                            className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                          >
                             <td className="py-3 pr-4 font-medium text-foreground whitespace-nowrap">
                               {listing.title}
                             </td>
                             <td className="py-3 pr-4 whitespace-nowrap">
                               {listing.location ? (
                                 (listing as any).google_maps_link ? (
                                   <a
                                     href={(listing as any).google_maps_link}
                                     target="_blank"
                                     rel="noopener noreferrer"
                                     className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                                   >
                                     <MapPin className="h-3.5 w-3.5 shrink-0" />
                                     {listing.location}
                                   </a>
                                 ) : (
                                   <span className="flex items-center gap-1.5 text-muted-foreground">
                                     <MapPin className="h-3.5 w-3.5 shrink-0" />
                                     {listing.location}
                                   </span>
                                 )
                               ) : (
                                 <span className="text-muted-foreground/40">—</span>
                               )}
                             </td>
                             <td className="py-3 pr-4 whitespace-nowrap">
                              {listing.phone ? (
                                <a
                                  href={`tel:${listing.phone}`}
                                  className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                                >
                                  <Phone className="h-3.5 w-3.5 shrink-0" />
                                  {listing.phone}
                                </a>
                              ) : (
                                <span className="text-muted-foreground/40">—</span>
                              )}
                            </td>
                            <td className="py-3 pr-4 whitespace-nowrap">
                              {listing.email ? (
                                <a
                                  href={`mailto:${listing.email}`}
                                  className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                                >
                                  <Mail className="h-3.5 w-3.5 shrink-0" />
                                  {listing.email}
                                </a>
                              ) : (
                                <span className="text-muted-foreground/40">—</span>
                              )}
                            </td>
                            <td className="py-3 whitespace-nowrap">
                              {listing.website ? (
                                <a
                                  href={listing.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                                >
                                  <Globe className="h-3.5 w-3.5 shrink-0" />
                                  Visit
                                </a>
                              ) : (
                                <span className="text-muted-foreground/40">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
    </div>
  );
};

export default Directories;
