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
    try { return format(new Date(d), "d MMM yyyy"); } catch { return d; }
  };

  const ArticleCard = ({ article, large }: { article: any; large?: boolean }) => (
    <Link to={`/headlines/${article.slug}`} style={{ textDecoration: "none", display: "block", flex: large ? undefined : 1 }}>
      <div style={{ borderRadius: 20, overflow: "hidden", background: "#ffffff" }}>
        <div style={{ width: "100%", aspectRatio: "4/3", background: "#f0f0f0" }}>
          {article.image_url && (
            <img src={article.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
          )}
        </div>
        <div style={{ padding: large ? "14px 16px 16px" : "10px 12px 14px" }}>
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#827b75",
            textTransform: "uppercase",
            letterSpacing: 1.2,
            marginBottom: 6,
          }}>
            NEWS
          </div>
          <div style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: large ? 18 : 15,
            fontWeight: 600,
            color: "#2b2420",
            lineHeight: 1.25,
            marginBottom: 8,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as any,
            overflow: "hidden",
          }}>
            {article.title}
          </div>
          <div style={{ fontSize: 13, color: "#827b75", fontWeight: 400 }}>
            {fmtDate(article.published_at)} · {article.read_time || 3} min read
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <div style={{ paddingTop: 48, paddingBottom: 48, paddingLeft: 24, paddingRight: 24 }}>
      <HomeSectionHeader title="Lowveld Lowdown" />

      {/* Featured card */}
      <div style={{ marginBottom: 14 }}>
        <ArticleCard article={featured} large />
      </div>

      {/* Two smaller cards */}
      <div style={{ display: "flex", gap: 12 }}>
        {rest.map((article: any) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
        <Link to="/headlines" style={{ fontSize: 11, fontWeight: 500, color: "rgba(18,18,20,0.35)", textTransform: "uppercase", letterSpacing: 1, textDecoration: "none" }}>
          See All ›
        </Link>
      </div>
    </div>
  );
};

export default LowdownSection;
