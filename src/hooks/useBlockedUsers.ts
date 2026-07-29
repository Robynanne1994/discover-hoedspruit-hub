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
    ["blocked-by"], // "has this profile blocked me?"
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
 * Used to filter people out of suggestions, search results, and
 * follower/following lists so that blocked relationships disappear
 * from passive discovery. Unblocking removes the row, so the person
 * simply reappears here — nothing about the follow relationship is
 * restored.
 */
export const useBlockedUsers = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["blocked-users", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [iBlockedRes, blockedMeRes] = await Promise.all([
        supabase
          .from("user_blocks" as any)
          .select("blocked_id")
          .eq("blocker_id", user!.id),
        supabase
          .from("user_blocks" as any)
          .select("blocker_id")
          .eq("blocked_id", user!.id),
      ]);
      const iBlocked = new Set<string>(
        ((iBlockedRes.data as any[]) || []).map((r) => r.blocked_id as string),
      );
      const blockedMe = new Set<string>(
        ((blockedMeRes.data as any[]) || []).map((r) => r.blocker_id as string),
      );
      return { iBlocked, blockedMe };
    },
    ...LIVE_QUERY_OPTS,
  });
};
