import { Search, Sun } from "lucide-react";
import heroBg from "@/assets/hero-homepage.jpg";

const HomeHero = () => {
  return (
    <section className="relative pb-2">
      {/* Background image with light warm overlay */}
      <div className="relative h-[180px] overflow-hidden">
        <img
          src={heroBg}
          alt="Hoedspruit bushveld sunrise"
          className="w-full h-full object-cover"
          width={1080}
          height={720}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, hsla(35, 40%, 85%, 0.25), hsla(35, 40%, 92%, 0.5))",
          }}
        />
        {/* Logo / Brand */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
          <p
            className="text-[22px] font-bold text-white leading-[1.1] text-center drop-shadow-sm"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            <span className="italic">Hello</span>
            <br />
            Hoedspruit
          </p>
        </div>
      </div>

      {/* Subheading + search */}
      <div className="px-5 mt-2 relative z-10">
        <p
          className="text-center text-[13px] font-medium mb-2.5"
          style={{ color: "#6B5E52" }}
        >
          Discover what's happening in town today.
        </p>

        {/* Search bar */}
        <div className="flex items-center bg-white rounded-full shadow-sm border border-border/60 px-3.5 py-2.5 gap-2.5">
          <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground text-xs flex-1 font-normal">
            Search events, food, stays, activities...
          </span>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Sun className="h-3.5 w-3.5 text-accent" />
            <span className="text-[11px] font-semibold" style={{ color: "#2F241C" }}>
              28°C
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeHero;
