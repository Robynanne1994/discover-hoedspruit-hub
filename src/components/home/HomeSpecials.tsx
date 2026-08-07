import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";
import HomeSectionHead from "./HomeSectionHead";
import { getDisplayTitle, noTitleCaseProps } from "@/lib/displayTitle";
import { specialValue } from "@/lib/specialValue";
import { getSpecialBadge } from "@/lib/specialBadge";
import { type } from "@/lib/type";


interface Special {
  id: string;
  title: string;
  title_override?: string | null;
  business_name: string;
  image_url: string | null;
  detail_image_url: string | null;
  homepage_image_url: string | null;
  badge_override: string | null;
  day_of_week: string | null;
  discount_type: string | null;
  discount_value: number | null;
  freebie_text: string | null;
  valid_from: string | null;
  card_footer_text: string | null;
  sub_tag_1: string | null;
  sub_tag_2: string | null;
  valid_until: string | null;
  price: string | null;
  price_label: string | null;
  original_price: string | null;
  savings: string | null;
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
        .select(
          "id, title, title_override, business_name, image_url, detail_image_url, homepage_image_url, badge_override, day_of_week, discount_type, discount_value, freebie_text, redemption_note, card_footer_text, sub_tag_1, sub_tag_2, valid_from, valid_until, price, price_label, original_price, savings, is_featured, created_at",
        )
        .eq("is_active", true)
        .or(`valid_until.is.null,valid_until.gte.${today}`)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
      return (data || []) as Special[];
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

  const valueLine = (s: Special) => {
    const value = specialValue(s);
    if (value.kind === "none") return null;
    if (value.kind === "price") {
      return (
        <div style={{ marginTop: "auto", paddingTop: 10 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 32,
              padding: "0 12px",
              borderRadius: 999,
              background: "#6B7C5C",
              ...type.eyebrow,
              color: "#FFFFFF",
              whiteSpace: "nowrap",
            }}
          >
            {value.price}
          </span>
        </div>
      );
    }
    return (
      <div
        style={{
          marginTop: "auto",
          paddingTop: 10,
          ...type.cardTitleS,
          color: "#423324",
          ...clamp(2),
        }}
      >
        {value.text}
      </div>
    );
  };

  const businessRow = (s: Special, withLogo: boolean) =>
    s.business_name ? (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          minWidth: 0,
          marginTop: 4,
        }}
      >
        {withLogo ? (
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: 999,
              background: "#EEE8DA",
              flexShrink: 0,
            }}
          />
        ) : null}
        <span
          style={{
            ...type.meta,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            minWidth: 0,
          }}
        >
          {s.business_name}
        </span>
      </div>
    ) : null;

  const title = (s: Special) => (
    <div
      {...noTitleCaseProps(s)}
      style={{ ...type.cardTitleM, ...clamp(2) }}
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
        {specials.map((s) => {
          const image = s.homepage_image_url || s.image_url || s.detail_image_url;

          if (!image) {
            return (
              <Link key={s.id} to={`/specials/${s.id}`} {...press} style={cardStyle}>
                <div style={{ padding: 12, display: "flex", flexDirection: "column", flex: 1 }}>
                  {getSpecialBadge(s) && (
                    <div
                      style={{
                        ...type.label,
                        color: "#C0392B",
                        marginBottom: 6,
                      }}
                    >
                      {getSpecialBadge(s)}
                    </div>
                  )}
                  {title(s)}
                  {businessRow(s, true)}
                  <div style={{ height: 1, background: "#EAE4D5", marginTop: 10 }} />
                  {valueLine(s)}
                </div>
              </Link>
            );
          }

          return (
            <Link key={s.id} to={`/specials/${s.id}`} {...press} style={cardStyle}>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "1 / 1",
                  background: "#F4EFE3",
                }}
              >
                <img
                  src={image}
                  alt={s.business_name || getDisplayTitle(s)}
                  loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
                {getSpecialBadge(s) && (
                  <span
                    style={{
                      position: "absolute",
                      top: 10,
                      left: 10,
                      background: "#C0392B",
                      ...type.label,
                      color: "#FFFFFF",
                      padding: "5px 10px",
                      borderRadius: 999,
                      whiteSpace: "nowrap",
                      lineHeight: 1,
                    }}
                  >
                    {getSpecialBadge(s)}
                  </span>
                )}
              </div>
              <div style={{ padding: 12, display: "flex", flexDirection: "column", flex: 1 }}>
                {title(s)}
                {businessRow(s, false)}
                {valueLine(s)}
              </div>
            </Link>
          );
        })}
        <div style={{ flex: "0 0 20px" }} aria-hidden />
      </div>
    </section>
  );
};

export default HomeSpecials;
