import { useState, useEffect } from "react";
import { Search, Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, Cloudy } from "lucide-react";
import { Calendar, UtensilsCrossed, Compass, Home, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-homepage.jpg";
import SearchDialog from "@/components/SearchDialog";

const categories = [
  { label: "Events", icon: Calendar, href: "/events" },
  { label: "Restaurants", icon: UtensilsCrossed, href: "/categories" },
  { label: "Activities", icon: Compass, href: "/categories" },
  { label: "Lodges", icon: Home, href: "/categories" },
  { label: "Specials", icon: Sparkles, href: "/categories" },
];

const getWeatherIcon = (code: number) => {
  if (code <= 1) return Sun;
  if (code <= 3) return Cloudy;
  if (code <= 48) return Cloud;
  if (code <= 57) return CloudDrizzle;
  if (code <= 67) return CloudRain;
  if (code <= 77) return CloudSnow;
  if (code <= 82) return CloudRain;
  if (code <= 99) return CloudLightning;
  return Sun;
};

const HomeHero = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [temp, setTemp] = useState<number | null>(null);
  const [weatherCode, setWeatherCode] = useState<number>(0);

  useEffect(() => {
    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=-24.35&longitude=30.95&current=temperature_2m,weather_code&timezone=Africa%2FJohannesburg"
    )
      .then((r) => r.json())
      .then((data) => {
        if (data?.current) {
          setTemp(Math.round(data.current.temperature_2m));
          setWeatherCode(data.current.weather_code ?? 0);
        }
      })
      .catch(() => {});
  }, []);

  const WeatherIcon = getWeatherIcon(weatherCode);

  return (
    <>
      <section className="relative pb-5">
        <div className="relative h-[220px] overflow-hidden">
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
                "linear-gradient(to bottom, hsla(35, 40%, 85%, 0.1), hsla(35, 40%, 92%, 0.3))",
            }}
          />
          <div className="absolute inset-0 flex flex-col items-center pt-10 pb-4 px-5">
            <p
              className="text-[22px] font-bold text-white leading-[1.1] text-center drop-shadow-sm"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              <span className="italic">Hello</span>
              <br />
              Hoedspruit
            </p>

            <div className="w-full mt-3">
              <p className="text-center text-[13px] font-medium mb-2.5 text-white/90 drop-shadow-sm">
                Discover what's happening in town today.
              </p>
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center w-full bg-white rounded-full shadow-sm border border-border/60 px-3.5 py-2.5 gap-2.5 cursor-pointer hover:shadow-md transition-shadow"
              >
                <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground text-xs flex-1 font-normal text-left">
                  Search events, food, stays, activities...
                </span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <WeatherIcon className="h-3.5 w-3.5 text-accent" />
                  <span className="text-[11px] font-semibold" style={{ color: "#2F241C" }}>
                    {temp !== null ? `${temp}°C` : "—"}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="-mt-4 relative z-10">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pl-4 pr-8">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.label}
                  to={cat.href}
                  className="flex items-center gap-1.5 px-3 py-2 bg-card rounded-full border border-border/50 shadow-sm whitespace-nowrap transition-all active:scale-95"
                >
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium text-foreground">{cat.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
};

export default HomeHero;
