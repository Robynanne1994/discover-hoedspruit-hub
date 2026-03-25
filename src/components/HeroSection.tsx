import { MapPin, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bushveld.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }} />
      
      <div
        className="absolute inset-0"
        style={{ background: "var(--hero-overlay)" }} />
      

      <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-sm border border-primary/30 rounded-full px-4 py-2 mb-8 animate-fade-up">
          <MapPin className="h-4 w-4 text-accent" />
          <span className="text-primary-foreground text-sm font-medium tracking-wide">
            Limpopo, South Africa
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold text-primary-foreground mb-6 leading-tight animate-fade-up font-sans lg:text-8xl" style={{ animationDelay: "0.1s" }}>
          Hello
          <span className="text-accent"> Hoedspruit</span>
        </h1>

        <p className="text-primary-foreground/80 text-lg sm:text-xl max-w-2xl mx-auto mb-10 font-light leading-relaxed animate-fade-up" style={{ animationDelay: "0.2s" }}>
          Eat. Explore. Experience. Everything Hoedspruit, all in one place.
        </p>

      </div>

      <a
        href="#categories"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-primary-foreground/60 hover:text-primary-foreground transition-colors animate-bounce">
        
        <ArrowDown className="h-6 w-6" />
      </a>
    </section>);

};

export default HeroSection;