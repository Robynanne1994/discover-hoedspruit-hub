import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
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
  card_footer_text: string | null;
  sub_tag_1: string | null;
  sub_tag_2: string | null;
  valid_until: string | null;
}

const formatEnds = (d: string | null) => {
  if (!d) return "Ongoing";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "Ongoing";
  return `Ends ${date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
};

const HomeSpecials = () => {
  const { data: specials } = useQuery({
    queryKey: ["home-specials"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("specials")
        .select(
          "id, title, title_override, business_name, image_url, detail_image_url, homepage_image_url, deal_label, card_footer_text, sub_tag_1, sub_tag_2, valid_until, is_featured, created_at",
        )
        .eq("is_active", true)
        .or(`valid_until.is.null,valid_until.gte.${today}`)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
      return (data || []) as Special[];
    },
  });

  if (!specials || specials.length === 0) return null;

  return (
    <section>
      <HomeSectionHead primary="Active Specials" actionHref="/specials" />
      <div className="scrollbar-hide" style={{ overflowX: "auto", paddingLeft: 20 }}>
        <div style={{ display: "flex", gap: 12, paddingRight: 20 }}>
          {specials.map((s) => {
            const schedule = s.card_footer_text || s.sub_tag_1 || s.sub_tag_2 || "";
            const avatar = s.homepage_image_url || s.image_url || s.detail_image_url;
            return (
              <Link
                key={s.id}
                to={`/specials/${s.id}`}
                onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
                onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                style={{
                  width: 268,
                  flexShrink: 0,
                  background: "#ffffff",
                  borderRadius: 16,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  textDecoration: "none",
                  transition: "transform 150ms ease-out",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                {s.deal_label && (
                  <div
                    style={{
                      fontFamily: HN,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#B42318",
                      marginBottom: 6,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {s.deal_label}
                  </div>
                )}
                <div
                  {...noTitleCaseProps(s)}
                  style={{
                    fontFamily: HN,
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#1A1A1A",
                    lineHeight: 1.25,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {getDisplayTitle(s)}
                </div>
                <div
                  style={{
                    fontFamily: HN,
                    fontSize: 13,
                    color: "#6B6A5E",
                    marginTop: 4,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    minHeight: 18,
                  }}
                >
                  {schedule}
                </div>
                <div style={{ height: 1, background: "rgba(26,26,26,0.10)", margin: "12px 0" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      overflow: "hidden",
                      background: "#F4EFE3",
                      flexShrink: 0,
                    }}
                  >
                    {avatar && (
                      <img
                        src={avatar}
                        alt={s.business_name}
                        loading="lazy"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    )}
                  </div>
                  <span
                    className="line-clamp-2"
                    style={{
                      flex: 1,
                      minWidth: 0,
                      fontFamily: HN,
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#1A1A1A",
                      lineHeight: 1.25,
                    }}
                  >
                    {s.business_name}
                  </span>
                  <span style={{ fontFamily: HN, fontSize: 13, color: "#6B6A5E", flexShrink: 0 }}>
                    {formatEnds(s.valid_until)}
                  </span>
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
