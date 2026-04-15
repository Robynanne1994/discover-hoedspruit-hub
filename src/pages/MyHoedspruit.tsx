import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Json } from "@/integrations/supabase/types";

const MyHoedspruit = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch counts
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

  // Fetch visited card background image
  const { data: visitedBgData } = useQuery({
    queryKey: ["site-content", "my-hoedspruit-visited-bg"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_content")
        .select("content")
        .eq("section", "my-hoedspruit-visited-bg")
        .maybeSingle();
      const content = data?.content as { image_url?: string } | null;
      return content?.image_url || null;
    },
  });

  const cards = [
    {
      label: "Saved\nListings",
      count: savedListingsCount,
      href: "/saved",
      bg: "#f5f0e8",
      flex: 5,
    },
    {
      label: "My\nEvents",
      count: savedEventsCount,
      href: "/saved?tab=events",
      bg: "#ffffff",
      flex: 3,
    },
    {
      label: "Saved\nSpecials",
      count: savedSpecialsCount,
      href: "/saved?tab=specials",
      bg: "#715a3d",
      color: "#ffffff",
      flex: 4,
    },
    {
      label: "Visited\nPlaces",
      count: visitedCount,
      href: "/visited",
      bg: "#f5f0e8",
      flex: 5,
      bgImage: visitedBgData || undefined,
    },
    {
      label: "Coming\nSoon",
      count: null,
      href: null,
      bg: "#ffffff",
      flex: 3,
    },
  ];

  // Masonry: split into 2 columns
  const leftCards = [cards[0], cards[2], cards[4]];
  const rightCards = [cards[1], cards[3]];

  const renderCard = (card: typeof cards[0], index: number) => {
    const isClickable = !!card.href;
    const textColor = card.color || "#2b2420";

    const cardContent = (
      <>
        {/* Count top-left */}
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            fontSize: 13,
            fontWeight: 500,
            color: card.color ? "rgba(255,255,255,0.6)" : "rgba(18,18,20,0.35)",
            fontFamily: "var(--font-body)",
          }}
        >
          {card.count !== null ? `(${card.count})` : ""}
        </div>

        {/* Arrow top-right */}
        {isClickable && (
          <div style={{ position: "absolute", top: 14, right: 14 }}>
            <ArrowUpRight
              style={{
                width: 18,
                height: 18,
                strokeWidth: 2,
                color: card.color ? "rgba(255,255,255,0.5)" : "rgba(18,18,20,0.25)",
              }}
            />
          </div>
        )}

        {/* Label bottom-left */}
        <div style={{ position: "absolute", bottom: 16, left: 16, right: 16 }}>
          <h3
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 800,
              fontSize: 26,
              lineHeight: 1.05,
              color: textColor,
              textTransform: "uppercase",
              letterSpacing: "-0.3px",
              whiteSpace: "pre-line",
            }}
          >
            {card.label}
          </h3>
        </div>
      </>
    );

    return (
      <div
        key={index}
        onClick={isClickable ? () => navigate(card.href!) : undefined}
        className={isClickable ? "active:scale-[0.98] transition-transform" : ""}
        style={{
          position: "relative",
          overflow: "hidden",
          background: card.bg,
          borderRadius: 16,
          flex: card.flex,
          border: "1px solid rgba(18,18,20,0.06)",
          cursor: isClickable ? "pointer" : "default",
        }}
      >
        {cardContent}
      </div>
    );
  };

  return (
    <div style={{ background: "#ffffff", height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ paddingTop: 16, paddingLeft: 24, paddingRight: 24 }}>
        <BackButton />
      </div>

      <div style={{ paddingTop: 8, paddingLeft: 24, paddingRight: 24, marginBottom: 16 }}>
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 900,
            fontSize: 34,
            lineHeight: 1,
            letterSpacing: "-0.5px",
            color: "#2b2420",
          }}
        >
          My Hoedspruit
        </h1>
      </div>

      {/* Bento grid - fills remaining space */}
      <div
        style={{
          paddingLeft: 16,
          paddingRight: 16,
          paddingBottom: 84,
          display: "flex",
          gap: 10,
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Left column */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
          {leftCards.map((card, i) => renderCard(card, i))}
        </div>

        {/* Right column */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
          {rightCards.map((card, i) => renderCard(card, i + leftCards.length))}
        </div>
      </div>
    </div>
  );
};

export default MyHoedspruit;
