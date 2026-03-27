import { Search, Sun } from "lucide-react";
import heroBg from "@/assets/hero-homepage.jpg";

const HomeHero = () => {
  return (
    <section className="relative pb-6">
      {/* Background image with warm overlay */}
      <div className="relative h-[220px] overflow-hidden">
        <img
          src={heroBg}
          alt="Hoedspruit bushveld sunset"
          className="w-full h-full object-cover"
          width={1080}
          height={720}
        />
        <div
          className="absolute inset-0"
          style={{ background: "var(--hero-overlay)" }}
        />
        {/* Logo / Brand */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <h1 className="text-3xl font-bold tracking-tight leading-tight text-center" style={{ fontFamily: "var(--font-heading)" }}>
            Hello
            <br />
            Hoedspruit
          </h1>
        </div>
      </div>

      {/* Content below hero */}
      <div className="px-4 -mt-5 relative z-10">
        <p className="text-muted-foreground text-sm mb-3 text-center">
          Discover what's happening in town today.
        </p>

        {/* Search bar */}
        <div className="flex items-center bg-card rounded-full shadow-card border border-border px-4 py-3 gap-3">
          <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground text-sm flex-1">
            Search events, food, stays, activities...
          </span>
          <div className="flex items-center gap-1 text-accent flex-shrink-0">
            <Sun className="h-4 w-4" />
            <span className="text-xs font-semibold text-foreground">28°C</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeHero;
