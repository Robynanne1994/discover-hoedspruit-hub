import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { format } from "date-fns";

const LowdownSection = () => {
  const { data: articles = [] } = useQuery({
    queryKey: ["home-lowdown"],
    queryFn: async () => {
      const { data } = await supabase
        .from("articles")
        .select("*")
        .eq("is_published", true)
        .order("is_featured", { ascending: false })
        .order("published_at", { ascending: false })
        .limit(10);
      return (data || []) as any[];
    },
  });

  if (articles.length < 3) return null;

  const featured = articles.find((a: any) => a.is_featured) || articles[0];
  const rest = articles.filter((a: any) => a.id !== featured.id).slice(0, 2);

  const fmtDate = (d: string) => {
    try { return format(new Date(d), "d MMM"); } catch { return d; }
  };

  return (
    <div style={{ paddingTop: 36, paddingLeft: 24, paddingRight: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ fontWeight: 900, fontSize: 22, color: "#121214", textTransform: "uppercase", letterSpacing: "0.5px" }}>The Lowveld Lowdown</div>
        <Link to="/headlines" style={{ fontSize: 12, fontWeight: 600, color: "rgba(18,18,20,0.35)", textTransform: "uppercase", letterSpacing: "1.5px", textDecoration: "none", whiteSpace: "nowrap" }}>
          See all ›
        </Link>
      </div>

      {/* Featured card */}
      <Link to={`/headlines/${featured.slug}`} style={{ textDecoration: "none", display: "block", marginBottom: 14 }}>
        <div style={{ borderRadius: 16, overflow: "hidden", position: "relative" }}>
          <div style={{ width: "100%", height: 160, background: "#f0f0f0", position: "relative" }}>
            {featured.image_url && <img src={featured.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)" }} />
            <div style={{ position: "absolute", top: 12, left: 12, background: "#ffffff", borderRadius: 8, padding: "4px 10px" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#121214", textTransform: "uppercase", letterSpacing: "0.5px" }}>{featured.category}</span>
            </div>
            <div style={{ position: "absolute", bottom: 14, left: 14, right: 14 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#ffffff", lineHeight: 1.15, marginBottom: 4 }}>{featured.title}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{fmtDate(featured.published_at)} · {featured.read_time || 3} min read</div>
            </div>
          </div>
        </div>
      </Link>

      {/* Two smaller cards */}
      <div style={{ display: "flex", gap: 12 }}>
        {rest.map((article: any) => (
          <Link key={article.id} to={`/headlines/${article.slug}`} style={{ flex: 1, textDecoration: "none", display: "block" }}>
            <div style={{ borderRadius: 16, overflow: "hidden", background: "rgba(18,18,20,0.03)", border: "1px solid rgba(18,18,20,0.06)", height: 200 }}>
              <div style={{ width: "100%", height: 100, background: "#f0f0f0" }}>
                {article.image_url && <img src={article.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
              </div>
              <div style={{ padding: "10px 12px", overflow: "hidden" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(18,18,20,0.3)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{article.category}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#121214", lineHeight: 1.2, marginTop: 3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>{article.title}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default LowdownSection;
