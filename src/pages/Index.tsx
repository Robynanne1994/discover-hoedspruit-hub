import HomeHero from "@/components/home/HomeHero";
import WhatsOnToday from "@/components/home/WhatsOnToday";
import SpecialsSection from "@/components/home/SpecialsSection";
import EatSection from "@/components/home/EatSection";
import StaySection from "@/components/home/StaySection";
import ShopSection from "@/components/home/ShopSection";
import DoSection from "@/components/home/DoSection";
import LowdownSection from "@/components/home/LowdownSection";
import AdvertiseWithUs from "@/components/home/AdvertiseWithUs";

const Index = () => {
  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", paddingBottom: 80 }}>
      <HomeHero />
      <WhatsOnToday />
      <SpecialsSection />
      <EatSection />
      <StaySection />
      <ShopSection />
      <DoSection />
      <LowdownSection />
      <AdvertiseWithUs />
    </div>
  );
};

export default Index;
