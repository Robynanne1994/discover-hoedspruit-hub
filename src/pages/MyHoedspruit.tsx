import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import BackButton from "@/components/BackButton";

interface CardConfig {
  image_url?: string;
  text_color?: string;
  icon_color?: string;
  count_color?: string;
  bg_color?: string;
  text_transform?: "none" | "uppercase" | "capitalize";
  text_size?: number;
}

type CardsConfig = Record<string, CardConfig>;

const MyHoedspruit = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: savedListingsCount = 0 } = useQuery({
    queryKey: ["favourites-count", "listing", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("favourites")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("item_type", "listing");
      return count ?? 0;
    },
    enabled: !!user,
  });

  const { data: savedEventsCount = 0 } = useQuery({
    queryKey: ["favourites-count", "event", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("favourites")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("item_type", "event");
      return count ?? 0;
    },
    enabled: !!user,
  });

  const { data: savedSpecialsCount = 0 } = useQuery({
    queryKey: ["favourites-count", "special", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("favourites")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("item_type", "special");
      return count ?? 0;
    },
    enabled: !!user,
  });

  const { data: visitedCount = 0 } = useQuery({
    queryKey: ["been-here-count", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("been_here")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id);
      return count ?? 0;
    },
    enabled: !!user,
  });

  const { data: cardsConfig = {} as CardsConfig } = useQuery({
    queryKey: ["site-content", "my-hoedspruit-cards"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_content")
        .select("content")
        .eq("section", "my-hoedspruit-cards")
        .maybeSingle();
      if (data?.content && typeof data.content === "object" && !Array.isArray(data.content)) {
        return data.content as CardsConfig;
      }
      return {} as CardsConfig;
    },
  });

  const getCardConfig = (key: string): CardConfig => cardsConfig[key] || {};

  const cards = [
    { key: "saved-listings", label: "Saved\nListings", count: savedListingsCount, href: "/saved", bg: "#f5f0e8", defaultTextColor: "#2b2420" },
    { key: "my-events", label: "My\nEvents", count: savedEventsCount, href: "/saved?tab=events", bg: "#ffffff", defaultTextColor: "#2b2420" },
    { key: "saved-specials", label: "Saved\nSpecials", count: savedSpecialsCount, href: "/saved?tab=specials", bg: "#715a3d", defaultTextColor: "#ffffff" },
    { key: "visited-places", label: "Visited\nPlaces", count: visitedCount, href: "/visited", bg: "#f5f0e8", defaultTextColor: "#2b2420" },
    { key: "coming-soon", label: "", count: null, href: null, bg: "#ffffff", defaultTextColor: "#2b2420" },
  ];

  const leftCards = [cards[0], cards[2]];
  const rightCards = [cards[1], cards[3], cards[4]];

  const renderCard = (card: typeof cards[0], index: number, flexOverride?: number) => {
    const isClickable = !!card.href;
    const cfg = getCardConfig(card.key);
    const hasBgImage = !!cfg.image_url;
    const cardBg = cfg.bg_color || card.bg;

    // Text color: admin hex > default per card
    const textColor = cfg.text_color || card.defaultTextColor;

    // Icon and count colors: separate overrides
    const defaultSubtle = textColor === "#ffffff" ? "rgba(255,255,255,0.7)" : "rgba(18,18,20,0.4)";
    const iconColor = cfg.icon_color || defaultSubtle;
    const countColor = cfg.count_color || defaultSubtle;
    const arrowColor = cfg.icon_color || (textColor === "#ffffff" ? "rgba(255,255,255,0.65)" : "rgba(18,18,20,0.3)");

    // Text transform & size
    const textTransform = cfg.text_transform || "uppercase";
    const textSize = cfg.text_size || 26;

    return (
      <div
        key={index}
        onClick={isClickable ? () => navigate(card.href!) : undefined}
        className={isClickable ? "active:scale-[0.98] transition-transform" : ""}
        style={{
          position: "relative",
          overflow: "hidden",
          background: cardBg,
          borderRadius: 16,
          flex: flexOverride ?? 1,
          border: hasBgImage ? "none" : "1px solid rgba(18,18,20,0.06)",
          cursor: isClickable ? "pointer" : "default",
        }}
      >
        {hasBgImage && (
          <img src={cfg.image_url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        )}
        {hasBgImage && (
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.05) 100%)" }} />
        )}

        <div style={{ position: "absolute", top: 12, left: 12, fontSize: 15, fontWeight: 400, color: countColor, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", zIndex: 1 }}>
          {card.count !== null ? `(${card.count})` : ""}
        </div>

        {isClickable && (
          <div style={{ position: "absolute", top: 12, right: 12, zIndex: 1 }}>
            <ArrowUpRight style={{ width: 22, height: 22, strokeWidth: 2.5, color: arrowColor }} />
          </div>
        )}

        <div style={{ position: "absolute", bottom: 12, left: 12, right: 12, zIndex: 1 }}>
          <h3
            style={{
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontWeight: 400,
              fontSize: textSize,
              lineHeight: 1,
              color: textColor,
              textTransform: textTransform as any,
              letterSpacing: "0.01em",
              whiteSpace: "pre-line",
            }}
          >
            {card.label}
          </h3>
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: "#ebebeb", height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden", maxHeight: "100dvh" }}>
      <div style={{ paddingTop: 16, paddingLeft: 24, paddingRight: 24 }}>
        <BackButton />
      </div>
      <div style={{ paddingTop: 8, paddingLeft: 24, paddingRight: 24, marginBottom: 16 }}>
        <h1
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: 400,
            fontSize: 34,
            lineHeight: 1,
            letterSpacing: "0.01em",
            color: "#2b2420",
          }}
        >
          My Hoedspruit
        </h1>
      </div>
      <div style={{ paddingLeft: 4, paddingRight: 4, paddingBottom: 84, display: "flex", gap: 4, flex: "0 1 calc(100% - 140px)", minHeight: 0 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          {renderCard(leftCards[0], 0, 2)}
          {renderCard(leftCards[1], 1)}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          {rightCards.map((card, i) => renderCard(card, i + leftCards.length))}
        </div>
      </div>
    </div>
  );
};

export default MyHoedspruit;
