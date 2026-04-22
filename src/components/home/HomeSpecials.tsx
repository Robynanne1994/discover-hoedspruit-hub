import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import HomeSectionHead from "./HomeSectionHead";

const SANS = "'Pragmatica', 'Inter', 'Helvetica Neue', Helvetica, sans-serif";
const SERIF = "'Playfair Display', 'Helvetica Neue', serif";

interface Special {
  id: string;
  title: string;
  business_name: string;
  image_url: string | null;
  deal_label: string;
  valid_until: string | null;
}

const HomeSpecials = () => {
  const { data: specials } = useQuery({
    queryKey: ["home-specials"],
    queryFn: async () => {
      const { data } = await supabase
        .from("specials")
        .select("id, title, business_name, image_url, deal_label, valid_until")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      return (data || []) as Special[];
    },
  });

  if (!specials || specials.length === 0) return null;

  return (
    <section>
      <HomeSectionHead primary="Specials" serif="this month" actionLabel="See all" actionHref="/specials" />
      <div className="scrollbar-hide" style={{ overflowX: "auto", paddingLeft: 24 }}>
        <div style={{ display: "flex", gap: 12, paddingRight: 24 }}>
          {specials.map((s) => (
            <Link
              key={s.id}
              to={`/specials/${s.id}`}
              onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
              onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              style={{
                width: 280,
                flexShrink: 0,
                background: "#FFFFFF",
                borderRadius: 24,
                overflow: "hidden",
                textDecoration: "none",
                transition: "transform 150ms ease-out",
                display: "block",
              }}
            >
              <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3", background: "#F2EFEC" }}>
                {s.image_url && (
                  <img
                    src={s.image_url}
                    alt={s.title}
                    loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                )}
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    left: 12,
                    background: "#FFFFFF",
                    borderRadius: 999,
                    padding: "5px 10px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: SANS,
                      fontSize: 12,
                      color: "#0A0A0A",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      lineHeight: 1,
                    }}
                  >
                    {s.deal_label}
                  </span>
                </div>
              </div>
              <div style={{ padding: "14px 24px 16px" }}>
                <div
                  style={{
                    fontFamily: "'Helvetica World', Helvetica, Arial, sans-serif",
                    fontSize: 16,
                    fontWeight: 500,
                    color: "#0A0A0A",
                    lineHeight: 1.2,
                    marginBottom: 6,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {s.title}
                </div>
                <div
                  style={{
                    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                    fontWeight: 400,
                    fontSize: 12,
                    color: "#8A8480",
                    marginBottom: 8,
                    lineHeight: 1.3,
                    wordBreak: "break-word",
                  }}
                >
                  {s.business_name}
                </div>
                {s.valid_until && (
                  <div style={{ fontFamily: SANS, fontSize: 12, color: "#8A8480" }}>
                    Valid until {format(new Date(s.valid_until), "d MMM yyyy")}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeSpecials;
