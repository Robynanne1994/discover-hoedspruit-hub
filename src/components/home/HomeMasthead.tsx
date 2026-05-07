import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Search, Sun, Moon, Cloud, CloudSun, CloudRain, CloudDrizzle, CloudSnow, CloudLightning, CloudFog, Heart, Calendar, Tag, MapPinCheck, Bookmark, Bell, Settings, UserCircle, Shield, HelpCircle, MessageSquare, Phone, Info, Megaphone, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const SANS = "'Pragmatica', 'Inter', 'Helvetica Neue', Helvetica, sans-serif";
const DISPLAY = "'Helvetica Neue', Helvetica, 'Pragmatica', sans-serif";
const SERIF = "'Playfair Display', 'Helvetica Neue', serif";

type WeatherIconKind = "sun" | "moon" | "cloud-sun" | "cloud-moon" | "cloud" | "fog" | "drizzle" | "rain" | "snow" | "thunder";

const getWeatherIconKind = (code: number | null, isNight: boolean): WeatherIconKind => {
  if (code === null) return isNight ? "moon" : "sun";
  if (code === 0) return isNight ? "moon" : "sun";
  if (code === 1 || code === 2) return isNight ? "cloud-moon" : "cloud-sun";
  if (code === 3) return "cloud";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return "snow";
  if (code >= 95 && code <= 99) return "thunder";
  return isNight ? "moon" : "sun";
};

const WeatherIcon = ({ kind }: { kind: WeatherIconKind }) => {
  const props = { size: 16, strokeWidth: 2 } as const;
  switch (kind) {
    case "sun":
      return <Sun {...props} color="#F26A48" fill="#F26A48" />;
    case "moon":
      return <Moon {...props} color="#3F4C7A" fill="#3F4C7A" />;
    case "cloud-moon":
      return <Cloud {...props} color="#3F4C7A" />;
    case "cloud-sun":
      return <CloudSun {...props} color="#F26A48" />;
    case "cloud":
      return <Cloud {...props} color="#8A8480" />;
    case "fog":
      return <CloudFog {...props} color="#8A8480" />;
    case "drizzle":
      return <CloudDrizzle {...props} color="#5B8DEF" />;
    case "rain":
      return <CloudRain {...props} color="#3F6FD8" />;
    case "snow":
      return <CloudSnow {...props} color="#7BB7D9" />;
    case "thunder":
      return <CloudLightning {...props} color="#6B5BD8" />;
  }
};

const HomeMasthead = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [temp, setTemp] = useState<number | null>(null);
  const [weatherCode, setWeatherCode] = useState<number | null>(null);
  const [isNight, setIsNight] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    let cancelled = false;
    const load = async () => {
      const { count } = await supabase
        .from("business_notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      if (!cancelled) setUnreadCount(count ?? 0);
    };
    load();
    const channel = supabase
      .channel("home-biz-notifs")
      .on("postgres_changes", { event: "*", schema: "public", table: "business_notifications", filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=-24.35&longitude=30.95&current=temperature_2m,weather_code,is_day&timezone=Africa%2FJohannesburg"
    )
      .then((r) => r.json())
      .then((d) => {
        if (d?.current) {
          setTemp(Math.round(d.current.temperature_2m));
          if (typeof d.current.weather_code === "number") setWeatherCode(d.current.weather_code);
          if (typeof d.current.is_day === "number") setIsNight(d.current.is_day === 0);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{ paddingTop: 16 }}>
      {/* Top bar: only menu button on the right */}
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 24px 0" }}>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Menu"
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              background: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              cursor: "pointer",
            }}
          >
            <Menu size={16} color="#0A0A0A" strokeWidth={2} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-60">
            <DropdownMenuLabel>Quick links</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/saved")}>
              <Heart className="mr-2 h-4 w-4" /> Saved
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/saved?tab=events")}>
              <Calendar className="mr-2 h-4 w-4" /> Saved events
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/saved?tab=specials")}>
              <Tag className="mr-2 h-4 w-4" /> Saved specials
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/visited")}>
              <MapPinCheck className="mr-2 h-4 w-4" /> Been here
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/my-hoedspruit")}>
              <Bookmark className="mr-2 h-4 w-4" /> My Hoedspruit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/notifications")}>
              <Bell className="mr-2 h-4 w-4" /> Notifications
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/account-settings")}>
              <Settings className="mr-2 h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/account-settings/info")}>
              <UserCircle className="mr-2 h-4 w-4" /> Account info
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/privacy-security")}>
              <Shield className="mr-2 h-4 w-4" /> Privacy & security
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/faqs")}>
              <HelpCircle className="mr-2 h-4 w-4" /> FAQs
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/feedback")}>
              <MessageSquare className="mr-2 h-4 w-4" /> Feedback
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/contact")}>
              <Phone className="mr-2 h-4 w-4" /> Contact us
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/about")}>
              <Info className="mr-2 h-4 w-4" /> About
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/advertise")}>
              <Megaphone className="mr-2 h-4 w-4" /> Advertise
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Masthead */}
      <div style={{ padding: "28px 24px 0" }}>
        <h1
          style={{
            margin: 0,
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: 58,
            lineHeight: 0.92,
            letterSpacing: "-0.035em",
            color: "#0A0A0A",
            position: "relative",
          }}
        >
          Hello<br />Hoedspruit
        </h1>
        <p
          style={{
            marginTop: 18,
            marginBottom: 0,
            fontFamily: SANS,
            fontSize: 18,
            fontWeight: 600,
            color: "#6B6560",
            lineHeight: 1.45,
            maxWidth: 260,
            textTransform: "none",
          }}
        >
          Your Lowveld Local
        </p>
      </div>

      {/* Search row */}
      <div style={{ padding: "24px 24px 0", display: "flex", gap: 8 }}>
        <Link
          to="/categories"
          style={{
            flex: 1,
            background: "#FFFFFF",
            borderRadius: 999,
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            minWidth: 0,
          }}
        >
          <Search size={16} color="#8A8480" strokeWidth={2} />
          <span
            style={{
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: 12,
              fontStyle: "italic",
              color: "#8A8480",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Search the 'Hoed...
          </span>
        </Link>
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 999,
            padding: "14px 24px",
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
          }}
        >
          <WeatherIcon kind={getWeatherIconKind(weatherCode, isNight)} />
          <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 500, color: "#0A0A0A" }}>
            {temp !== null ? `${temp}°` : "—"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default HomeMasthead;
