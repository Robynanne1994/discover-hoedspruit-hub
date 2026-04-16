import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Search, Newspaper } from "lucide-react";
import { format } from "date-fns";

const categories = ["All", "News", "Community", "Wildlife", "Food", "Travel", "Property", "Events", "Lifestyle"];

const Headlines = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const { data: articles = [] } = useQuery({
    queryKey: ["articles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("articles" as any)
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      return (data || []) as any[];
    },
  });

  const featured = articles.find((a: any) => a.is_featured);

  const filtered = useMemo(() => {
    let list = articles.filter((a: any) => !a.is_featured);
    if (activeCategory !== "All") {
      list = list.filter((a: any) => a.category?.toLowerCase() === activeCategory.toLowerCase());
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a: any) =>
        a.title?.toLowerCase().includes(q) || a.excerpt?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [articles, activeCategory, search]);

  const showFeatured = featured && (activeCategory === "All" || featured.category?.toLowerCase() === activeCategory.toLowerCase());

  const formatDate = (d: string) => {
    try { return format(new Date(d), "d MMMM yyyy"); } catch { return d; }
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: "#ebebeb" }}>
      {/* Back */}
      <div style={{ paddingTop: 52, paddingLeft: 24, marginBottom: 28 }}>
        <button onClick={() => navigate(-1)} className="flex items-center" style={{ gap: 6, background: "none", border: "none", cursor: "pointer" }}>
          <ArrowLeft style={{ width: 18, height: 18, strokeWidth: 2, color: "rgba(18,18,20,0.4)" }} />
          <span style={{ fontSize: 15, fontWeight: 500, color: "rgba(18,18,20,0.4)" }}>Back</span>
        </button>
      </div>

      {/* Title */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 12 }}>
        <h1 style={{ fontWeight: 400, fontSize: 40, lineHeight: 0.95, letterSpacing: "0.01em", color: "#020202", textTransform: "uppercase", fontFamily: "var(--font-heading)" }}>
          THE LOWVELD<br />LOWDOWN
        </h1>
      </div>

      {/* Subtitle */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 24 }}>
        <p style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontStyle: "italic", fontSize: 14, color: "rgba(18,18,20,0.4)", letterSpacing: "0.2px", lineHeight: 1.4 }}>
          News, stories and local updates from the Lowveld
        </p>
      </div>

      {/* Search */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 20 }}>
        <div className="flex items-center" style={{ background: "#ebebeb", border: "2px solid #121214", borderRadius: 9999, padding: "11px 14px", gap: 8 }}>
          <Search style={{ width: 16, height: 16, strokeWidth: 2, color: "#2b2420", flexShrink: 0 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles..."
            style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, color: "#2b2420", width: "100%", whiteSpace: "nowrap" }}
          />
        </div>
      </div>

      {/* Filter pills */}
      <div style={{ paddingLeft: 24, marginBottom: 28, overflowX: "auto", WebkitOverflowScrolling: "touch" }} className="flex gap-2 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              background: activeCategory === cat ? "#121214" : "rgba(18,18,20,0.05)",
              borderRadius: 9999,
              padding: "7px 16px",
              fontSize: 12,
              fontWeight: 600,
              color: activeCategory === cat ? "#ffffff" : "rgba(18,18,20,0.55)",
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Featured */}
      {showFeatured && (
        <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(18,18,20,0.3)", textTransform: "uppercase", letterSpacing: 3, marginBottom: 6 }}>Latest</div>
          <div style={{ fontWeight: 400, fontSize: 22, color: "#020202", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 18 }}>Featured</div>

          <Link to={`/headlines/${featured.slug}`}>
            <div style={{ borderRadius: 16, overflow: "hidden", position: "relative" }}>
              <div style={{ width: "100%", height: 200, background: "#f0f0f0", position: "relative" }}>
                {featured.image_url ? (
                  <img src={featured.image_url} alt={featured.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : null}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)" }} />
                <div style={{ position: "absolute", top: 14, left: 14, background: "#ffffff", borderRadius: 8, padding: "4px 10px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#020202", textTransform: "uppercase", letterSpacing: "0.5px" }}>{featured.category}</span>
                </div>
                <div style={{ position: "absolute", bottom: 16, left: 16, right: 16 }}>
                  <div style={{ fontWeight: 400, fontSize: 20, color: "#ffffff", lineHeight: 1.1, marginBottom: 6 }}>{featured.title}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                    {formatDate(featured.published_at)} · {featured.read_time || 3} min read
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Recent */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(18,18,20,0.3)", textTransform: "uppercase", letterSpacing: 3, marginBottom: 6 }}>More Stories</div>
        <div style={{ fontWeight: 400, fontSize: 22, color: "#020202", textTransform: "uppercase", letterSpacing: "0.5px" }}>Recent</div>
      </div>

      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 100 }}>
        {filtered.length === 0 && (
          <p style={{ fontSize: 14, color: "rgba(18,18,20,0.35)", textAlign: "center", paddingTop: 40 }}>No articles found.</p>
        )}
        {filtered.map((article: any, i: number) => (
          <Link key={article.id} to={`/headlines/${article.slug}`}>
            <div className="flex" style={{ gap: 14, paddingTop: 16, paddingBottom: 16, borderBottom: i < filtered.length - 1 ? "1px solid rgba(18,18,20,0.06)" : "none" }}>
              <div style={{ width: 90, height: 90, borderRadius: 16, overflow: "hidden", background: "#f0f0f0", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {article.image_url ? (
                  <img src={article.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <Newspaper style={{ width: 28, height: 28, color: "rgba(18,18,20,0.15)" }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(18,18,20,0.3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{article.category}</div>
                <div style={{
                  fontSize: 15, fontWeight: 700, color: "#2b2420", lineHeight: 1.2, marginBottom: 6,
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden"
                }}>{article.title}</div>
                <div style={{ fontSize: 12, color: "rgba(18,18,20,0.35)" }}>
                  {formatDate(article.published_at)} · {article.read_time || 3} min read
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Headlines;
