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
      <div className="scrollbar-hide" style={{ overflowX: "auto", paddingLeft: 24, scrollSnapType: "x mandatory" }}>
        <div style={{ display: "flex", gap: 12, paddingRight: 24 }}>
          {specials.map((s) => (
            <Link
              key={s.id}
              to={`/specials/${s.id}`}
              onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
              onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              style={{
                width: "72vw",
                maxWidth: 265,
                minWidth: 260,
                flexShrink: 0,
                background: "#FFFFFF",
                borderRadius: 24,
                overflow: "hidden",
                textDecoration: "none",
                transition: "transform 150ms ease-out",
                display: "block",
                scrollSnapAlign: "start",
              }}
            >
              <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 10", background: "#F2EFEC" }}>
                {s.image_url && (
                  <img
                    src={s.image_url}
                    alt={s.title}
                    loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                )}
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    left: 12,
                    background: "#FFFFFF",
                    borderRadius: 999,
                    padding: "8px 14px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                      fontWeight: 400,
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
              <div style={{ padding: 16 }}>
                <div
                  style={{
                    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                    fontWeight: 400,
                    fontSize: 18,
                    lineHeight: "21.6px",
                    letterSpacing: "-0.18px",
                    color: "#0A0A0A",
                    marginBottom: 6,
                  }}
                >
                  {s.title}
                </div>
                <div
                  style={{
                    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                    fontWeight: 400,
                    fontSize: 12,
                    lineHeight: "15.6px",
                    letterSpacing: "0.12px",
                    color: "#8A8480",
                    marginBottom: 6,
                    wordBreak: "break-word",
                  }}
                >
                  {s.business_name}
                </div>
                {s.valid_until && (
                  <div
                    style={{
                      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                      fontWeight: 400,
                      fontSize: 12,
                      lineHeight: "15.6px",
                      letterSpacing: "0.12px",
                      color: "#8A8480",
                    }}
                  >
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
