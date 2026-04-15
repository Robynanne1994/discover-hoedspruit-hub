import HomeSectionHeader from "./HomeSectionHeader";
import HomeListingCarousel from "./HomeListingCarousel";
import { useHomepageSection, useHomepageSectionTitle } from "@/hooks/useHomepageSection";
import { Skeleton } from "@/components/ui/skeleton";

const StaySection = () => {
  const { data: listings, isLoading } = useHomepageSection("stay", "%accommodation%");
  const { data: title } = useHomepageSectionTitle("stay", "Where to Stay");

  if (isLoading) {
    return (
      <section style={{ paddingTop: 36 }}>
        <div style={{ padding: "0 24px" }}>
          <HomeSectionHeader title={title || "Where to Stay"} />
        </div>
        <div style={{ display: "flex", gap: 12, paddingLeft: 24 }}>
          <Skeleton className="flex-shrink-0 rounded-xl" style={{ width: "calc(50vw - 30px)", aspectRatio: "3/4" }} />
          <Skeleton className="flex-shrink-0 rounded-xl" style={{ width: "calc(50vw - 30px)", aspectRatio: "3/4" }} />
        </div>
      </section>
    );
  }

  if (!listings?.length) return null;

  return (
    <section style={{ paddingTop: 36 }}>
      <div style={{ padding: "0 24px" }}>
        <HomeSectionHeader title={title || "Where to Stay"} actionLabel="See All" actionHref="/category/cef1c5ad-b199-41c9-bc8a-5834703a953a" />
      </div>
      <HomeListingCarousel listings={listings.slice(0, 6)} />
    </section>
  );
};

export default StaySection;
