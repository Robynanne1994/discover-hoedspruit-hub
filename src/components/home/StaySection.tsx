import SectionHeader from "./SectionHeader";
import VenueCard from "./VenueCard";
import { useHomepageSection, useHomepageSectionTitle } from "@/hooks/useHomepageSection";
import { Skeleton } from "@/components/ui/skeleton";

const StaySection = () => {
  const { data: listings, isLoading } = useHomepageSection("stay", "%accommodation%");
  const { data: title } = useHomepageSectionTitle("stay", "Places to Stay");

  if (isLoading) {
    return (
      <section className="pb-6">
        <SectionHeader title={title || "Places to Stay"} />
        <div className="flex gap-3 px-4">
          <Skeleton className="w-[46%] aspect-[4/3] rounded-xl" />
          <Skeleton className="w-[46%] aspect-[4/3] rounded-xl" />
        </div>
      </section>
    );
  }

  if (!listings?.length) return null;

  return (
    <section className="pb-6">
      <SectionHeader title={title || "Places to Stay"} actionLabel="See all" actionHref="/categories" />
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

export default StaySection;
