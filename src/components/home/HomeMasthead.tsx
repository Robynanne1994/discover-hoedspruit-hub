import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Sun, Moon, Cloud, CloudSun, CloudRain, CloudDrizzle, CloudSnow, CloudLightning, CloudFog, Bell, MapPin, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
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
import GlobalMenu, { GlobalMenuTrigger } from "@/components/GlobalMenu";

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
  const props = { size: 22, strokeWidth: 1.6 } as const;
  switch (kind) {
    case "sun":
      return <Sun {...props} color="#9B5A3C" />;
    case "moon":
      return <Moon {...props} color="#9B5A3C" />;
    case "cloud-moon":
      return <Cloud {...props} color="#9B5A3C" />;
    case "cloud-sun":
      return <CloudSun {...props} color="#9B5A3C" />;
    case "cloud":
      return <Cloud {...props} color="#9B5A3C" />;
    case "fog":
      return <CloudFog {...props} color="#9B5A3C" />;
    case "drizzle":
      return <CloudDrizzle {...props} color="#9B5A3C" />;
    case "rain":
      return <CloudRain {...props} color="#9B5A3C" />;
    case "snow":
      return <CloudSnow {...props} color="#9B5A3C" />;
    case "thunder":
      return <CloudLightning {...props} color="#9B5A3C" />;
  }
};

const HomeMasthead = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [temp, setTemp] = useState<number | null>(null);
  const [weatherCode, setWeatherCode] = useState<number | null>(null);
  const [isNight, setIsNight] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  type NotifPreview = { id: string; title: string; body: string | null; link: string | null; status: string; kind: string; is_read: boolean; created_at: string };
  const [notifs, setNotifs] = useState<NotifPreview[]>([]);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  const q = search.trim();
  const { data: searchResults } = useQuery({
    queryKey: ["home-search", q],
    queryFn: async () => {
      if (q.length < 2) return [];
      const { data, error } = await supabase
        .from("listings")
        .select("id, title, image_url, location")
        .ilike("title", `%${q}%`)
        .limit(8);
      if (error) throw error;
      return data || [];
    },
    enabled: q.length >= 2,
  });

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!user) { setUnreadCount(0); setNotifs([]); return; }
    let cancelled = false;
    const load = async () => {
      const [{ data }, { count }] = await Promise.all([
        supabase
          .from("business_notifications")
          .select("id,title,body,link,status,kind,is_read,created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("business_notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false),
      ]);
      if (cancelled) return;
      setNotifs((data ?? []) as NotifPreview[]);
      setUnreadCount(count ?? 0);
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

  const iconBtn: React.CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: 999,
    background: "#EEE8DA",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    cursor: "pointer",
    flexShrink: 0,
  };

  return (
    <div style={{ paddingTop: 32 }}>
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "0 24px" }}>
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger aria-label="Notifications" style={{ ...iconBtn, position: "relative" }}>
              <Bell size={18} color="#2A2A24" strokeWidth={1.6} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -2,
                    right: -2,
                    minWidth: 18,
                    height: 18,
                    padding: "0 5px",
                    borderRadius: 999,
                    background: "#9B5A3C",
                    color: "#EEE8DA",
                    fontSize: 10,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid #EEE8DA",
                    lineHeight: 1,
                  }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-80 max-h-96 overflow-y-auto">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifs.length === 0 ? (
                <div style={{ padding: "16px 12px", fontSize: 13, color: "#6B6A5E", textAlign: "center" }}>
                  No notifications yet
                </div>
              ) : (
                notifs.map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    onSelect={async (e) => {
                      e.preventDefault();
                      if (!n.is_read) {
                        await supabase.from("business_notifications").update({ is_read: true }).eq("id", n.id);
                      }
                      navigate(n.link || "/business/dashboard");
                    }}
                    className="flex flex-col items-start gap-1 py-2"
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, width: "100%" }}>
                      {!n.is_read && (
                        <span style={{ width: 8, height: 8, borderRadius: 999, background: "#9B5A3C", flexShrink: 0 }} />
                      )}
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#2A2A24", flex: 1 }}>{n.title}</span>
                    </div>
                    {n.body && (
                      <span style={{ fontSize: 12, color: "#6B6A5E", lineHeight: 1.35, paddingLeft: n.is_read ? 0 : 14 }}>
                        {n.body.length > 90 ? n.body.slice(0, 90) + "…" : n.body}
                      </span>
                    )}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="Menu" style={iconBtn}>
            <Menu size={18} color="#2A2A24" strokeWidth={1.6} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-60">
            <DropdownMenuLabel>Quick links</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/saved")}><Heart className="mr-2 h-4 w-4" /> Saved</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/saved?tab=events")}><Calendar className="mr-2 h-4 w-4" /> Saved events</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/saved?tab=specials")}><Tag className="mr-2 h-4 w-4" /> Saved specials</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/visited")}><MapPinCheck className="mr-2 h-4 w-4" /> Been here</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/my-hoedspruit")}><Bookmark className="mr-2 h-4 w-4" /> My Hoedspruit</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/notifications")}><Bell className="mr-2 h-4 w-4" /> Notifications</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/account-settings")}><Settings className="mr-2 h-4 w-4" /> Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/account-settings/info")}><UserCircle className="mr-2 h-4 w-4" /> Account info</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/privacy-security")}><Shield className="mr-2 h-4 w-4" /> Privacy & security</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/faqs")}><HelpCircle className="mr-2 h-4 w-4" /> FAQs</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/feedback")}><MessageSquare className="mr-2 h-4 w-4" /> Feedback</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/contact")}><Phone className="mr-2 h-4 w-4" /> Contact us</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/about")}><Info className="mr-2 h-4 w-4" /> About</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/advertise")}><Megaphone className="mr-2 h-4 w-4" /> Advertise</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Masthead */}
      <div style={{ padding: "24px 24px 0" }}>
        <p
          style={{
            margin: 0,
            marginBottom: 14,
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: 400,
            fontSize: 12,
            lineHeight: 1,
            letterSpacing: "2.4px",
            color: "rgba(238, 232, 218, 0.7)",
            textTransform: "uppercase",
          }}
        >
          Your Lowveld Local
        </p>
        <h1
          style={{
            margin: 0,
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: 64,
            lineHeight: 0.92,
            letterSpacing: "-2px",
            color: "#EEE8DA",
          }}
        >
          <span style={{ fontWeight: 400, fontStyle: "normal" }}>Hello</span>
          <br />
          <span style={{ fontWeight: 300, fontStyle: "italic" }}>Hoedspruit</span>
        </h1>
      </div>

      {/* Search + weather */}
      <div style={{ padding: "28px 24px 0", display: "flex", gap: 8 }}>
        <div ref={searchWrapRef} style={{ flex: 1, position: "relative", minWidth: 0 }}>
          <div
            style={{
              height: 52,
              background: "rgba(238, 232, 218, 0.92)",
              borderRadius: 999,
              padding: "0 18px 0 22px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Search size={18} color="#6B6A5E" strokeWidth={1.6} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search the 'Hoed..."
              style={{
                flex: 1,
                minWidth: 0,
                background: "transparent",
                border: "none",
                outline: "none",
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontSize: 14,
                color: "#2A2A24",
              }}
              className="placeholder:text-[#6B6A5E]"
            />
            {search && (
              <button
                onClick={() => { setSearch(""); setSearchOpen(false); }}
                aria-label="Clear search"
                style={{ background: "transparent", border: "none", padding: 0, display: "flex", cursor: "pointer" }}
              >
                <X size={16} color="#6B6A5E" strokeWidth={1.8} />
              </button>
            )}
          </div>

          {searchOpen && q.length >= 2 && (
            <div
              style={{
                position: "absolute",
                top: 60,
                left: 0,
                right: 0,
                background: "#EEE8DA",
                borderRadius: 18,
                padding: 8,
                boxShadow: "0 12px 32px rgba(0,0,0,0.2)",
                zIndex: 50,
                maxHeight: 360,
                overflowY: "auto",
              }}
            >
              {(searchResults?.length ?? 0) === 0 ? (
                <div style={{ padding: "16px 12px", fontSize: 13, color: "#6B6A5E", textAlign: "center" }}>
                  No matches found
                </div>
              ) : (
                searchResults!.map((listing) => (
                  <Link
                    key={listing.id}
                    to={`/listing/${listing.id}`}
                    onClick={() => { setSearchOpen(false); setSearch(""); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: 8,
                      borderRadius: 12,
                      textDecoration: "none",
                    }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 10, overflow: "hidden", background: "#e6e0d2", flexShrink: 0 }}>
                      {listing.image_url && (
                        <img src={listing.image_url} alt={listing.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, color: "#2A2A24", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {listing.title}
                      </p>
                      {listing.location && (
                        <p style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#6B6A5E", margin: "2px 0 0" }}>
                          <MapPin size={11} strokeWidth={1.8} />
                          {listing.location}
                        </p>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
        <div
          style={{
            height: 52,
            background: "rgba(238, 232, 218, 0.92)",
            borderRadius: 999,
            padding: "0 18px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          <WeatherIcon kind={getWeatherIconKind(weatherCode, isNight)} />
          <span style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 15, color: "#2A2A24" }}>
            {temp !== null ? `${temp}°` : "—"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default HomeMasthead;
