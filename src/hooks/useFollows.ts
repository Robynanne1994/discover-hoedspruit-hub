import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useFollowCounts = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["follow-counts", userId],
    queryFn: async () => {
      const [followers, following] = await Promise.all([
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", userId!),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", userId!),
      ]);
      return {
        followers: followers.count ?? 0,
        following: following.count ?? 0,
      };
    },
    enabled: !!userId,
  });
};

export const useIsFollowing = (targetUserId: string | undefined) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["is-following", user?.id, targetUserId],
    queryFn: async () => {
      const { data } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user!.id)
        .eq("following_id", targetUserId!)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!targetUserId && user.id !== targetUserId,
  });
};

export const useFollowMutation = (targetUserId: string) => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const follow = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("follows").insert({
        follower_id: user!.id,
        following_id: targetUserId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["is-following", user?.id, targetUserId] });
      qc.invalidateQueries({ queryKey: ["follow-counts"] });
      qc.invalidateQueries({ queryKey: ["followers"] });
      qc.invalidateQueries({ queryKey: ["following"] });
      qc.invalidateQueries({ queryKey: ["my-following-ids", user?.id] });
    },
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["is-following", user?.id, targetUserId] });
      qc.invalidateQueries({ queryKey: ["follow-counts"] });
      qc.invalidateQueries({ queryKey: ["followers"] });
      qc.invalidateQueries({ queryKey: ["following"] });
      qc.invalidateQueries({ queryKey: ["my-following-ids", user?.id] });
    },
  });

  return { follow, unfollow };
};

export const useFollowersList = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["followers", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("following_id", userId!);
      if (!data?.length) return [];
      const ids = data.map((d) => d.follower_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, location, username")
        .in("id", ids);
      return profiles || [];
    },
    enabled: !!userId,
  });
};

export const useFollowingList = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["following", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", userId!);
      if (!data?.length) return [];
      const ids = data.map((d) => d.following_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, location, username")
        .in("id", ids);
      return profiles || [];
    },
    enabled: !!userId,
  });
};

export const useMyFollowingIds = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-following-ids", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user!.id);
      return new Set((data || []).map((d) => d.following_id as string));
    },
    enabled: !!user,
  });
};
