import HomeHero from "@/components/home/HomeHero";
import CategoryPills from "@/components/home/CategoryPills";
import FeaturedCarousel from "@/components/home/FeaturedCarousel";
import WhatsOnToday from "@/components/home/WhatsOnToday";
import EatSection from "@/components/home/EatSection";
import StaySection from "@/components/home/StaySection";

const Index = () => {
  return (
    <div className="min-h-screen pb-20 bg-background">
      <HomeHero />
      <CategoryPills />
      <FeaturedCarousel />
      <WhatsOnToday />
      <EatSection />
      <StaySection />
    </div>
  );
};

export default Index;
