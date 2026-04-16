import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Share2, Newspaper } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const renderMarkdown = (text: string) => {
  const lines = text.split("\n");
  const elements: JSX.Element[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("## ")) {
      elements.push(<h2 key={i} style={{ fontSize: 18, fontWeight: 400, color: "#2b2420", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 28, marginBottom: 12 }}>{line.slice(3)}</h2>);
    } else if (line.startsWith("# ")) {
      elements.push(<h2 key={i} style={{ fontSize: 18, fontWeight: 400, color: "#2b2420", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 28, marginBottom: 12 }}>{line.slice(2)}</h2>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} style={{ paddingLeft: 20, marginBottom: 16 }}>
          {items.map((item, j) => (
            <li key={j} style={{ fontSize: 15, color: "rgba(18,18,20,0.55)", lineHeight: 1.8, marginBottom: 10 }} dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
          ))}
        </ul>
      );
      continue;
    } else if (line.trim() === "") {
      // skip blank
    } else {
      elements.push(<p key={i} style={{ fontSize: 15, color: "rgba(18,18,20,0.55)", lineHeight: 1.8, marginBottom: 16 }} dangerouslySetInnerHTML={{ __html: inlineFormat(line) }} />);
    }
    i++;
  }
  return elements;
};

const inlineFormat = (text: string) => {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:700;color:#2b2420">$1</strong>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#2b2420;font-weight:600;text-decoration:underline" target="_blank" rel="noopener">$1</a>');
};

const ArticleDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: article, isLoading } = useQuery({
    queryKey: ["article", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("articles" as any)
        .select("*")
        .eq("slug", slug!)
        .eq("is_published", true)
        .single();
      return data as any;
    },
    enabled: !!slug,
  });

  const { data: related = [] } = useQuery({
    queryKey: ["related-articles", slug, article?.category],
    queryFn: async () => {
      const { data } = await supabase
        .from("articles" as any)
        .select("*")
        .eq("is_published", true)
        .neq("slug", slug!)
        .order("published_at", { ascending: false })
        .limit(10);
      const all = (data || []) as any[];
      const sameCategory = all.filter((a) => a.category === article?.category);
      const others = all.filter((a) => a.category !== article?.category);
      return [...sameCategory, ...others].slice(0, 3);
    },
    enabled: !!article,
  });

  const formatDate = (d: string) => {
    try { return format(new Date(d), "d MMMM yyyy"); } catch { return d; }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: article?.title, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "#ebebeb" }}><p style={{ color: "rgba(18,18,20,0.35)" }}>Loading...</p></div>;
  }

  if (!article) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "#ebebeb" }}><p style={{ color: "rgba(18,18,20,0.35)" }}>Article not found.</p></div>;
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: "#ebebeb" }}>
      {/* Hero image */}
      <div style={{ position: "relative", width: "100%", height: 280, background: "#f0f0f0" }}>
        {article.image_url && <img src={article.image_url} alt={article.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
        <button onClick={() => navigate("/headlines")} style={{ position: "absolute", top: 48, left: 20, width: 38, height: 38, borderRadius: "50%", background: "#ffffff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ArrowLeft style={{ width: 18, height: 18, strokeWidth: 2, color: "#2b2420" }} />
        </button>
        <button onClick={handleShare} style={{ position: "absolute", top: 48, right: 20, width: 38, height: 38, borderRadius: "50%", background: "#ffffff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Share2 style={{ width: 18, height: 18, strokeWidth: 1.5, color: "#2b2420" }} />
        </button>
      </div>

      <div style={{ padding: "0 24px" }}>
        {/* Category badge */}
        <div style={{ marginTop: 20, marginBottom: 14 }}>
          <span style={{ display: "inline-block", background: "rgba(18,18,20,0.05)", borderRadius: 9999, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: "rgba(18,18,20,0.55)", textTransform: "uppercase" }}>{article.category}</span>
        </div>

        {/* Title */}
        <h1 style={{ fontWeight: 400, fontSize: 28, color: "#2b2420", lineHeight: 1.1, letterSpacing: "-0.3px", marginBottom: 14 }}>{article.title}</h1>

        {/* Meta */}
        <div className="flex items-center flex-wrap" style={{ gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(18,18,20,0.4)" }}>{article.author || "Hello Hoedspruit"}</span>
          <span style={{ color: "rgba(18,18,20,0.2)" }}>·</span>
          <span style={{ fontSize: 13, color: "rgba(18,18,20,0.35)" }}>{formatDate(article.published_at)}</span>
          <span style={{ color: "rgba(18,18,20,0.2)" }}>·</span>
          <span style={{ fontSize: 13, color: "rgba(18,18,20,0.35)" }}>{article.read_time || 3} min read</span>
        </div>

        <div style={{ marginTop: 24, borderTop: "1px solid rgba(18,18,20,0.06)", marginBottom: 24 }} />

        {/* Body */}
        <div>{renderMarkdown(article.body || "")}</div>

        {/* Related */}
        {related.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(18,18,20,0.3)", textTransform: "uppercase", letterSpacing: 3, marginBottom: 18 }}>More from the Lowdown</div>
            {related.map((r: any, i: number) => (
              <Link key={r.id} to={`/headlines/${r.slug}`}>
                <div className="flex" style={{ gap: 14, paddingTop: 16, paddingBottom: 16, borderBottom: i < related.length - 1 ? "1px solid rgba(18,18,20,0.06)" : "none" }}>
                  <div style={{ width: 90, height: 90, borderRadius: 16, overflow: "hidden", background: "#f0f0f0", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {r.image_url ? <img src={r.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Newspaper style={{ width: 28, height: 28, color: "rgba(18,18,20,0.15)" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(18,18,20,0.3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{r.category}</div>
                    <div style={{ fontSize: 15, fontFamily: "var(--font-heading)", fontWeight: 700, color: "#2b2420", lineHeight: 1.2, marginBottom: 6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>{r.title}</div>
                    <div style={{ fontSize: 12, color: "rgba(18,18,20,0.35)" }}>{formatDate(r.published_at)} · {r.read_time || 3} min read</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticleDetail;
