import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";
import { format } from "date-fns";
import BackArrowIcon from "@/components/ui/BackArrowIcon";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const SERIF = "'Playfair Display', Georgia, serif";

const OLIVE = "#5C6446";
const CREAM = "#EEE8DA";
const INK = "#2A2A24";
const MUTED = "#6B6A5E";

const CATEGORIES = ["All", "News", "Community", "Wildlife", "Conservation", "Education", "Travel", "Business"];

const pressDown = (scale = 0.98) => (e: React.PointerEvent<HTMLElement>) => {
  e.currentTarget.style.transform = `scale(${scale})`;
};
const pressUp = (e: React.PointerEvent<HTMLElement>) => {
  e.currentTarget.style.transform = "scale(1)";
};

const fmtDate = (d: string) => {
  try { return format(new Date(d), "d MMM yyyy"); } catch { return d; }
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

  return (
    <div style={{ minHeight: "100vh", background: OLIVE, paddingBottom: 120 }}>
      <style>{`
        .lld-no-scrollbar::-webkit-scrollbar { display: none; }
        .lld-no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .lld-press { transition: transform 150ms ease-out; }
        .lld-input::placeholder { color: ${MUTED}; }
      `}</style>

      {/* Top bar */}
      <div style={{ paddingTop: 32, paddingLeft: 24, paddingRight: 24 }}>
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          onPointerDown={pressDown(0.95)}
          onPointerUp={pressUp}
          onPointerLeave={pressUp}
          className="lld-press"
          style={{
            width: 44, height: 44, borderRadius: 999,
            background: CREAM,
            border: "none",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", padding: 0,
          }}
        >
          <BackArrowIcon size={18} color={INK} />
        </button>
      </div>

      {/* Hero */}
      <div style={{ paddingTop: 18, paddingLeft: 24, paddingRight: 24 }}>
        <div style={{
          fontFamily: SANS, fontSize: 12, fontWeight: 400,
          letterSpacing: "2.4px", textTransform: "uppercase",
          color: CREAM, opacity: 0.7, marginBottom: 14,
        }}>
          The Lowveld
        </div>
        <h1 style={{
          fontFamily: SERIF, fontStyle: "italic", fontWeight: 300,
          fontSize: 72, lineHeight: 0.92, letterSpacing: "-2.5px",
          color: CREAM, margin: 0, marginBottom: 14,
        }}>
          lowdown.
        </h1>
        <p style={{
          fontFamily: SERIF, fontStyle: "italic", fontWeight: 400,
          fontSize: 17, color: CREAM, opacity: 0.75,
          margin: 0, marginBottom: 24, lineHeight: 1.35,
        }}>
          News, stories & local updates.
        </p>
      </div>

      {/* Search */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 22 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          background: "rgba(238, 232, 218, 0.92)",
          borderRadius: 999, height: 52, padding: "0 22px",
        }}>
          <Search size={18} strokeWidth={1.6} color={MUTED} style={{ flexShrink: 0 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles"
            className="lld-input"
            style={{
              border: "none", outline: "none", background: "transparent",
              fontFamily: SANS, fontSize: 14, color: INK, width: "100%",
            }}
          />
        </div>
      </div>

      {/* Category pills */}
      <div
        className="lld-no-scrollbar"
        style={{ marginBottom: 32, paddingLeft: 24, display: "flex", gap: 8, overflowX: "auto" }}
      >
        {CATEGORIES.map((cat) => {
          const active = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              onPointerDown={pressDown(0.97)}
              onPointerUp={pressUp}
              onPointerLeave={pressUp}
              className="lld-press"
              style={{
                background: active ? INK : CREAM,
                color: active ? CREAM : INK,
                fontFamily: SANS, fontSize: 13.5, fontWeight: 400,
                lineHeight: 1, height: 38, padding: "0 20px",
                borderRadius: 999, border: "none", cursor: "pointer",
                whiteSpace: "nowrap", flexShrink: 0,
              }}
            >
              {cat}
            </button>
          );
        })}
        <div style={{ width: 24, flexShrink: 0 }} />
      </div>

      {/* This week's cover */}
      {featured && (
        <>
          <div style={{
            display: "flex", alignItems: "baseline", justifyContent: "space-between",
            padding: "0 24px", marginBottom: 16,
          }}>
            <h2 style={{
              fontFamily: SERIF, fontStyle: "italic", fontWeight: 400,
              fontSize: 32, lineHeight: 1, letterSpacing: "-0.5px",
              color: CREAM, margin: 0,
            }}>
              this week's cover
            </h2>
            <span style={{
              fontFamily: SANS, fontSize: 11, fontWeight: 400,
              letterSpacing: "1.8px", textTransform: "uppercase",
              color: CREAM, opacity: 0.75,
            }}>
              Featured
            </span>
          </div>

          <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 32 }}>
            <Link
              to={`/headlines/${featured.slug}`}
              onPointerDown={pressDown(0.99)}
              onPointerUp={pressUp}
              onPointerLeave={pressUp}
              className="lld-press"
              style={{
                display: "block", position: "relative", width: "100%",
                aspectRatio: "1 / 1.1",
                borderRadius: 24, overflow: "hidden",
                background: featured.image_url
                  ? `url(${featured.image_url}) center/cover no-repeat`
                  : "#3A3F2D",
                textDecoration: "none",
              }}
            >
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to bottom, rgba(20,20,18,0) 40%, rgba(20,20,18,0.85) 100%)",
              }} />

              {featured.category && (
                <div style={{
                  position: "absolute", top: 18, left: 18,
                  background: CREAM, borderRadius: 999,
                  padding: "7px 14px",
                  fontFamily: SANS, fontSize: 11.5, fontWeight: 400,
                  letterSpacing: "1.8px", textTransform: "uppercase",
                  color: INK, lineHeight: 1,
                }}>
                  {featured.category}
                </div>
              )}

              <div style={{
                position: "absolute", top: 18, right: 18,
                width: 38, height: 38, borderRadius: 999,
                background: CREAM,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: SANS, fontSize: 16, color: INK, lineHeight: 1,
              }}>
                ↗
              </div>

              <div style={{ position: "absolute", left: 24, right: 24, bottom: 26 }}>
                <div style={{
                  fontFamily: SANS, fontSize: 12.5, fontWeight: 400,
                  letterSpacing: "0.1px", color: CREAM, opacity: 0.85,
                  marginBottom: 8, lineHeight: 1.3,
                }}>
                  {fmtDate(featured.published_at)}{" \u00B7 "}{featured.read_time || 2} min read
                </div>
                <h3 style={{
                  fontFamily: SANS, fontWeight: 400, fontSize: 28,
                  lineHeight: 1.1, letterSpacing: "-0.4px",
                  color: CREAM, margin: 0,
                }}>
                  {featured.title}
                </h3>
              </div>
            </Link>
          </div>
        </>
      )}

      {/* Recent */}
      <div style={{
        display: "flex", alignItems: "baseline", justifyContent: "space-between",
        padding: "0 24px", marginBottom: 16,
      }}>
        <h2 style={{
          fontFamily: SERIF, fontStyle: "italic", fontWeight: 400,
          fontSize: 32, lineHeight: 1, letterSpacing: "-0.5px",
          color: CREAM, margin: 0, textTransform: "lowercase",
        }}>
          recent
        </h2>
        <span style={{
          fontFamily: SANS, fontSize: 11, fontWeight: 400,
          letterSpacing: "1.8px", textTransform: "uppercase",
          color: CREAM, opacity: 0.75,
        }}>
          All Stories
        </span>
      </div>

      <div style={{ paddingLeft: 24, paddingRight: 24 }}>
        {grid.length === 0 ? (
          <p style={{ fontFamily: SANS, fontSize: 14, color: CREAM, opacity: 0.7, textAlign: "center", paddingTop: 24 }}>
            No articles found.
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {grid.map((article: any) => (
              <Link
                key={article.id}
                to={`/headlines/${article.slug}`}
                onPointerDown={pressDown(0.98)}
                onPointerUp={pressUp}
                onPointerLeave={pressUp}
                className="lld-press"
                style={{
                  position: "relative", display: "flex", flexDirection: "column",
                  background: CREAM, borderRadius: 20,
                  padding: "18px 20px 20px",
                  minHeight: 170, textDecoration: "none",
                }}
              >
                <div style={{
                  position: "absolute", top: 14, right: 14,
                  width: 30, height: 30, borderRadius: 999,
                  background: "rgba(106, 106, 94, 0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: SANS, fontSize: 12, color: INK, lineHeight: 1,
                }}>
                  ↗
                </div>

                <div style={{
                  fontFamily: SANS, fontSize: 10.5, fontWeight: 400,
                  letterSpacing: "1.8px", textTransform: "uppercase",
                  color: MUTED, marginBottom: 14, lineHeight: 1,
                }}>
                  {article.category || "Story"}
                </div>

                <div style={{
                  fontFamily: SANS, fontSize: 14.5, fontWeight: 400,
                  letterSpacing: "-0.1px", lineHeight: 1.3,
                  color: INK, paddingRight: 18, marginBottom: "auto",
                }}>
                  {article.title}
                </div>

                <div style={{
                  fontFamily: SANS, fontSize: 11.5, fontWeight: 400,
                  lineHeight: 1.4, color: MUTED, marginTop: 14,
                }}>
                  {fmtDate(article.published_at)}{" \u00B7 "}{article.read_time || 3} min read
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
