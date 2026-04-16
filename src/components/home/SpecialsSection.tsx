import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import HomeSectionHeader from "./HomeSectionHeader";

interface Special {
  id: string;
  title: string;
  description: string | null;
  business_name: string;
  business_id: string | null;
  image_url: string | null;
  deal_label: string;
  valid_until: string | null;
  is_active: boolean;
  sort_order: number;
}

const SpecialsSection = () => {
  const { data: specials } = useQuery({
    queryKey: ["homepage-specials"],
    queryFn: async () => {
      const { data } = await supabase
        .from("specials")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      return (data || []) as Special[];
    },
  });

  if (!specials || specials.length === 0) return null;

  return (
    <div style={{ paddingTop: 48 }}>
      <div style={{ padding: "0 24px" }}>
        <HomeSectionHeader title="Specials" actionLabel="See All" actionHref="/specials" />
      </div>

      <div style={{ overflowX: "auto", paddingLeft: 24 }} className="scrollbar-hide">
        <div style={{ display: "flex", gap: 4 }}>
          {specials.map((special, idx) => (
            <Link
              key={special.id}
              to={`/specials/${special.id}`}
              style={{
                textDecoration: "none",
                flexShrink: 0,
                width: "85vw",
                marginRight: idx === specials.length - 1 ? 24 : 0,
              }}
            >
              <div style={{
                borderRadius: 16,
                overflow: "hidden",
                background: "#FFFFFF",
                border: "1px solid rgba(18,18,20,0.06)",
              }}>
                {special.image_url && (
                  <div style={{ position: "relative", width: "100%", aspectRatio: "16/10" }}>
                    <img src={special.image_url} alt={special.title} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} loading="lazy" />
                    <div style={{
                      position: "absolute", top: 10, left: 10,
                      background: "#020202", color: "#FFFFFF", borderRadius: 20, padding: "6px 14px",
                    }}>
                      <span style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 13, fontWeight: 500 }}>
                        {special.deal_label}
                      </span>
                    </div>
                  </div>
                )}
                <div style={{ padding: 12 }}>
                  <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 16, fontWeight: 400, color: "#2B2420", lineHeight: 1.2, marginBottom: 4 }}>
                    {special.title}
                  </div>
                  {special.business_name && (
                    <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 14, fontWeight: 400, color: "rgba(18,18,20,0.55)", marginBottom: 2 }}>
                      {special.business_name}
                    </div>
                  )}
                  {special.valid_until && (
                    <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 14, fontWeight: 400, color: "rgba(18,18,20,0.55)" }}>
                      Valid until {format(new Date(special.valid_until), "d MMM yyyy")}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpecialsSection;
