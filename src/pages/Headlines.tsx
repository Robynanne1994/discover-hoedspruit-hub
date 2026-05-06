import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, Search, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";

const SANS = "'Pragmatica', 'Inter', 'Helvetica Neue', Helvetica, sans-serif";
const DISPLAY = "'Helvetica Neue', Helvetica, 'Pragmatica', 'Inter', sans-serif";
const SERIF = "'Playfair Display', 'Helvetica Neue', serif";

const PAGE_BG = "#EBEBEB";
const CARD = "#FFFFFF";
const SOFT = "#F2EFEC";
const INK = "#0A0A0A";
const MUTED = "#8A8480";

const FEATURED_GRADIENT =
  "radial-gradient(120% 90% at 30% 25%, #E27B4A 0%, #A04A2B 55%, #3A1A10 100%)";
const FEATURED_OVERLAY =
  "linear-gradient(to bottom, rgba(0,0,0,0) 35%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.7) 100%)";

const categories = ["All", "News", "Community", "Wildlife", "Food"];

const pressDown = (scale = 0.98) => (e: React.PointerEvent<HTMLElement>) => {
  e.currentTarget.style.transform = `scale(${scale})`;
};
const pressUp = (e: React.PointerEvent<HTMLElement>) => {
  e.currentTarget.style.transform = "scale(1)";
};

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

  const matches = (a: any) => {
    if (activeCategory !== "All" && a.category?.toLowerCase() !== activeCategory.toLowerCase()) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!a.title?.toLowerCase().includes(q) && !a.excerpt?.toLowerCase().includes(q)) return false;
    }
    return true;
  };

  const featured = useMemo(() => {
    const f = articles.find((a: any) => a.is_featured && matches(a));
    return f || articles.find((a: any) => matches(a));
  }, [articles, activeCategory, search]);

  const grid = useMemo(
    () => articles.filter((a: any) => matches(a) && a.id !== featured?.id),
    [articles, activeCategory, search, featured]
  );

  const fmtDate = (d: string) => {
    try { return format(new Date(d), "d MMM yyyy"); } catch { return d; }
  };
  const monthLabel = format(new Date(), "MMMM yyyy");

  return (
    <div style={{ minHeight: "100vh", background: "transparent", paddingBottom: 120 }}>
      <style>{`
        .lld-no-scrollbar::-webkit-scrollbar { display: none; }
        .lld-no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .lld-press { transition: transform 150ms ease-out; }
        .lld-input::placeholder { color: ${MUTED}; }
      `}</style>

      {/* Header */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginTop: 52 }}>
        
        <h1 style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 52, lineHeight: 0.98, letterSpacing: "-0.03em", color: INK, margin: 0 }}>
          The Lowveld<br />Lowdown
        </h1>
        <p style={{ fontFamily: SANS, fontSize: 15, lineHeight: 1.45, color: "#0a0a0a", marginTop: 14, marginBottom: 0, maxWidth: 280 }}>
          News, stories and local updates from the Lowveld.
        </p>
      </div>

      {/* Search */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginTop: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: SOFT, borderRadius: 999, padding: "14px 20px" }}>
          <Search size={18} strokeWidth={2} color={MUTED} style={{ flexShrink: 0 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles"
            className="lld-input"
            style={{ border: "none", outline: "none", background: "transparent", fontFamily: SANS, fontSize: 15, color: INK, width: "100%" }}
          />
        </div>
      </div>

      {/* Category chips */}
      <div
        className="lld-no-scrollbar"
        style={{ marginTop: 18, paddingLeft: 24, paddingRight: 0, marginRight: -24, display: "flex", gap: 8, overflowX: "auto" }}
      >
        {categories.map((cat) => {
          const active = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              onPointerDown={pressDown(0.98)}
              onPointerUp={pressUp}
              onPointerLeave={pressUp}
              className="lld-press"
              style={{
                background: active ? "#5B4632" : CARD,
                color: active ? "#FFFFFF" : INK,
                fontFamily: SANS,
                fontSize: 14,
                lineHeight: 1,
                padding: "10px 18px",
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {cat}
            </button>
          );
        })}
        <div style={{ width: 24, flexShrink: 0 }} />
      </div>

      {/* Featured */}
      {featured && (
        <div style={{ paddingLeft: 24, paddingRight: 24, marginTop: 28 }}>
          <Link
            to={`/headlines/${featured.slug}`}
            onPointerDown={pressDown(0.99)}
            onPointerUp={pressUp}
            onPointerLeave={pressUp}
            className="lld-press"
            style={{
              display: "block",
              position: "relative",
              width: "100%",
              aspectRatio: "4 / 5",
              borderRadius: 24,
              overflow: "hidden",
              background: featured.image_url ? `url(${featured.image_url}) center/cover no-repeat` : FEATURED_GRADIENT,
              textDecoration: "none",
            }}
          >
            <div style={{ position: "absolute", inset: 0, background: FEATURED_OVERLAY }} />

            {/* Tag */}
            {featured.category && (
              <div style={{
                position: "absolute", top: 20, left: 20,
                fontFamily: SANS, fontSize: 12, letterSpacing: "0.04em",
                color: "rgba(255,255,255,0.9)", lineHeight: 1.2,
              }}>
                {featured.category}
              </div>
            )}

            {/* Arrow button */}
            <div style={{
              position: "absolute", top: 16, right: 16,
              width: 36, height: 36, borderRadius: 999,
              background: "rgba(255,255,255,0.95)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ArrowUpRight size={14} strokeWidth={2.2} color={INK} />
            </div>

            {/* Bottom text */}
            <div style={{ position: "absolute", left: 22, right: 22, bottom: 22 }}>
              <div style={{
                fontFamily: SANS, fontSize: 12, letterSpacing: "0.02em",
                color: "rgba(255,255,255,0.78)", lineHeight: 1.2, marginBottom: 8,
              }}>
                {fmtDate(featured.published_at)} · {featured.read_time || 2} min read
              </div>
              <h2 style={{
                fontFamily: DISPLAY, fontWeight: 700, fontSize: 32,
                lineHeight: 1.0, letterSpacing: "-0.03em", color: "#FFFFFF", margin: 0,
              }}>
                {featured.title}
              </h2>
            </div>
          </Link>
        </div>
      )}

      {/* More stories */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginTop: 44 }}>
        
        <h2 style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 40, lineHeight: 1.0, letterSpacing: "-0.03em", color: INK, margin: 0, marginBottom: 20 }}>
          Recent
        </h2>

        {grid.length === 0 ? (
          <p style={{ fontFamily: SANS, fontSize: 14, color: MUTED, textAlign: "center", paddingTop: 24 }}>No articles found.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {grid.map((article: any) => (
              <Link
                key={article.id}
                to={`/headlines/${article.slug}`}
                onPointerDown={pressDown(0.98)}
                onPointerUp={pressUp}
                onPointerLeave={pressUp}
                className="lld-press"
                style={{
                  position: "relative",
                  display: "block",
                  background: CARD,
                  borderRadius: 24,
                  padding: "16px 24px 18px",
                  minHeight: 190,
                  textDecoration: "none",
                }}
              >
                <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 550, letterSpacing: "0.04em", color: "#5B4632", lineHeight: 1.2, textTransform: "uppercase" }}>
                  {article.category || "Story"}
                </div>

                <div style={{
                  position: "absolute", top: 14, right: 14,
                  width: 26, height: 26, borderRadius: 999,
                  background: SOFT,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <ArrowUpRight size={12} strokeWidth={2.2} color={INK} />
                </div>

                <div style={{
                  marginTop: 24,
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 14, fontWeight: 400, lineHeight: 1.35, letterSpacing: "0.01em",
                  color: INK,
                  display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical" as any, overflow: "hidden",
                }}>
                  {article.title}
                </div>

                <div style={{
                  position: "absolute", left: 16, right: 16, bottom: 16,
                  fontFamily: SANS, fontSize: 12, letterSpacing: "0.01em", color: MUTED,
                }}>
                  {fmtDate(article.published_at)} · {article.read_time || 3} min read
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Headlines;
