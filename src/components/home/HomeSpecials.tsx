import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import HomeSectionHead from "./HomeSectionHead";
import { getDisplayTitle, noTitleCaseProps } from "@/lib/displayTitle";

const HN = "'Helvetica Neue', Helvetica, Arial, sans-serif";

interface Special {
  id: string;
  title: string;
  title_override?: string | null;
  business_name: string;
  image_url: string | null;
  detail_image_url: string | null;
  homepage_image_url: string | null;
  deal_label: string;
  valid_until: string | null;
  description: string | null;
  card_footer_text: string | null;
  price: string | null;
  price_label: string | null;
  savings: string | null;
}

const stripMarkdown = (md: string): string => {
  return md
    .split("\n")
    .filter((line) => !/^\s*#{1,6}\s/.test(line))
    .join("\n")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n\s*\n/g, " ")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const formatValidity = (s: Special): string | null => {
  if (s.card_footer_text && s.card_footer_text.trim()) return s.card_footer_text;
  if (!s.valid_until) return "Ongoing";
  const d = new Date(s.valid_until);
  if (isNaN(d.getTime())) return null;
  const day = d.getDate();
  const month = d.toLocaleString("en-GB", { month: "short" });
  const now = new Date();
  const yearPart = d.getFullYear() !== now.getFullYear() ? ` ${d.getFullYear()}` : "";
  return `Valid Until ${day} ${month}${yearPart}`;
};

const getBodyText = (s: Special): string | null => {
  if (s.description && s.description.trim()) {
    const plain = stripMarkdown(s.description);
    if (plain) return plain;
  }
  if (s.price) {
    return s.price_label ? `${s.price} ${s.price_label}` : s.price;
  }
  if (s.savings) return s.savings;
  return null;
};

const Pill = ({ children }: { children: React.ReactNode }) => (
  <span
    style={{
      background: "#F4EFE3",
      borderRadius: 999,
      padding: "4px 10px",
      fontFamily: HN,
      fontSize: 11,
      color: "#1A1A1A",
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </span>
);

const HomeSpecials = () => {
  const { data: specials } = useQuery({
    queryKey: ["home-specials"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("specials")
        .select(
          "id, title, title_override, business_name, image_url, detail_image_url, homepage_image_url, deal_label, valid_until, description, card_footer_text, price, price_label, savings"
        )
        .eq("is_active", true)
        .or(`valid_until.is.null,valid_until.gte.${today}`)
        .order("created_at", { ascending: false });
      return (data || []) as Special[];
    },
  });

  if (!specials || specials.length === 0) return null;

  return (
    <section>
      <HomeSectionHead primary="Active Specials" actionHref="/specials" />
      <div className="scrollbar-hide" style={{ overflowX: "auto", paddingLeft: 20 }}>
        <div style={{ display: "flex", gap: 8, paddingRight: 20 }}>
          {specials.map((s) => {
            const img = s.homepage_image_url || s.image_url || s.detail_image_url;
            const body = getBodyText(s);
            const validity = formatValidity(s);
            return (
              <Link
                key={s.id}
                to={`/specials/${s.id}`}
                onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
                onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                style={{
                  width: 320,
                  flexShrink: 0,
                  background: "#FFFFFF",
                  borderRadius: 16,
                  padding: 12,
                  display: "flex",
                  flexDirection: "column",
                  textDecoration: "none",
                  transition: "transform 150ms ease-out",
                }}
              >
                <div style={{ display: "flex", flexDirection: "row", gap: 12 }}>
                  <div
                    style={{
                      width: 84,
                      height: 84,
                      borderRadius: 12,
                      background: "#F4EFE3",
                      flexShrink: 0,
                      overflow: "hidden",
                    }}
                  >
                    {img && (
                      <img
                        src={img}
                        alt={s.title}
                        loading="lazy"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    )}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: HN,
                        fontSize: 11,
                        letterSpacing: "0.3px",
                        color: "#6B6A5E",
                        marginBottom: 4,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.business_name}
                    </div>
                    <div
                      {...noTitleCaseProps(s)}
                      style={{
                        fontFamily: HN,
                        fontSize: 16,
                        color: "#1A1A1A",
                        lineHeight: 1.25,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        wordBreak: "break-word",
                      }}
                    >
                      {getDisplayTitle(s)}
                    </div>
                  </div>
                </div>

                {body && (
                  <div
                    style={{
                      marginTop: 8,
                      fontFamily: HN,
                      fontSize: 13,
                      color: "#6B6A5E",
                      lineHeight: 1.45,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {body}
                  </div>
                )}

                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    flexDirection: "row",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {s.deal_label && <Pill>{s.deal_label}</Pill>}
                  {validity && <Pill>{validity}</Pill>}
                  <ArrowUpRight
                    size={14}
                    strokeWidth={1.5}
                    color="#6B6A5E"
                    style={{ marginLeft: "auto" }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HomeSpecials;
