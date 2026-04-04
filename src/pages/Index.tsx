import HomeHero from "@/components/home/HomeHero";
import WhatsOnToday from "@/components/home/WhatsOnToday";
import EatSection from "@/components/home/EatSection";
import StaySection from "@/components/home/StaySection";
import ShopSection from "@/components/home/ShopSection";
import DoSection from "@/components/home/DoSection";
import AdvertiseWithUs from "@/components/home/AdvertiseWithUs";

const Index = () => {
  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", paddingBottom: 80 }}>
      <HomeHero />
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
