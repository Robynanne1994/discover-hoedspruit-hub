import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft, MapPin, Phone, Mail, Globe, Star, Clock, Baby, PawPrint, Accessibility, DollarSign } from "lucide-react";

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const ListingDetail = () => {
  const { id } = useParams<{ id: string }>();

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*, categories(id, title)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 section-padding">
          <div className="container-wide">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 section-padding">
          <div className="container-wide text-center py-16">
            <p className="text-muted-foreground text-lg">Listing not found.</p>
            <Link to="/" className="text-primary hover:underline mt-4 inline-block">Back to Home</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const categoryData = listing.categories as { id: string; title: string } | null;
  const galleryImages = (listing as any).gallery_images as string[] | null;
  const longDescription = (listing as any).long_description as string | null;
  const openingHours = (listing as any).opening_hours as Record<string, string> | null;
  const hasGallery = galleryImages && galleryImages.length > 0;
  const hasHours = openingHours && Object.values(openingHours).some((v) => v);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-24 pb-16 section-padding">
        <div className="container-wide max-w-4xl mx-auto">
          {categoryData ? (
            <Link
              to={`/category/${categoryData.id}`}
              className="inline-flex items-center gap-2 text-primary hover:underline mb-6"
            >
              <ArrowLeft className="h-4 w-4" /> Back to {categoryData.title}
            </Link>
          ) : (
            <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
          )}

          {/* Hero image */}
          {listing.image_url && (
            <div className="rounded-xl overflow-hidden mb-8">
              <img
                src={listing.image_url}
                alt={listing.title}
                className="w-full h-64 sm:h-80 lg:h-96 object-cover"
              />
            </div>
          )}

          {/* Title & featured badge */}
          <div className="mb-6">
            {listing.is_featured && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent mb-2">
                <Star className="h-3 w-3 fill-current" /> Featured
              </span>
            )}
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
              {listing.title}
            </h1>
          </div>

          {/* Contact info bar */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-8">
            {listing.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" /> {listing.location}
              </div>
            )}
            {listing.phone && (
              <a href={`tel:${listing.phone}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <Phone className="h-4 w-4 text-primary" /> {listing.phone}
              </a>
            )}
            {listing.email && (
              <a href={`mailto:${listing.email}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <Mail className="h-4 w-4 text-primary" /> {listing.email}
              </a>
            )}
            {listing.website && (
              <a href={listing.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <Globe className="h-4 w-4 text-primary" /> Website
              </a>
            )}
          </div>

          {/* Description */}
          {listing.description && (
            <p className="text-muted-foreground text-lg mb-6">{listing.description}</p>
          )}

          {/* Long description */}
          {longDescription && (
            <div className="prose prose-neutral max-w-none mb-10">
              {longDescription.split("\n").map((paragraph, i) => (
                <p key={i} className="text-foreground/80 leading-relaxed mb-3">{paragraph}</p>
              ))}
            </div>
          )}

          {/* Gallery */}
          {hasGallery && (
            <div className="mb-10">
              <h2 className="font-heading text-2xl font-bold text-foreground mb-4">Gallery</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {galleryImages.map((url, i) => (
                  <div key={i} className="rounded-lg overflow-hidden aspect-[4/3]">
                    <img src={url} alt={`${listing.title} gallery ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Opening hours */}
          {hasHours && (
            <div className="mb-10">
              <h2 className="font-heading text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" /> Opening Hours
              </h2>
              <div className="bg-card border border-border rounded-xl p-5 space-y-2">
                {DAY_LABELS.map((day) => {
                  const value = openingHours[day.toLowerCase()] || "";
                  return (
                    <div key={day} className="flex justify-between text-sm">
                      <span className="font-medium text-foreground">{day}</span>
                      <span className="text-muted-foreground">{value || "Closed"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default ListingDetail;
