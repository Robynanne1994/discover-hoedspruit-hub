import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type FollowActor = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

// Map: notification.ref_id (follows.id) -> follower profile
export const useFollowRequestActors = (refIds: string[]) => {
  const [map, setMap] = useState<Record<string, FollowActor>>({});
  const key = refIds.slice().sort().join(",");

  useEffect(() => {
    let cancelled = false;
    if (!refIds.length) {
      setMap({});
      return;
    }
    (async () => {
      const { data: follows } = await supabase
        .from("follows")
        .select("id, follower_id")
        .in("id", refIds);
      if (!follows?.length) return;
      const followerIds = Array.from(new Set(follows.map((f: any) => f.follower_id as string)));
      const { data: profiles } = await supabase.rpc("get_public_profiles", { _ids: followerIds });
      const pMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, p]));
      const next: Record<string, FollowActor> = {};
      follows.forEach((f: any) => {
        const p = pMap[f.follower_id];
        if (p) next[f.id] = { id: p.id, display_name: p.display_name, avatar_url: p.avatar_url };
      });
      if (!cancelled) setMap(next);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return map;
};
