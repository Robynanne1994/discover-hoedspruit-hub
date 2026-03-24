import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CategoriesSection from "@/components/CategoriesSection";
import EventsSection from "@/components/EventsSection";
import WeatherSection from "@/components/WeatherSection";
import { Link } from "react-router-dom";
import AdvertiseSection from "@/components/AdvertiseSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <CategoriesSection />
      <EventsSection />
      <AdvertiseSection />
      <Footer />
    </div>
  );
};

export default Index;
