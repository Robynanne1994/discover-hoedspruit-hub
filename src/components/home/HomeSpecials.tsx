import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Store } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import HomeSectionHead from "./HomeSectionHead";
import { getDisplayTitle, noTitleCaseProps } from "@/lib/displayTitle";
import { specialImage, type SpecialCardLike } from "@/lib/specialCard";
import SpecialBadgePill from "@/components/specials/SpecialBadgePill";
import SpecialValueBar from "@/components/specials/SpecialValueBar";
import { type } from "@/lib/type";


// The columns every specials surface reads. Kept in one place so the select
// below and the card model can't drift apart.
const SPECIAL_CARD_COLUMNS =
  "id, title, title_override, business_name, image_url, detail_image_url, homepage_image_url, saved_image_url, " +
  "badge_override, day_of_week, discount_type, discount_value, freebie_text, card_deal_text, card_footer_text, " +
  "valid_from, valid_until, price, price_label, original_price, savings, is_featured, created_at";

interface Special extends SpecialCardLike {
  id: string;
  title: string;
  title_override?: string | null;
  business_name: string;
}

const clamp = (lines: number) => ({
  display: "-webkit-box" as const,
  WebkitLineClamp: lines,
  WebkitBoxOrient: "vertical" as const,
  overflow: "hidden" as const,
});

const cardStyle: React.CSSProperties = {
  flex: "0 0 calc((100vw - 32px) / 1.5)",
  minWidth: 200,
  maxWidth: 280,
  scrollSnapAlign: "start",
  background: "#FFFFFF",
  borderRadius: 18,
  overflow: "hidden",
  boxShadow: "0 1px 4px -1px rgba(0,0,0,0.04)",
  textDecoration: "none",
  display: "flex",
  flexDirection: "column",
  transition: "transform 150ms ease-out",
};

const HomeSpecials = () => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { data: specials } = useQuery({
    queryKey: ["home-specials"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("specials")
        .select(SPECIAL_CARD_COLUMNS)
        .eq("is_active", true)
        .or(`valid_until.is.null,valid_until.gte.${today}`)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
      return (data || []) as unknown as Special[];
    },
  });

  useEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollLeft = 0;
  }, [specials]);

  if (!specials || specials.length === 0) return null;

  const press = {
    onPointerDown: (e: React.PointerEvent<HTMLAnchorElement>) =>
      (e.currentTarget.style.transform = "scale(0.98)"),
    onPointerUp: (e: React.PointerEvent<HTMLAnchorElement>) =>
      (e.currentTarget.style.transform = "scale(1)"),
    onPointerLeave: (e: React.PointerEvent<HTMLAnchorElement>) =>
      (e.currentTarget.style.transform = "scale(1)"),
  };

  const businessRow = (s: Special) =>
    s.business_name ? (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          marginTop: 2,
        }}
      >
        <Store size={12} style={{ flexShrink: 0 }} />
        <div
          style={{
            ...type.meta,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            minWidth: 0,
          }}
        >
          {s.business_name}
        </div>
      </div>
    ) : null;

  const title = (s: Special) => (
    <div
      {...noTitleCaseProps(s)}
      style={{ ...type.cardTitleM, ...clamp(1) }}
    >
      {getDisplayTitle(s)}
    </div>
  );

  return (
    <section>
      <HomeSectionHead primary="Active Specials" actionHref="/specials" />
      <div
        ref={scrollerRef}
        className="scrollbar-hide"
        style={{
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          scrollPaddingLeft: 20,
          scrollPaddingRight: 20,
          padding: "0 20px",
          display: "flex",
          alignItems: "stretch",
          gap: 12,
        }}
      >
        {specials.slice(0, 6).map((s) => {
          const image = specialImage(s, "home");

          return (
            <Link key={s.id} to={`/specials/${s.id}`} {...press} style={cardStyle}>
              {/* Always render the image block at the same height so every card
                  lines up, even when a special has no photo. */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: 190,
                  background: "#F4EFE3",
                  flexShrink: 0,
                }}
              >
                {image ? (
                  <img
                    src={image}
                    alt={s.business_name || getDisplayTitle(s)}
                    loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 12px",
                    }}
                  >
                    <SpecialBadgePill special={s} />
                  </div>
                )}
                {image && (
                  <SpecialBadgePill
                    special={s}
                    style={{ position: "absolute", top: 10, left: 10, maxWidth: "calc(100% - 20px)" }}
                  />
                )}
              </div>

              <div style={{ padding: "12px 12px 8px", display: "flex", flexDirection: "column", flex: 1 }}>
                {title(s)}
                {businessRow(s)}
              </div>

              {/* Same value strip as the specials page — money left, time right */}
              <SpecialValueBar special={s} />
            </Link>
          );
        })}
        
      </div>
    </section>
  );
};

export default HomeSpecials;
