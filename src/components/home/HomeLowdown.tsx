import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import HomeSectionHead from "./HomeSectionHead";

const SANS = "'Pragmatica', 'Inter', 'Helvetica Neue', Helvetica, sans-serif";
const SERIF = "'Playfair Display', 'Helvetica Neue', serif";

const HomeLowdown = () => {
  const { data: articles } = useQuery({
    queryKey: ["home-lowdown-list"],
      queryFn: async () => {
        const { data } = await supabase
          .from("articles")
          .select("id, slug, title, category, published_at, read_time, image_url")
          .eq("is_published", true)
          .order("published_at", { ascending: false })
          .limit(4);
        return data || [];
      },
  });

  if (!articles || articles.length === 0) return null;

  const fmt = (d: string) => {
    try {
      return format(new Date(d), "d MMM");
    } catch {
      return d;
    }
  };

  return (
    <section>
      <HomeSectionHead primary="Lowveld" serif="lowdown" actionLabel="Read all" actionHref="/headlines" />
      <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 10 }}>
        {articles.map((a: any, idx: number) => (
          <Link
            key={a.id}
            to={`/headlines/${a.slug}`}
            onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
            onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            style={{
              background: "#FFFFFF",
              borderRadius: 20,
              padding: "18px 18px 18px 20px",
              display: "flex",
              alignItems: "center",
              gap: 16,
              textDecoration: "none",
              transition: "transform 150ms ease-out",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                overflow: "hidden",
                background: "#F2EFEC",
                flexShrink: 0,
              }}
            >
              {a.image_url && (
                <img
                  src={a.image_url}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: SANS,
                  fontSize: 11,
                  color: "#F26A48",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 4,
                }}
              >
                {a.category || "News"}
              </div>
              <div
                style={{
                  fontFamily: "'Helvetica World', Helvetica, Arial, sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#0A0A0A",
                  lineHeight: 1.25,
                  marginBottom: 4,
                  letterSpacing: "-0.01em",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {a.title}
              </div>
              <div style={{ fontFamily: SANS, fontSize: 12, color: "#8A8480" }}>
                {fmt(a.published_at)} · {a.read_time || 3} min read
              </div>
            </div>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 999,
                background: "#F2EFEC",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ArrowUpRight size={14} color="#0A0A0A" strokeWidth={2} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default HomeLowdown;
