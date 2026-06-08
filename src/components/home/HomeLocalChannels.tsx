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
        .select("id, slug, title, title_override, platform, meta, meta_2, url, image_url, is_featured, sort_order, resource_type")
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
        actionLabel="See all"
        actionHref="/local-channels"
      />
      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 4 }}>
        {resources.map((r: any) => {
          const isSaved = !!(savedResourceIds && savedResourceIds.has(r.id));
          return (
            <div
              key={r.id}
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
                position: "relative",
              }}
            >
              <div
                onClick={() => openResource(r)}
                onPointerDown={(e) => (e.currentTarget.style.transform = "scale(1)")}
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
              <div onClick={() => openResource(r)} style={{ flex: 1, minWidth: 1, cursor: "pointer" }}>
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
                  {r.meta || r.platform || "Channel"}
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
                {r.meta_2 && (
                  <div style={{ fontFamily: HN, fontSize: 12, color: "#6B6A5E" }}>
                    {r.meta_2}
                  </div>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!user) {
                    toast.error("Please sign in to save");
                    return;
                  }
                  toggleSave.mutate({ itemId: r.id, isSaved });
                }}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  background: isSaved ? "#5b4632" : "rgba(107, 106, 94, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  border: "none",
                  cursor: "pointer",
                  transition: "background 150ms ease-out",
                }}
                aria-label={isSaved ? "Remove from saved" : "Save"}
              >
                <Heart
                  size={16}
                  strokeWidth={1.8}
                  style={{
                    color: isSaved ? "#fff" : "#2A2A24",
                    fill: isSaved ? "#fff" : "none",
                  }}
                />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default HomeLocalChannels;
