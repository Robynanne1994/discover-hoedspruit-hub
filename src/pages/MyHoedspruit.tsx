import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import BackButton from "@/components/BackButton";

interface CardData {
  label: string;
  count: number | null;
  href: string | null;
  bg: string;
  color?: string;
  flex: number;
}

const BentoCard = ({ card, onClick }: { card: CardData; onClick?: () => void }) => {
  const isClickable = !!card.href;
  const textColor = card.color || "#2b2420";
  const mutedColor = card.color
    ? "rgba(255,255,255,0.5)"
    : "rgba(113,90,61,0.35)";

  return (
    <div
      onClick={onClick}
      className={isClickable ? "active:scale-[0.97] transition-transform" : ""}
      style={{
        position: "relative",
        overflow: "hidden",
        background: card.bg,
        borderRadius: 22,
        flex: card.flex,
        minHeight: 0,
        cursor: isClickable ? "pointer" : "default",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          fontSize: 12,
          fontWeight: 400,
          color: mutedColor,
          fontFamily: "var(--font-body)",
        }}
      >
        {card.count !== null ? `(${card.count})` : ""}
      </span>

      {isClickable && (
        <ArrowUpRight
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 16,
            height: 16,
            strokeWidth: 1.5,
            color: mutedColor,
          }}
        />
      )}

      {card.label && (
        <h3
          style={{
            position: "absolute",
            bottom: 14,
            left: 14,
            right: 14,
            fontFamily: "var(--font-heading)",
            fontWeight: 800,
            fontSize: 28,
            lineHeight: 1,
            color: textColor,
            textTransform: "uppercase",
            letterSpacing: "-0.5px",
            whiteSpace: "pre-line",
          }}
        >
          {card.label}
        </h3>
      )}
    </div>
  );
};

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

  // Left col: Saved Listings (short, flex 3) → Saved Specials (tall, flex 5)
  // Right col: My Events (tall, flex 5) → Visited Places (short, flex 3)
  const leftCards: CardData[] = [
    { label: "Saved\nListings", count: savedListingsCount, href: "/saved", bg: "#f5f0e8", flex: 3 },
    { label: "Saved\nSpecials", count: savedSpecialsCount, href: "/saved?tab=specials", bg: "#715a3d", color: "#ffffff", flex: 5 },
  ];
  const rightCards: CardData[] = [
    { label: "My\nEvents", count: savedEventsCount, href: "/saved?tab=events", bg: "#ffffff", flex: 5 },
    { label: "Visited\nPlaces", count: visitedCount, href: "/visited", bg: "#f5f0e8", flex: 3 },
  ];
  const bottomCard: CardData = {
    label: "",
    count: null,
    href: null,
    bg: "#ffffff",
    flex: 1,
  };

  return (
    <div style={{ background: "#ffffff", height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "12px 14px 0" }}>
        <BackButton />
      </div>
      <div style={{ padding: "4px 14px 8px" }}>
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 900,
            fontSize: 32,
            lineHeight: 1,
            letterSpacing: "-0.5px",
            color: "#2b2420",
          }}
        >
          My Hoedspruit
        </h1>
      </div>

      {/* Bento grid */}
      <div
        style={{
          padding: "0 10px",
          paddingBottom: 82,
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {/* Top masonry section */}
        <div style={{ display: "flex", gap: 8, flex: 7, minHeight: 0 }}>
          {/* Left column */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, minHeight: 0 }}>
            {leftCards.map((card, i) => (
              <BentoCard key={i} card={card} onClick={card.href ? () => navigate(card.href!) : undefined} />
            ))}
          </div>
          {/* Right column */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, minHeight: 0 }}>
            {rightCards.map((card, i) => (
              <BentoCard key={i} card={card} onClick={card.href ? () => navigate(card.href!) : undefined} />
            ))}
          </div>
        </div>

        {/* Bottom full-width card */}
        <div style={{ flex: 2, minHeight: 0, display: "flex" }}>
          <BentoCard card={bottomCard} />
        </div>
      </div>
    </div>
  );
};

export default MyHoedspruit;
