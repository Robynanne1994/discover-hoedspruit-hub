import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { channelImage, CHANNEL_IMAGE_COLUMNS } from "@/lib/imageFallback";
import { useAuth } from "@/hooks/useAuth";

import { toast } from "sonner";
import HomeSectionHead from "./HomeSectionHead";
import { MUTED, type } from "@/lib/type";


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
        .select(`id, slug, title, title_override, platform, meta, meta_2, url, is_featured, sort_order, resource_type, ${CHANNEL_IMAGE_COLUMNS}`)
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
          const eyebrow = r.meta || r.platform;
          const meta = r.meta_2;
          return (
            <div
              key={r.id}
              onClick={() => openResource(r)}
              style={{
                background: "#ffffff",
                borderRadius: 16,
                display: "flex",
                alignItems: "stretch",
                gap: 12,
                paddingRight: 10,
                border: "none",
                boxShadow: "0 1px 4px -1px rgba(0,0,0,0.04)",
                textAlign: "left",
                cursor: "pointer",
                width: "100%",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: 90,
                  minHeight: 90,
                  alignSelf: "stretch",
                  background: "#F4EFE3",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  ...type.sectionTitle,
                  color: MUTED,
                }}
              >
                {channelImage(r, "homepage") ? (
                  <img
                    src={channelImage(r, "homepage")!}
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
                  minWidth: 0,
                  alignSelf: "center",
                  padding: "10px 0",
                }}
              >
                {eyebrow && (
                  <div
                    style={{
                      ...type.meta,
                      marginBottom: 4,
                      textTransform: "capitalize",
                    }}
                  >
                    {eyebrow}
                  </div>
                )}
                <div
                  style={{
                    ...type.cardTitleL,
                    marginBottom: 6,
                    textTransform: "capitalize",
                  }}
                >
                  {r.title_override?.trim() || r.title}
                </div>
                {meta && (
                  <div
                    style={{ ...type.meta, textTransform: "capitalize" }}
                  >
                    {meta}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>


    </section>
  );
};

export default HomeLocalChannels;
