import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import HomeSectionHeader from "./HomeSectionHeader";

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

  const cardGradient = "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.05) 100%)";

  return (
    <div style={{ paddingTop: 48, padding: "48px 24px 0" }}>
      <HomeSectionHeader title="Lowveld Lowdown" />

      {/* Featured card */}
      <Link to={`/headlines/${featured.slug}`} style={{ textDecoration: "none", display: "block", marginBottom: 4 }}>
        <div style={{ borderRadius: 16, overflow: "hidden", position: "relative", width: "100%", height: 220, background: "#EBEBEB" }}>
          {featured.image_url && <img src={featured.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          <div style={{ position: "absolute", inset: 0, background: cardGradient }} />
          <div style={{ position: "absolute", bottom: 14, left: 14, right: 14 }}>
            <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 12, fontWeight: 500, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{featured.category}</div>
            <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 20, fontWeight: 400, color: "#FFFFFF", lineHeight: 1.2, marginBottom: 6 }}>{featured.title}</div>
            <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 14, color: "rgba(255,255,255,0.7)" }}>{fmtDate(featured.published_at)} · {featured.read_time || 3} min read</div>
          </div>
        </div>
      </Link>

      {/* Two smaller cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
        {rest.map((article: any) => (
          <Link key={article.id} to={`/headlines/${article.slug}`} style={{ textDecoration: "none", display: "block" }}>
            <div style={{ borderRadius: 16, overflow: "hidden", position: "relative", width: "100%", aspectRatio: "4/3", background: "#EBEBEB" }}>
              {article.image_url && <img src={article.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
              <div style={{ position: "absolute", inset: 0, background: cardGradient }} />
              <div style={{ position: "absolute", bottom: 10, left: 10, right: 10 }}>
                <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 12, fontWeight: 500, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{article.category}</div>
                <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 14, fontWeight: 400, color: "#FFFFFF", lineHeight: 1.2, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>{article.title}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
        <Link to="/headlines" style={{
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontSize: 15,
          fontWeight: 400,
          color: "rgba(18,18,20,0.55)",
          textDecoration: "none",
        }}>
          Read All ›
        </Link>
      </div>
    </div>
  );
};

export default LowdownSection;
