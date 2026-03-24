import { useQuery } from "@tanstack/react-query";
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, Wind, Droplets, Thermometer, Eye } from "lucide-react";

const getWeatherIcon = (code: number) => {
  if (code === 0 || code === 1) return <Sun className="h-12 w-12 text-amber-500" />;
  if (code === 2 || code === 3) return <Cloud className="h-12 w-12 text-muted-foreground" />;
  if (code >= 51 && code <= 57) return <CloudDrizzle className="h-12 w-12 text-blue-400" />;
  if (code >= 61 && code <= 67) return <CloudRain className="h-12 w-12 text-blue-500" />;
  if (code >= 71 && code <= 77) return <CloudSnow className="h-12 w-12 text-slate-400" />;
  if (code >= 80 && code <= 82) return <CloudRain className="h-12 w-12 text-blue-600" />;
  if (code >= 95 && code <= 99) return <CloudLightning className="h-12 w-12 text-yellow-500" />;
  return <Sun className="h-12 w-12 text-amber-500" />;
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
    staleTime: 1000 * 60 * 30, // 30 minutes
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

  return (
    <section className="section-padding bg-background">
      <div className="container-wide">
        <div className="mb-8">
          <span className="text-primary font-medium text-sm tracking-widest uppercase">Live Weather</span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-3 font-sans text-stone-900">Hoedspruit Weather Today</h2>
        </div>

        <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/20 dark:to-blue-950/20 rounded-2xl border border-border p-6 sm:p-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 items-center">
            {/* Main temp */}
            <div className="flex items-center gap-4">
              {getWeatherIcon(current.weather_code)}
              <div>
                <p className="text-4xl font-bold text-foreground font-sans">
                  {Math.round(current.temperature_2m)}°C
                </p>
                <p className="text-muted-foreground text-sm">
                  {getWeatherDescription(current.weather_code)}
                </p>
              </div>
            </div>

            {/* Feels like & High/Low */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Thermometer className="h-4 w-4 text-primary/70" />
                <span>Feels like {Math.round(current.apparent_temperature)}°C</span>
              </div>
              {daily && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sun className="h-4 w-4 text-primary/70" />
                  <span>
                    H: {Math.round(daily.temperature_2m_max[0])}° &nbsp; L: {Math.round(daily.temperature_2m_min[0])}°
                  </span>
                </div>
              )}
            </div>

            {/* Wind & Humidity */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wind className="h-4 w-4 text-primary/70" />
                <span>Wind {Math.round(current.wind_speed_10m)} km/h</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Droplets className="h-4 w-4 text-primary/70" />
                <span>Humidity {current.relative_humidity_2m}%</span>
              </div>
            </div>

            {/* Sunrise & Sunset */}
            {daily && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sun className="h-4 w-4 text-amber-500" />
                  <span>Sunrise {daily.sunrise[0]?.slice(11)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4 text-orange-400" />
                  <span>Sunset {daily.sunset[0]?.slice(11)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WeatherSection;
