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
    if (special.business_id) {
      return (
        <Link to={`/listing/${special.business_id}`} style={{ textDecoration: "none", flexShrink: 0 }}>
          {children}
        </Link>
      );
    }
    return <div style={{ flexShrink: 0 }}>{children}</div>;
  };

  return (
    <div style={{ background: "#121214", width: "100%", paddingTop: 28, paddingBottom: 28 }}>
      {/* Header */}
      <div style={{ padding: "0 24px", display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 3, marginBottom: 6 }}>
            Don't Miss Out
          </div>
          <h2 style={{ fontWeight: 900, fontSize: 22, color: "#ffffff", textTransform: "uppercase", letterSpacing: 0.5, margin: 0 }}>
            Specials
          </h2>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1.5, cursor: "pointer" }}>
          See All ›
        </span>
      </div>

      {/* Carousel */}
      <div style={{ overflowX: "auto", paddingLeft: 24 }} className="scrollbar-hide">
        <div style={{ display: "flex", gap: 12 }}>
          {specials.map((special, idx) => (
            <CardWrapper key={special.id} special={special}>
              <div
                style={{
                  width: 260,
                  flexShrink: 0,
                  borderRadius: 16,
                  overflow: "hidden",
                  background: "rgba(255,255,255,0.08)",
                  marginRight: idx === specials.length - 1 ? 24 : 0,
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
                    position: "absolute", top: 10, left: 10,
                    background: "#ffffff", borderRadius: 8, padding: "4px 10px",
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#121214", textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {special.deal_label}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: "14px 16px", background: "#ffffff" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#121214", lineHeight: 1.2, marginBottom: 4 }}>
                    {special.title}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(18,18,20,0.4)", marginBottom: 8 }}>
                    {special.business_name}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(18,18,20,0.3)" }}>
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
