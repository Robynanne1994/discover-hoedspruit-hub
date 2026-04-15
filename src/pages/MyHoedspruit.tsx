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
}

const BentoCard = ({ card, onClick }: { card: CardData; onClick?: () => void }) => {
  const isClickable = !!card.href;
  const textColor = card.color || "#2b2420";
  const mutedColor = card.color
    ? "rgba(255,255,255,0.5)"
    : "rgba(113,90,61,0.4)";

  return (
    <div
      onClick={onClick}
      className={isClickable ? "active:scale-[0.97] transition-transform" : ""}
      style={{
        position: "relative",
        overflow: "hidden",
        background: card.bg,
        borderRadius: 22,
        flex: 1,
        minHeight: 0,
        cursor: isClickable ? "pointer" : "default",
      }}
    >
      {/* Count top-left */}
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

      {/* Arrow top-right */}
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

      {/* Label bottom-left */}
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

  const cards: CardData[] = [
    { label: "Saved\nListings", count: savedListingsCount, href: "/saved", bg: "#f5f0e8" },
    { label: "My\nEvents", count: savedEventsCount, href: "/saved?tab=events", bg: "#ffffff" },
    { label: "Saved\nSpecials", count: savedSpecialsCount, href: "/saved?tab=specials", bg: "#715a3d", color: "#ffffff" },
    { label: "Visited\nPlaces", count: visitedCount, href: "/visited", bg: "#f5f0e8" },
    { label: "", count: null, href: null, bg: "#ffffff" },
  ];

  return (
    <div style={{ background: "#ffffff", height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "12px 14px 0" }}>
        <BackButton />
      </div>
      <div style={{ padding: "4px 14px 10px" }}>
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
        {/* Row 1: Saved Listings (short) | My Events (tall) */}
        <div style={{ display: "flex", gap: 8, flex: 4 }}>
          <div style={{ flex: 1, display: "flex" }}>
            <BentoCard card={cards[0]} onClick={() => navigate(cards[0].href!)} />
          </div>
          <div style={{ flex: 1, display: "flex" }}>
            <BentoCard card={cards[1]} onClick={() => navigate(cards[1].href!)} />
          </div>
        </div>

        {/* Row 2: Saved Specials (tall) | Visited Places (short) */}
        <div style={{ display: "flex", gap: 8, flex: 4 }}>
          <div style={{ flex: 1, display: "flex" }}>
            <BentoCard card={cards[2]} onClick={() => navigate(cards[2].href!)} />
          </div>
          <div style={{ flex: 1, display: "flex" }}>
            <BentoCard card={cards[3]} onClick={() => navigate(cards[3].href!)} />
          </div>
        </div>

        {/* Row 3: Full-width bottom card */}
        <div style={{ display: "flex", flex: 2 }}>
          <BentoCard card={cards[4]} />
        </div>
      </div>
    </div>
  );
};

export default MyHoedspruit;
