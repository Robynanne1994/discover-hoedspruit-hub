import HomeSectionHeader from "./HomeSectionHeader";
import HomeListingCarousel from "./HomeListingCarousel";
import { useHomepageSection, useHomepageSectionTitle } from "@/hooks/useHomepageSection";
import { Skeleton } from "@/components/ui/skeleton";

const DoSection = () => {
  const { data: listings, isLoading } = useHomepageSection(
    "do",
    ["%activit%", "%things to do%", "%adventure%"]
  );
  const { data: title } = useHomepageSectionTitle("do", "What to Do");

  if (isLoading) {
    return (
      <section style={{ paddingTop: 36 }}>
        <div style={{ padding: "0 24px" }}>
          <HomeSectionHeader title={title || "What to Do"} />
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
        <HomeSectionHeader title={title || "What to Do"} actionLabel="See All" actionHref="/category/4dc26115-569e-4af7-868a-9f783f8a38eb" />
      </div>
      <HomeListingCarousel listings={listings.slice(0, 6)} />
    </section>
  );
};

export default DoSection;
