import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import HomeSectionHead from "./HomeSectionHead";

const HN = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const PLATFORM_INITIAL: Record<string, string> = {
  Facebook: "f",
  WhatsApp: "W",
  Instagram: "IG",
  Websites: "W",
};

const HomeLocalChannels = () => {
  const navigate = useNavigate();
  const { data: resources } = useQuery({
    queryKey: ["home-local-channels"],
    queryFn: async () => {
      const { data } = await supabase
        .from("bush_telegraph_resources")
        .select("id, slug, title, title_override, platform, meta, meta_2, url, image_url, is_featured, sort_order, resource_type")
        .order("is_featured", { ascending: false })
        .order("sort_order", { ascending: true })
        .limit(4);
      return data || [];
    },
  });

  if (!resources || resources.length === 0) return null;

  const openResource = (r: any) => {
    if (r.slug) navigate(`/local-channels/${r.slug}`);
    else if (r.url) window.open(r.url, "_blank", "noopener,noreferrer");
  };

  return (
    <section>
      <HomeSectionHead
        primary="Local Channels"
        actionLabel="See all"
        actionHref="/local-channels"
      />
      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 4 }}>
        {resources.map((r: any) => (
          <button
            key={r.id}
            type="button"
            onClick={() => openResource(r)}
            onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
            onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            style={{
              background: "#ffffff",
              borderRadius: 16,
              padding: 12,
              display: "flex",
              alignItems: "center",
              gap: 12,
              textDecoration: "none",
              transition: "transform 150ms ease-out",
              border: "none",
              textAlign: "left",
              cursor: "pointer",
              width: "100%",
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
                {r.title_override?.trim() || r.title}
              </div>
              {(r.meta || r.meta_2) && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: HN, fontSize: 12, color: "#6B6A5E", flexWrap: "wrap" }}>
                  {[r.meta, r.meta_2].filter((m: string | null) => m && m.trim()).map((m: string, i: number) => (
                    <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {i > 0 && <span style={{ width: 3, height: 3, borderRadius: 999, background: "#6B6A5E", display: "inline-block" }} />}
                      <span>{m}</span>
                    </span>
                  ))}
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
          </button>
        ))}
      </div>
    </section>
  );
};

export default HomeLocalChannels;
