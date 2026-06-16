import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type FollowStatus = "pending" | "accepted" | null;

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
  });
};

// Returns the follow status from current user → target: 'accepted' | 'pending' | null
export const useIsFollowing = (targetUserId: string | undefined) => {
  const { user } = useAuth();
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
  });
};

export const useRespondToFollowRequest = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, accept }: { requestId: string; accept: boolean }) => {
      if (accept) {
        const { error } = await supabase
          .from("follows")
          .update({ status: "accepted", responded_at: new Date().toISOString() } as any)
          .eq("id", requestId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("follows").delete().eq("id", requestId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["follow-requests", user?.id] });
      qc.invalidateQueries({ queryKey: ["follow-counts"] });
      qc.invalidateQueries({ queryKey: ["followers"] });
    },
  });
};
