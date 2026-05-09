import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import HomeSectionHead from "./HomeSectionHead";

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
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("specials")
        .select("id, title, business_name, image_url, deal_label, valid_until")
        .eq("is_active", true)
        .or(`valid_until.is.null,valid_until.gte.${today}`)
        .order("sort_order", { ascending: true });
      return (data || []) as Special[];
    },
  });

  if (!specials || specials.length === 0) return null;

  return (
    <section>
      <HomeSectionHead primary="Specials" serif="this month" actionLabel="See all" actionHref="/specials" />
      <div className="scrollbar-hide" style={{ overflowX: "auto", paddingLeft: 24 }}>
        <div style={{ display: "flex", gap: 14, paddingRight: 40 }}>
          {specials.map((s) => (
            <Link
              key={s.id}
              to={`/specials/${s.id}`}
              onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
              onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              style={{
                width: 268,
                flexShrink: 0,
                background: "#EEE8DA",
                borderRadius: 24,
                overflow: "hidden",
                textDecoration: "none",
                transition: "transform 150ms ease-out",
                display: "block",
              }}
            >
              <div style={{ position: "relative", width: "100%", height: 180, background: "#F4EFE3" }}>
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
                    background: "#EEE8DA",
                    borderRadius: 999,
                    padding: "7px 14px",
                    maxWidth: "calc(100% - 24px)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                      fontSize: 12,
                      lineHeight: 1.2,
                      color: "#2A2A24",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "block",
                    }}
                  >
                    {s.deal_label}
                  </span>
                </div>
              </div>
              <div style={{ padding: "18px 20px 20px" }}>
                <div
                  style={{
                    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                    fontSize: 17,
                    lineHeight: 1.25,
                    letterSpacing: "-0.2px",
                    color: "#2A2A24",
                    marginBottom: 6,
                  }}
                >
                  {s.title}
                </div>
                <div
                  style={{
                    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                    fontSize: 13,
                    color: "#6B6A5E",
                    marginBottom: 4,
                    wordBreak: "break-word",
                  }}
                >
                  {s.business_name}
                </div>
                {s.valid_until && (
                  <div
                    style={{
                      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                      fontSize: 12,
                      color: "rgba(107, 106, 94, 0.85)",
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
