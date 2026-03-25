import { useQuery } from "@tanstack/react-query";
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, Wind, Droplets, Thermometer } from "lucide-react";

const getWeatherIcon = (code: number) => {
  if (code === 0 || code === 1) return <Sun className="h-10 w-10 text-accent" />;
  if (code === 2 || code === 3) return <Cloud className="h-10 w-10 text-muted-foreground" />;
  if (code >= 51 && code <= 57) return <CloudDrizzle className="h-10 w-10 text-muted-foreground" />;
  if (code >= 61 && code <= 67) return <CloudRain className="h-10 w-10 text-muted-foreground" />;
  if (code >= 71 && code <= 77) return <CloudSnow className="h-10 w-10 text-muted-foreground" />;
  if (code >= 80 && code <= 82) return <CloudRain className="h-10 w-10 text-muted-foreground" />;
  if (code >= 95 && code <= 99) return <CloudLightning className="h-10 w-10 text-accent" />;
  return <Sun className="h-10 w-10 text-accent" />;
};

const getWeatherDescription = (code: number) => {
  if (code === 0) return "Clear sky";
  if (code === 1) return "Mainly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code >= 51 && code <= 55) return "Drizzle";
  if (code >= 56 && code <= 57) return "Freezing drizzle";
  if (code >= 61 && code <= 65) return "Rain";
  if (code >= 66 && code <= 67) return "Freezing rain";
  if (code >= 71 && code <= 75) return "Snowfall";
  if (code === 77) return "Snow grains";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code >= 85 && code <= 86) return "Snow showers";
  if (code === 95) return "Thunderstorm";
  if (code >= 96 && code <= 99) return "Thunderstorm with hail";
  return "Clear";
};

const WeatherSection = () => {
  const { data: weather, isLoading } = useQuery({
    queryKey: ["weather-hoedspruit"],
    queryFn: async () => {
      const res = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=-24.3869&longitude=30.9635&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=Africa%2FJohannesburg&forecast_days=1"
      );
      if (!res.ok) throw new Error("Failed to fetch weather");
      return res.json();
    },
    staleTime: 1000 * 60 * 30,
  });

  if (isLoading) {
    return (
      <section className="section-padding bg-background">
        <div className="container-wide">
          <div className="animate-pulse h-48 bg-muted rounded-xl" />
        </div>
      </section>
    );
  }

  if (!weather?.current) return null;

  const current = weather.current;
  const daily = weather.daily;

  const stats = [
    {
      icon: <Thermometer className="h-5 w-5 text-primary" />,
      label: "Feels like",
      value: `${Math.round(current.apparent_temperature)}°C`,
    },
    {
      icon: <Wind className="h-5 w-5 text-primary" />,
      label: "Wind",
      value: `${Math.round(current.wind_speed_10m)} km/h`,
    },
    {
      icon: <Droplets className="h-5 w-5 text-primary" />,
      label: "Humidity",
      value: `${current.relative_humidity_2m}%`,
    },
    {
      icon: <Sun className="h-5 w-5 text-primary" />,
      label: "High / Low",
      value: daily
        ? `${Math.round(daily.temperature_2m_max[0])}° / ${Math.round(daily.temperature_2m_min[0])}°`
        : "—",
    },
  ];

  return (
    <section className="section-padding bg-[#f5ede0]">
      <div className="container-wide">
        <div className="mb-8">
          <span className="text-primary font-medium text-sm tracking-widest uppercase">Live Weather</span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-3 font-sans text-stone-900">
            Hoedspruit Weather Today
          </h2>
        </div>

        <div className="bg-background/80 backdrop-blur rounded-2xl border border-border overflow-hidden">
          <div className="flex flex-col sm:flex-row">
            {/* Hero temperature */}
            <div className="flex items-center gap-5 p-8 sm:p-10 sm:border-r border-border sm:min-w-[280px]">
              {getWeatherIcon(current.weather_code)}
              <div>
                <p className="text-5xl font-bold text-foreground font-sans tracking-tight">
                  {Math.round(current.temperature_2m)}°
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  {getWeatherDescription(current.weather_code)}
                </p>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 flex-1">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center gap-3 p-6 border-t sm:border-t-0 border-border [&:nth-child(odd)]:border-r [&:nth-child(n+3)]:border-t"
                >
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                    <p className="text-lg font-semibold text-foreground font-sans">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sunrise / Sunset footer */}
          {daily && (
            <div className="flex items-center justify-center gap-8 px-8 py-4 border-t border-border bg-muted/30 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-accent" /> Sunrise {daily.sunrise[0]?.slice(11)}
              </span>
              <span className="w-px h-4 bg-border" />
              <span className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-primary" /> Sunset {daily.sunset[0]?.slice(11)}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default WeatherSection;
