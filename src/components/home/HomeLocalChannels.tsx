import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import HomeSectionHead from "./HomeSectionHead";

const HN = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const PLATFORM_INITIAL: Record<string, string> = {
  Facebook: "f",
  WhatsApp: "W",
  Instagram: "IG",
  Websites: "W",
};

const HomeLocalChannels = () => {
  const { data: resources } = useQuery({
    queryKey: ["home-local-channels"],
    queryFn: async () => {
      const { data } = await supabase
        .from("bush_telegraph_resources")
        .select("id, title, platform, meta, url, image_url, is_featured, sort_order")
        .order("is_featured", { ascending: false })
        .order("sort_order", { ascending: true })
        .limit(4);
      return data || [];
    },
  });

  if (!resources || resources.length === 0) return null;

  return (
    <section>
      <HomeSectionHead
        primary="Local"
        serif="channels"
        actionLabel="See all"
        actionHref="/bush-telegraph"
      />
      <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 12 }}>
        {resources.map((r: any) => (
          <a
            key={r.id}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
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
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: HN,
                fontSize: 22,
                color: "#6B6A5E",
              }}
            >
              {r.image_url ? (
                <img
                  src={r.image_url}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              ) : (
                <span>{PLATFORM_INITIAL[r.platform] || "•"}</span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: HN,
                  fontSize: 10.5,
                  color: "#6B6A5E",
                  textTransform: "uppercase",
                  letterSpacing: "1.8px",
                  marginBottom: 4,
                }}
              >
                {r.platform || "Channel"}
              </div>
              <div
                style={{
                  fontFamily: HN,
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
                {r.title}
              </div>
              {r.meta && (
                <div style={{ fontFamily: HN, fontSize: 12, color: "#6B6A5E" }}>
                  {r.meta}
                </div>
              )}
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
                fontFamily: HN,
                fontSize: 14,
                color: "#2A2A24",
                lineHeight: 1,
              }}
            >
              ↗
            </div>
          </a>
        ))}
      </div>
    </section>
  );
};

export default HomeLocalChannels;
