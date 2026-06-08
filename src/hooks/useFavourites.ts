import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type ItemType = "listing" | "event" | "special" | "resource";

const KEY = (userId: string | undefined) => ["favourites-set", userId];

/**
 * Loads ALL of the current user's favourites once and caches them as a Set
 * keyed by `${type}:${id}`. Cards then check membership in O(1) without
 * issuing a network request per heart icon.
 */
export const useFavouritesSet = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: KEY(user?.id),
    queryFn: async () => {
      if (!user) return new Set<string>();
      const { data } = await supabase
        .from("favourites" as any)
        .select("item_id, item_type")
        .eq("user_id", user.id);
      return new Set<string>(
        ((data as any[]) || []).map((r) => `${r.item_type}:${r.item_id}`),
      );
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
};

export const useIsFavourited = (itemId: string, itemType: ItemType) => {
  const { data } = useFavouritesSet();
  return data?.has(`${itemType}:${itemId}`) ?? false;
};

export const useToggleFavourite = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      itemId,
      itemType,
      currentlyFavourited,
    }: {
      itemId: string;
      itemType: ItemType;
      currentlyFavourited: boolean;
    }) => {
      if (!user) return;
      if (currentlyFavourited) {
        await supabase
          .from("favourites" as any)
          .delete()
          .eq("user_id", user.id)
          .eq("item_id", itemId)
          .eq("item_type", itemType);
      } else {
        await supabase
          .from("favourites" as any)
          .insert({ user_id: user.id, item_id: itemId, item_type: itemType });
      }
    },
    onMutate: async ({ itemId, itemType, currentlyFavourited }) => {
      await qc.cancelQueries({ queryKey: KEY(user?.id) });
      const prev = qc.getQueryData<Set<string>>(KEY(user?.id));
      const next = new Set(prev ?? []);
      const k = `${itemType}:${itemId}`;
      if (currentlyFavourited) next.delete(k);
      else next.add(k);
      qc.setQueryData(KEY(user?.id), next);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEY(user?.id), ctx.prev);
    },
    // No global invalidate-everything — the optimistic cache update is
    // sufficient and avoids cascading refetches that cause UI flicker.
  });
};
