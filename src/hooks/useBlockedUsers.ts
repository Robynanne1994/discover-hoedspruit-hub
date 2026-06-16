import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Returns the sets of user ids relevant to mutual blocking for the
 * currently signed-in user:
 *  - `iBlocked`: ids of users I have blocked
 *  - `blockedMe`: ids of users who have blocked me
 *
 * Used to filter people out of suggestions, search results, and
 * follower/following lists so that blocked relationships disappear
 * from passive discovery.
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
  });
};
