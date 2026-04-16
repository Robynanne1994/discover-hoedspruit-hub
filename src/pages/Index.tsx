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
    <div style={{ minHeight: "100dvh", background: "#ebebeb", display: "flex", flexDirection: "column", overflow: "hidden", paddingBottom: 84 }}>
      <div style={{ flex: 1, overflowY: "auto" }}>
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
    </div>
  );
};

export default Index;
