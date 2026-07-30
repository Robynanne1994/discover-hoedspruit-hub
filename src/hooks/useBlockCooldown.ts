import { useQuery, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { BlockCooldown } from "@/lib/blockCooldown";

export const blockCooldownKey = (userId?: string, targetId?: string) => [
  "block-cooldown",
  userId,
  targetId,
];

const readCooldown = async (targetId: string): Promise<BlockCooldown | null> => {
  const { data, error } = await supabase.rpc("get_block_cooldown", {
    _blocked_id: targetId,
  });
  if (error) throw error;
  const row = (data ?? [])[0];
  if (!row) return null;
  return {
    unblockedAt: row.unblocked_at,
    availableAt: row.available_at,
    isActive: !!row.is_active,
  };
};

/**
 * Whether the signed-in user is still inside the cooldown that started when
 * they last unblocked `targetId` — i.e. whether blocking them again is allowed
 * right now. `null` means there is nothing on record for the pair.
 *
 * Like the block queries themselves this has to stay live: the cooldown starts
 * the moment someone unblocks, and the global cache would otherwise hand a
 * stale "no cooldown" answer to the next screen that asks.
 *
 * Pass `enabled: false` where the answer cannot matter yet — e.g. while the
 * person is still blocked — to save the round trip.
 */
export const useBlockCooldown = (targetId?: string, enabled = true) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: blockCooldownKey(user?.id, targetId),
    enabled: enabled && !!user?.id && !!targetId && user!.id !== targetId,
    queryFn: () => readCooldown(targetId!),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
};

/**
 * Read the cooldown once, outside of React Query, and seed the cache with it.
 * Used after a block insert is refused so the sheet can name the exact date
 * without waiting for a background refetch.
 */
export const fetchBlockCooldown = async (
  qc: QueryClient,
  userId: string,
  targetId: string,
) => {
  const cooldown = await readCooldown(targetId).catch(() => null);
  qc.setQueryData(blockCooldownKey(userId, targetId), cooldown);
  return cooldown;
};
