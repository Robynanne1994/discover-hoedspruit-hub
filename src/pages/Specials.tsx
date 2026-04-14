import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";

const Specials = () => {
  const { data: specials, isLoading } = useQuery({
    queryKey: ["all-specials"],
    queryFn: async () => {
      const { data } = await supabase
        .from("specials")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      return data || [];
    },
  });

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ paddingTop: 16, paddingLeft: 20, paddingRight: 20, marginBottom: 20 }}>
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#121214", textDecoration: "none", fontSize: 15, fontWeight: 500, marginBottom: 16 }}>
          <ArrowLeft size={20} />
          Back
        </Link>
        <h1 style={{ fontWeight: 900, fontSize: 28, color: "#121214", textTransform: "uppercase", letterSpacing: 0.5, margin: 0 }}>
          Specials
        </h1>
        <p style={{ fontSize: 13, color: "rgba(18,18,20,0.5)", marginTop: 4 }}>
          The hottest deals in Hoedspruit
        </p>
      </div>

      {/* Grid */}
      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 16 }}>
        {isLoading && (
          <div style={{ textAlign: "center", padding: 40, color: "rgba(18,18,20,0.4)" }}>Loading...</div>
        )}
        {specials?.map((special) => {
          const content = (
            <div style={{ borderRadius: 16, overflow: "hidden", background: "#f5f5f5" }}>
              {/* Image */}
              <div style={{ position: "relative", width: "100%", height: 180 }}>
                {special.image_url ? (
                  <img src={special.image_url} alt={special.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "rgba(18,18,20,0.06)" }} />
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
                <div style={{ fontSize: 16, fontWeight: 700, color: "#121214", lineHeight: 1.3, marginBottom: 4 }}>
                  {special.title}
                </div>
                <div style={{ fontSize: 13, color: "rgba(18,18,20,0.5)", marginBottom: 6 }}>
                  {special.business_name}
                </div>
                {special.description && (
                  <div style={{ fontSize: 13, color: "rgba(18,18,20,0.6)", marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {special.description}
                  </div>
                )}
                <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(18,18,20,0.3)" }}>
                  {special.valid_until
                    ? `Valid until ${format(new Date(special.valid_until), "d MMM yyyy")}`
                    : "Ongoing"}
                </div>
              </div>
            </div>
          );

          return (
            <Link key={special.id} to={`/specials/${special.id}`} style={{ textDecoration: "none" }}>
              {content}
            </Link>
          );
        })}
        {!isLoading && specials?.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "rgba(18,18,20,0.4)" }}>
            No specials available right now
          </div>
        )}
      </div>
    </div>
  );
};

export default Specials;
