import SectionHeader from "./SectionHeader";
import VenueCard from "./VenueCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const DoSection = () => {
  const { data: listings, isLoading } = useQuery({
    queryKey: ["homepage-do"],
    queryFn: async () => {
      const { data: categories } = await supabase
        .from("categories")
        .select("id")
        .or("title.ilike.%activit%,title.ilike.%things to do%,title.ilike.%adventure%")
        .limit(1);

      if (!categories?.length) return [];

      const categoryId = categories[0].id;

      const { data: linkedIds } = await supabase
        .from("listing_categories")
        .select("listing_id")
        .eq("category_id", categoryId);

      const ids = linkedIds?.map((l) => l.listing_id) || [];

      const { data } = await supabase
        .from("listings")
        .select("id, title, image_url, google_rating, location")
        .or(`category_id.eq.${categoryId}${ids.length ? `,id.in.(${ids.join(",")})` : ""}`)
        .limit(4);

      return data || [];
    },
  });

  if (isLoading) {
    return (
      <section className="pb-6">
        <SectionHeader title="Things to Do" />
        <div className="flex gap-3 px-4">
          <Skeleton className="w-[46%] aspect-[4/3] rounded-xl" />
          <Skeleton className="w-[46%] aspect-[4/3] rounded-xl" />
        </div>
      </section>
    );
  }

  if (!listings?.length) return null;

  return (
    <section className="pt-6 pb-6">
      <SectionHeader title="Things to Do" actionLabel="See all" actionHref="/categories" />
      <div className="grid grid-cols-2 gap-3 px-4">
        {listings.map((listing) => (
          <VenueCard
            key={listing.id}
            image={listing.image_url || ""}
            name={listing.title}
            rating={listing.google_rating || 0}
            href={`/listing/${listing.id}`}
          />
        ))}
      </div>
    </section>
  );
};

export default DoSection;
