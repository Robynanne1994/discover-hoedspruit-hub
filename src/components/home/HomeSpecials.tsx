import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import HomeSectionHead from "./HomeSectionHead";

const HN = "'Helvetica Neue', Helvetica, Arial, sans-serif";

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
      <HomeSectionHead primary="Active Specials" actionHref="/specials" />
      <div className="scrollbar-hide" style={{ overflowX: "auto", paddingLeft: 20 }}>
        <div style={{ display: "flex", gap: 4, paddingRight: 20 }}>
          {specials.map((s) => (
            <Link
              key={s.id}
              to={`/specials/${s.id}`}
              onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
              onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              style={{
                width: 290,
                flexShrink: 0,
                background: "#ffffff",
                borderRadius: 16,
                padding: 10,
                display: "flex",
                alignItems: "center",
                gap: 12,
                textDecoration: "none",
                transition: "transform 150ms ease-out",
              }}
            >
              <div style={{ position: "relative", width: 80, height: 80, borderRadius: 12, overflow: "hidden", background: "#F4EFE3", flexShrink: 0 }}>
                {s.image_url && (
                  <img src={s.image_url} alt={s.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
                <div
                  style={{
                    position: "absolute",
                    bottom: 6,
                    left: 6,
                    background: "#020202",
                    color: "#ffffff",
                    fontFamily: HN,
                    fontSize: 9,
                    letterSpacing: "0.04em",
                    padding: "3px 6px",
                    borderRadius: 6,
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.deal_label}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: HN,
                    fontSize: 15,
                    color: "#020202",
                    lineHeight: 1.25,
                    marginBottom: 6,
                    wordBreak: "break-word",
                  }}
                >
                  {s.title}
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 4, fontFamily: HN, fontSize: 12, color: "#6B6A5E" }}>
                  <MapPin size={12} strokeWidth={1.6} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}>{s.business_name}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeSpecials;
