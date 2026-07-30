import { useQuery, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// The global QueryClient caches for 5 minutes and never refetches on
// mount/focus/reconnect (see App.tsx). That default is wrong for block state:
// an invalidated-but-inactive query is NOT refetched when its screen mounts, so
// after unblocking someone from the Blocked screen or their profile, Search
// still read the pre-unblock block set and kept hiding them. Keep this query
// live so every screen that filters people sees the truth.
const LIVE_QUERY_OPTS = {
  staleTime: 0,
  refetchOnMount: "always" as const,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
};

/**
 * Refresh everything that depends on who I have blocked / who has blocked me.
 * Call after any block or unblock so the change is reflected immediately in
 * search, suggestions, follower/following lists and profile screens.
 *
 * `refetchType: "all"` matters: the relevant queries are usually inactive at
 * this point (you block/unblock from a different screen), and the global
 * `refetchOnMount: false` means a merely-invalidated query would be served from
 * cache when its screen mounts again.
 */
export const invalidateBlockQueries = (qc: QueryClient) => {
  // Search's People results embed the block sets in their query key, so an
  // entry cached while the block was live would be handed straight back the
  // moment the key reverts to "no blocks". Drop them instead of invalidating.
  qc.removeQueries({ queryKey: ["search-people"] });

  const keys = [
    ["blocked-users"], // useBlockedUsers — the filter itself
    ["user-blocks"], // Blocked screen list
    ["user-blocked"], // "am I blocking this profile?"
    ["blocked-by"], // legacy "has this profile blocked me?" — now part of blocked-users
    ["block-cooldown"], // "may I block this profile again yet?" — starts on unblock
    ["user-profile"],
    ["followers"],
    ["following"],
    ["follow-counts"],
    ["my-following-ids"],
    ["is-following"],
    ["follow-requests"],
  ];
  return Promise.all(
    keys.map((queryKey) => qc.invalidateQueries({ queryKey, refetchType: "all" })),
  );
};

/**
 * Returns the sets of user ids relevant to mutual blocking for the
 * currently signed-in user:
 *  - `iBlocked`: ids of users I have blocked
 *  - `blockedMe`: ids of users who have blocked me
 *
 * Used to filter people out of suggestions, search results, notifications and
 * follower/following lists so that blocked relationships disappear from passive
 * discovery. Unblocking removes the row, so the person simply reappears here —
 * nothing about the follow relationship or the notification history the block
 * deleted is restored.
 *
 * Both halves come from the get_block_state() RPC. Reading user_blocks directly
 * cannot answer the second half: its RLS policy only exposes the blocks you
 * created, so `.eq("blocked_id", me)` always came back empty and nobody who
 * blocked this user was ever actually hidden from them.
 */
export const useBlockedUsers = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["blocked-users", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.rpc("get_block_state" as any);
      const row = (Array.isArray(data) ? data[0] : data) as unknown as
        | { i_blocked: string[] | null; blocked_me: string[] | null }
        | undefined;
      return {
        iBlocked: new Set<string>(row?.i_blocked ?? []),
        blockedMe: new Set<string>(row?.blocked_me ?? []),
      };
    },
    ...LIVE_QUERY_OPTS,
  });
};
