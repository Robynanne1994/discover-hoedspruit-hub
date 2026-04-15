import HomeSectionHeader from "./HomeSectionHeader";
import HomeListingCarousel from "./HomeListingCarousel";
import { useHomepageSection, useHomepageSectionTitle } from "@/hooks/useHomepageSection";
import { Skeleton } from "@/components/ui/skeleton";

const ShopSection = () => {
  const { data: listings, isLoading } = useHomepageSection("shop", "%shop%");
  const { data: title } = useHomepageSectionTitle("shop", "Where to Shop");

  if (isLoading) {
    return (
      <section style={{ paddingTop: 36 }}>
        <div style={{ padding: "0 12px" }}>
          <HomeSectionHeader title={title || "Where to Shop"} />
        </div>
        <div style={{ display: "flex", gap: 12, paddingLeft: 4 }}>
          <Skeleton className="flex-shrink-0 rounded-xl" style={{ width: "calc(50vw - 30px)", aspectRatio: "3/4" }} />
          <Skeleton className="flex-shrink-0 rounded-xl" style={{ width: "calc(50vw - 30px)", aspectRatio: "3/4" }} />
        </div>
      </section>
    );
  }

  if (!listings?.length) return null;

  return (
    <section style={{ paddingTop: 36 }}>
      <div style={{ padding: "0 12px" }}>
        <HomeSectionHeader title={title || "Where to Shop"} actionLabel="See All" actionHref="/category/7b335bd5-3ce9-4ecd-92bd-3735804402b8" />
      </div>
      <HomeListingCarousel listings={listings.slice(0, 6)} />
    </section>
  );
};

export default ShopSection;
