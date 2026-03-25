import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CategoriesSection from "@/components/CategoriesSection";
import EventsSection from "@/components/EventsSection";
import WeatherSection from "@/components/WeatherSection";
import { Link } from "react-router-dom";
import AdvertiseSection from "@/components/AdvertiseSection";

const Index = () => {
  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <Navbar />
      <HeroSection />
      <CategoriesSection />
      <EventsSection />
      <WeatherSection />
      <AdvertiseSection />
    </div>
  );
};

export default Index;
