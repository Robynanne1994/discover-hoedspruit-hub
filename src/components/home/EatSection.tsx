import SectionHeader from "./SectionHeader";
import VenueCard from "./VenueCard";
import { useHomepageSection, useHomepageSectionTitle } from "@/hooks/useHomepageSection";
import { Skeleton } from "@/components/ui/skeleton";

const EatSection = () => {
  const { data: listings, isLoading } = useHomepageSection("eat", "%restaurant%");
  const { data: title } = useHomepageSectionTitle("eat", "Eat in Hoedspruit");

  if (isLoading) {
    return (
      <section className="pb-6">
        <SectionHeader title={title || "Eat in Hoedspruit"} />
        <div className="flex gap-3 px-5">
          <Skeleton className="w-[46%] aspect-[3/4] rounded-xl" />
          <Skeleton className="w-[46%] aspect-[3/4] rounded-xl" />
        </div>
      </section>
    );
  }

  if (!listings?.length) return null;

  return (
    <section className="py-4">
      <SectionHeader title={title || "Eat in Hoedspruit"} actionLabel="See all" actionHref="/categories" />
      <div className="grid grid-cols-2 gap-3.5 px-5">
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

export default EatSection;
