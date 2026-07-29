import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type FollowActor = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  // The profile on the other side of the follow (the person who was followed).
  target?: { id: string; display_name: string | null; avatar_url: string | null } | null;
};

// Map: notification.ref_id (follows.id) -> follower profile (+ target profile)
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
        .select("id, follower_id, following_id")
        .in("id", refIds);
      if (!follows?.length) return;
      const ids = Array.from(
        new Set(follows.flatMap((f: any) => [f.follower_id as string, f.following_id as string]))
      );
      const { data: profiles } = await supabase.rpc("get_public_profiles", { _ids: ids });
      const pMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, p]));
      const next: Record<string, FollowActor> = {};
      follows.forEach((f: any) => {
        const p = pMap[f.follower_id];
        const t = pMap[f.following_id];
        if (p) {
          next[f.id] = {
            id: p.id,
            display_name: p.display_name,
            avatar_url: p.avatar_url,
            target: t ? { id: t.id, display_name: t.display_name, avatar_url: t.avatar_url } : null,
          };
        }
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

