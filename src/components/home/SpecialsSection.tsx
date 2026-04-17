import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { format } from "date-fns";

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

  const CardWrapper = ({ special, children }: { special: Special; children: React.ReactNode }) => {
    return (
      <Link to={`/specials/${special.id}`} style={{ textDecoration: "none", flexShrink: 0 }}>
        {children}
      </Link>
    );
  };

  return (
    <div style={{ width: "100%", paddingTop: 28, paddingBottom: 28 }}>
      {/* Header */}
      <div style={{ padding: "0 14px", display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 className="font-semibold" style={{ fontSize: 22, color: "#2b2420", textTransform: "capitalize", letterSpacing: 0.5, margin: 0 }}>
            Specials
          </h2>
        </div>
        <Link to="/specials" style={{ fontSize: 12, fontWeight: 600, color: "rgba(18,18,20,0.35)", textTransform: "uppercase", letterSpacing: 1.5, textDecoration: "none" }}>
          See All ›
        </Link>
      </div>

      {/* Carousel */}
      <div style={{ overflowX: "auto", paddingLeft: 4 }} className="scrollbar-hide">
        <div style={{ display: "flex", gap: 4 }}>
          {specials.map((special, idx) => (
            <CardWrapper key={special.id} special={special}>
              <div
                style={{
                  width: 260,
                  flexShrink: 0,
                  borderRadius: 16,
                  overflow: "hidden",
                  background: "rgba(255,255,255,0.08)",
                  marginRight: idx === specials.length - 1 ? 4 : 0,
                }}
              >
                {/* Image */}
                <div style={{ position: "relative", width: "100%", height: 140 }}>
                  {special.image_url ? (
                    <img src={special.image_url} alt={special.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.06)" }} />
                  )}
                  <div style={{
                    position: "absolute", top: 8, left: 8,
                    background: "#ffffff", borderRadius: 8, padding: "2px 10px",
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#2b2420", textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {special.deal_label}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: "14px 16px", background: "#ffffff", border: "1px solid rgba(18,18,20,0.06)", borderTop: "none", borderRadius: "0 0 16px 16px" }}>
                  <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 15, fontWeight: 400, color: "#2b2420", lineHeight: 1.2, marginBottom: 4, letterSpacing: "0.01em", minHeight: "2.4em", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {special.title}
                  </div>
                  <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 12, fontWeight: 400, color: "rgba(18,18,20,0.4)", marginBottom: 8, letterSpacing: "0.01em" }}>
                    {special.business_name}
                  </div>
                  <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 11, fontWeight: 400, color: "rgba(18,18,20,0.3)", letterSpacing: "0.01em" }}>
                    {special.valid_until
                      ? `Valid until ${format(new Date(special.valid_until), "d MMM yyyy")}`
                      : "Ongoing"}
                  </div>
                </div>
              </div>
            </CardWrapper>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpecialsSection;
