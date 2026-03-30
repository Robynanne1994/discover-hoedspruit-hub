import SectionHeader from "./SectionHeader";
import VenueCard from "./VenueCard";
import { useHomepageSection } from "@/hooks/useHomepageSection";
import { Skeleton } from "@/components/ui/skeleton";

const ShopSection = () => {
  const { data: listings, isLoading } = useHomepageSection("shop", "%shop%");

  if (isLoading) {
    return (
      <section className="pb-6">
        <SectionHeader title="Where to Shop" />
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
      <SectionHeader title="Where to Shop" actionLabel="See all" actionHref="/categories" />
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

export default ShopSection;
