import HomeSectionHeader from "./HomeSectionHeader";
import HomeListingCarousel from "./HomeListingCarousel";
import { useHomepageSection, useHomepageSectionTitle } from "@/hooks/useHomepageSection";
import { Skeleton } from "@/components/ui/skeleton";

const EatSection = () => {
  const { data: listings, isLoading } = useHomepageSection("eat", "%restaurant%");
  const { data: title } = useHomepageSectionTitle("eat", "Where to Eat");

  if (isLoading) {
    return (
      <section style={{ paddingTop: 36 }}>
        <div style={{ padding: "0 20px" }}>
          <HomeSectionHeader title={title || "Where to Eat"} />
        </div>
        <div style={{ display: "flex", gap: 4, paddingLeft: 20 }}>
          <Skeleton className="flex-shrink-0 rounded-xl" style={{ width: "calc(50vw - 22px)", aspectRatio: "3/4" }} />
          <Skeleton className="flex-shrink-0 rounded-xl" style={{ width: "calc(50vw - 22px)", aspectRatio: "3/4" }} />
        </div>
      </section>
    );
  }

  if (!listings?.length) return null;

  return (
    <section style={{ paddingTop: 36 }}>
      <div style={{ padding: "0 20px" }}>
        <HomeSectionHeader title={title || "Where to Eat"} actionLabel="See All" actionHref="/category/c867119f-8ca9-45a7-870e-6671f028748c" />
      </div>
      <HomeListingCarousel listings={listings.slice(0, 6)} />
    </section>
  );
};

export default EatSection;
