import HomeHero from "@/components/home/HomeHero";
import FeaturedCarousel from "@/components/home/FeaturedCarousel";
import WhatsOnToday from "@/components/home/WhatsOnToday";
import EatSection from "@/components/home/EatSection";
import StaySection from "@/components/home/StaySection";
import ShopSection from "@/components/home/ShopSection";
import DoSection from "@/components/home/DoSection";
import AdvertiseWithUs from "@/components/home/AdvertiseWithUs";

const Index = () => {
  return (
    <div className="min-h-screen pb-20 bg-background">
      <HomeHero />
      <FeaturedCarousel />
      <WhatsOnToday />
      <EatSection />
      <StaySection />
      <ShopSection />
      <DoSection />
      <AdvertiseWithUs />
    </div>
  );
};

export default Index;
