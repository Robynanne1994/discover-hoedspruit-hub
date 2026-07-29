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
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: resources } = useQuery({
    queryKey: ["home-local-channels"],
    queryFn: async () => {
      const { data } = await supabase
        .from("bush_telegraph_resources")
        .select("id, slug, title, title_override, platform, meta, meta_2, url, image_url, homepage_image_url, is_featured, sort_order, resource_type")
        .order("is_featured", { ascending: false })
        .order("sort_order", { ascending: true })
        .limit(4);
      return data || [];
    },
  });

  const { data: savedResourceIds } = useQuery({
    queryKey: ["saved-resource-ids", user?.id],
    queryFn: async () => {
      if (!user) return new Set<string>();
      const { data } = await supabase
        .from("favourites" as any)
        .select("item_id")
        .eq("user_id", user.id)
        .eq("item_type", "resource");
      return new Set((data || []).map((f: any) => f.item_id));
    },
    enabled: !!user,
  });

  const toggleSave = useMutation({
    mutationFn: async ({ itemId, isSaved }: { itemId: string; isSaved: boolean }) => {
      if (!user) throw new Error("not-signed-in");
      if (isSaved) {
        const { error } = await supabase
          .from("favourites" as any)
          .delete()
          .eq("user_id", user.id)
          .eq("item_id", itemId)
          .eq("item_type", "resource");
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("favourites" as any)
          .insert({ user_id: user.id, item_id: itemId, item_type: "resource" });
        if (error) throw error;
      }
    },
    // Optimistically flip the saved state in the local id-set and the shared
    // favourites cache so the heart toggles instantly instead of refetching the
    // list (which caused the section to flash on every save).
    onMutate: async ({ itemId, isSaved }) => {
      const idsKey = ["saved-resource-ids", user?.id];
      const setKey = ["favourites-set", user?.id];
      await Promise.all([
        queryClient.cancelQueries({ queryKey: idsKey }),
        queryClient.cancelQueries({ queryKey: setKey }),
      ]);
      const prevIds = queryClient.getQueryData<Set<string>>(idsKey);
      const prevSet = queryClient.getQueryData<Set<string>>(setKey);
      if (prevIds) {
        const next = new Set(prevIds);
        if (isSaved) next.delete(itemId);
        else next.add(itemId);
        queryClient.setQueryData(idsKey, next);
      }
      if (prevSet) {
        const next = new Set(prevSet);
        const k = `resource:${itemId}`;
        if (isSaved) next.delete(k);
        else next.add(k);
        queryClient.setQueryData(setKey, next);
      }
      return { idsKey, setKey, prevIds, prevSet };
    },
    onSuccess: (_d, vars) => {
      // Profile's saved-resources list isn't mounted here, so this only marks
      // it stale (no refetch, no flicker).
      queryClient.invalidateQueries({ queryKey: ["my-saved-resources"] });
      toast.success(vars.isSaved ? "Removed from saved" : "Saved to your resources");
    },
    onError: (err: any, _v, ctx) => {
      if (ctx?.prevIds !== undefined) queryClient.setQueryData(ctx.idsKey, ctx.prevIds);
      if (ctx?.prevSet !== undefined) queryClient.setQueryData(ctx.setKey, ctx.prevSet);
      if (err?.message === "not-signed-in") toast.error("Please sign in to save");
      else toast.error(err?.message || "Could not update saved");
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
        actionLabel="View All"
        actionHref="/local-channels"
      />
      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 8 }}>
        {resources.map((r: any) => {
          const sub = [r.meta || r.platform, r.meta_2].filter(Boolean).join(" · ");
          return (
            <div
              key={r.id}
              onClick={() => openResource(r)}
              style={{
                background: "#ffffff",
                borderRadius: 16,
                display: "flex",
                alignItems: "stretch",
                textDecoration: "none",
                border: "none",
                textAlign: "left",
                cursor: "pointer",
                width: "100%",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: 96,
                  minHeight: 96,
                  alignSelf: "stretch",
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
                {(r.homepage_image_url || r.image_url) ? (
                  <img
                    src={r.homepage_image_url || r.image_url}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <span>{PLATFORM_INITIAL[r.platform] || "•"}</span>
                )}
              </div>
              <div
                style={{
                  flex: 1,
                  minWidth: 1,
                  alignSelf: "center",
                  padding: "12px 8px 12px 14px",
                }}
              >
                <div
                  style={{
                    fontFamily: HN,
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#1A1A1A",
                    lineHeight: 1.25,
                    marginBottom: 4,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {r.title_override?.trim() || r.title}
                </div>
                {sub && (
                  <div
                    style={{
                      fontFamily: HN,
                      fontSize: 13,
                      fontWeight: 400,
                      color: "#6B6A5E",
                      lineHeight: 1.2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {sub}
                  </div>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  paddingRight: 14,
                  flexShrink: 0,
                }}
              >
                <ArrowUpRight size={20} strokeWidth={2} color="#715A3D" />
              </div>
            </div>
          );
        })}
      </div>

    </section>
  );
};

export default HomeLocalChannels;
