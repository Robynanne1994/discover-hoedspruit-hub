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
      <SectionHeader title={title || "Places to Stay"} actionLabel="See all" <SectionHeader title={title || "Places to Stay"} actionLabel="See all" actionHref="/category/cef1c5ad-b199-41c9-bc8a-5834703a953a" /> />
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

export default StaySection;
