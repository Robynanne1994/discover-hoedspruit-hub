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

  return (
    <div style={{ paddingTop: 36 }}>
      {/* Header */}
      <div style={{ paddingLeft: 14, paddingRight: 14 }}>
        <HomeSectionHeader title="Lowveld Lowdown" />
      </div>

      {/* Featured card */}
      <div style={{ paddingLeft: 4, paddingRight: 4 }}>
        <Link to={`/headlines/${featured.slug}`} style={{ textDecoration: "none", display: "block", marginBottom: 4 }}>
          <div style={{ borderRadius: 16, overflow: "hidden", position: "relative" }}>
            <div style={{ width: "100%", height: 160, background: "#f0f0f0", position: "relative" }}>
              {featured.image_url && <img src={featured.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)" }} />
              <div style={{ position: "absolute", top: 12, left: 12, background: "#ffffff", borderRadius: 8, padding: "4px 10px" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#2b2420", textTransform: "uppercase", letterSpacing: "0.5px" }}>{featured.category}</span>
              </div>
              <div style={{ position: "absolute", bottom: 14, left: 14, right: 14 }}>
                <div style={{ fontSize: 16, fontWeight: 400, color: "#ffffff", lineHeight: 1.15, marginBottom: 4 }}>{featured.title}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{fmtDate(featured.published_at)} · {featured.read_time || 3} min read</div>
              </div>
            </div>
          </div>
        </Link>

        {/* Two smaller cards */}
        <div style={{ display: "flex", gap: 4 }}>
          {rest.map((article: any) => (
            <Link key={article.id} to={`/headlines/${article.slug}`} style={{ flex: 1, textDecoration: "none", display: "flex" }}>
              <div style={{ borderRadius: 16, overflow: "hidden", background: "rgba(18,18,20,0.03)", border: "1px solid rgba(18,18,20,0.06)", display: "flex", flexDirection: "column", width: "100%" }}>
                <div style={{ width: "100%", height: 100, background: "#f0f0f0", flexShrink: 0 }}>
                  {article.image_url && <img src={article.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                </div>
                <div style={{ padding: "10px 12px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(18,18,20,0.3)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{article.category}</div>
                  <div style={{ fontFamily: "var(--font-heading)", fontSize: 13, fontWeight: 700, color: "#2b2420", lineHeight: 1.2, marginTop: 3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden", minHeight: "2.4em" }}>{article.title}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14, paddingRight: 14 }}>
        <Link to="/headlines" style={{ fontSize: 12, fontWeight: 600, color: "rgba(18,18,20,0.35)", textTransform: "uppercase", letterSpacing: "1.5px", textDecoration: "none" }}>
          READ ALL &gt;
        </Link>
      </div>
    </div>
  );
};

export default LowdownSection;
