import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type FollowStatus = "pending" | "accepted" | null;

// The global QueryClient caches everything for 5 minutes and never refetches
// on mount/focus/reconnect (see App.tsx). That is fine for mostly-static content
// but wrong for follow state: when someone accepts a follow request, the other
// side must see "Following" (and updated counts/lists) promptly. A stale cache
// combined with unreliable realtime on mobile webviews left the requester stuck
// showing "Requested". These overrides keep the social queries live: always
// refetch when a screen mounts or regains focus, and never treat the data as
// fresh enough to skip a refetch.
const LIVE_QUERY_OPTS = {
  staleTime: 0,
  refetchOnMount: "always" as const,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
};

export const useFollowCounts = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["follow-counts", userId],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_follow_counts", { _user_id: userId! });
      const row = Array.isArray(data) ? data[0] : data;
      return {
        followers: (row?.followers as number) ?? 0,
        following: (row?.following as number) ?? 0,
      };
    },
    enabled: !!userId,
    ...LIVE_QUERY_OPTS,
  });
};

// Returns the follow status from current user → target: 'accepted' | 'pending' | null
export const useIsFollowing = (targetUserId: string | undefined) => {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user || !targetUserId || user.id === targetUserId) return;
    const invalidate = () => {
      qc.invalidateQueries({ queryKey: ["is-following", user.id, targetUserId] });
      qc.invalidateQueries({ queryKey: ["my-following-ids", user.id] });
      qc.invalidateQueries({ queryKey: ["follow-counts"] });
    };
    const channel = supabase
      .channel(`follows-watch-${user.id}-${targetUserId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "follows" },
        (payload: any) => {
          const row = payload.new || payload.old || {};
          // DELETE payloads may be sparse without REPLICA IDENTITY FULL; refetch on any delete
          if (payload.eventType === "DELETE") {
            invalidate();
            return;
          }
          if (
            (row.follower_id === user.id && row.following_id === targetUserId) ||
            (row.follower_id === targetUserId && row.following_id === user.id)
          ) {
            invalidate();
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, targetUserId, qc]);

  return useQuery<FollowStatus>({
    queryKey: ["is-following", user?.id, targetUserId],
    queryFn: async () => {
      const { data } = await supabase
        .from("follows")
        .select("status")
        .eq("follower_id", user!.id)
        .eq("following_id", targetUserId!)
        .maybeSingle();
      return ((data as any)?.status as FollowStatus) ?? null;
    },
    enabled: !!user && !!targetUserId && user.id !== targetUserId,
    ...LIVE_QUERY_OPTS,
    // While a request is still pending, poll so acceptance flips the button to
    // "Following" on its own — even if the realtime event never arrives (common
    // on backgrounded mobile webviews). Once resolved, polling stops.
    refetchInterval: (query) => (query.state.data === "pending" ? 15000 : false),
  });
};


export const useFollowMutation = (targetUserId: string) => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["is-following", user?.id, targetUserId] });
    qc.invalidateQueries({ queryKey: ["follow-counts"] });
    qc.invalidateQueries({ queryKey: ["followers"] });
    qc.invalidateQueries({ queryKey: ["following"] });
    qc.invalidateQueries({ queryKey: ["my-following-ids", user?.id] });
    qc.invalidateQueries({ queryKey: ["follow-requests", user?.id] });
  };

  const follow = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("follows").insert({
        follower_id: user!.id,
        following_id: targetUserId,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const unfollow = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user!.id)
        .eq("following_id", targetUserId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { follow, unfollow };
};

export const useFollowersList = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["followers", userId],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_followers", { _user_id: userId! });
      return data || [];
    },
    enabled: !!userId,
    ...LIVE_QUERY_OPTS,
  });
};

export const useFollowingList = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["following", userId],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_following", { _user_id: userId! });
      return data || [];
    },
    enabled: !!userId,
    ...LIVE_QUERY_OPTS,
  });
};

// Only accepted follows for the current user (used to highlight Following pills)
export const useMyFollowingIds = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-following-ids", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("follows")
        .select("following_id, status")
        .eq("follower_id", user!.id)
        .eq("status", "accepted");
      return new Set((data || []).map((d: any) => d.following_id as string));
    },
    enabled: !!user,
    ...LIVE_QUERY_OPTS,
  });
};

// Incoming pending follow requests (people who want to follow me)
export const useFollowRequests = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["follow-requests", user?.id],
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("follows")
        .select("id, follower_id, created_at")
        .eq("following_id", user!.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (!rows?.length) return [] as any[];
      const ids = rows.map((r: any) => r.follower_id);
      const { data: profiles } = await supabase.rpc("get_public_profiles", { _ids: ids });
      const map = Object.fromEntries((profiles || []).map((p: any) => [p.id, p]));
      return rows.map((r: any) => ({
        request_id: r.id,
        created_at: r.created_at,
        ...(map[r.follower_id] || { id: r.follower_id }),
      }));
    },
    enabled: !!user,
    ...LIVE_QUERY_OPTS,
  });
};

export const useRespondToFollowRequest = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, accept }: { requestId: string; accept: boolean }) => {
      // Authoritative server-side accept/decline. Runs SECURITY DEFINER so the
      // follows row actually changes (and the notification trigger fires),
      // rather than relying on an RLS-gated client write that can silently
      // affect zero rows.
      const { error } = await supabase.rpc("respond_to_follow_request", {
        _request_id: requestId,
        _accept: accept,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["follow-requests", user?.id] });
      qc.invalidateQueries({ queryKey: ["follow-counts"] });
      qc.invalidateQueries({ queryKey: ["followers"] });
      qc.invalidateQueries({ queryKey: ["following"] });
      qc.invalidateQueries({ queryKey: ["my-following-ids"] });
      qc.invalidateQueries({ queryKey: ["is-following"] });
    },
  });
};
