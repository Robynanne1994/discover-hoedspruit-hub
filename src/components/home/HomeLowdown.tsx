import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import HomeSectionHead from "./HomeSectionHead";

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
    try { return format(new Date(d), "d MMM"); } catch { return d; }
  };

  return (
    <section>
      <HomeSectionHead primary="Lowveld" serif="lowdown" actionLabel="Read all" actionHref="/headlines" />
      <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 12 }}>
        {articles.map((a: any) => (
          <Link
            key={a.id}
            to={`/headlines/${a.slug}`}
            onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
            onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            style={{
              background: "#EEE8DA",
              borderRadius: 20,
              padding: 14,
              display: "flex",
              alignItems: "center",
              gap: 14,
              textDecoration: "none",
              transition: "transform 150ms ease-out",
            }}
          >
            <div
              style={{
                width: 74,
                height: 74,
                borderRadius: 14,
                overflow: "hidden",
                background: "#F4EFE3",
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
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                  fontSize: 10.5,
                  color: "#6B6A5E",
                  textTransform: "uppercase",
                  letterSpacing: "1.8px",
                  marginBottom: 4,
                }}
              >
                {a.category || "News"}
              </div>
              <div
                style={{
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                  fontSize: 14.5,
                  color: "#2A2A24",
                  lineHeight: 1.3,
                  marginBottom: 5,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {a.title}
              </div>
              <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 12, color: "#6B6A5E" }}>
                {fmt(a.published_at)} · {a.read_time || 3} min read
              </div>
            </div>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                background: "rgba(107, 106, 94, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontSize: 14,
                color: "#2A2A24",
                lineHeight: 1,
              }}
            >
              ↗
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default HomeLowdown;
