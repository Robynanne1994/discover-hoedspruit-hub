import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type FollowProfile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

export type FollowActor = FollowProfile & {
  // The profile on the other side of the follow (the person who was followed).
  target?: FollowProfile | null;
};

// Notification kinds whose card shows a person (and therefore their avatar).
export const FOLLOW_ACTOR_KINDS = [
  "follow_request",
  "follow_request_accepted",
  "follow_request_declined",
  "follow_request_withdrawn",
  "follow_accepted",
  "new_follower",
] as const;

export const isFollowActorKind = (kind: string) =>
  (FOLLOW_ACTOR_KINDS as readonly string[]).includes(kind);

// Resolved follow notifications link to the person: '/profile/<uuid>'.
const PROFILE_LINK = /^\/profile\/([0-9a-fA-F-]{36})$/;

export const profileIdFromLink = (link?: string | null): string | null => {
  const m = link?.match(PROFILE_LINK);
  return m ? m[1] : null;
};

export type FollowActorRef = {
  ref_id: string | null;
  link?: string | null;
};

/**
 * Map: notification.ref_id (follows.id) -> the person shown on that card.
 *
 * Declining a follow request DELETEs the follows row, so a resolved
 * 'follow_request_declined' notification points at a row that no longer
 * exists. Falling back to the profile id in the notification's link keeps the
 * avatar on the card — the picture must not disappear just because the follow
 * was turned down. Results are merged into state rather than replacing it, so
 * an avatar already on screen never blanks out mid-session either.
 */
export const useFollowRequestActors = (refs: FollowActorRef[]) => {
  const [map, setMap] = useState<Record<string, FollowActor>>({});

  const entries = refs
    .filter((r) => !!r.ref_id)
    .map((r) => ({ refId: r.ref_id as string, fallbackId: profileIdFromLink(r.link) }));
  const key = entries
    .map((e) => `${e.refId}:${e.fallbackId ?? ""}`)
    .sort()
    .join(",");

  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  useEffect(() => {
    let cancelled = false;
    const pairs = entriesRef.current;
    if (!pairs.length) return;
    (async () => {
      const { data: follows } = await supabase
        .from("follows")
        .select("id, follower_id, following_id")
        .in("id", pairs.map((p) => p.refId));
      const followById = new Map<string, any>((follows ?? []).map((f: any) => [f.id as string, f]));

      const ids = new Set<string>();
      pairs.forEach(({ refId, fallbackId }) => {
        const f = followById.get(refId);
        if (f) {
          ids.add(f.follower_id);
          ids.add(f.following_id);
        } else if (fallbackId) {
          // follows row is gone (declined / withdrawn / unfollowed) — the
          // notification's own link still tells us who the card is about.
          ids.add(fallbackId);
        }
      });
      if (ids.size === 0) return;

      const { data: profiles } = await supabase.rpc("get_public_profiles", { _ids: Array.from(ids) });
      const pMap: Record<string, FollowProfile> = Object.fromEntries(
        (profiles || []).map((p: any) => [
          p.id,
          { id: p.id, display_name: p.display_name, avatar_url: p.avatar_url },
        ])
      );

      const next: Record<string, FollowActor> = {};
      pairs.forEach(({ refId, fallbackId }) => {
        const f = followById.get(refId);
        if (f) {
          const p = pMap[f.follower_id];
          const t = pMap[f.following_id];
          if (p) next[refId] = { ...p, target: t ?? null };
        } else if (fallbackId && pMap[fallbackId]) {
          next[refId] = { ...pMap[fallbackId], target: null };
        }
      });

      if (!cancelled && Object.keys(next).length > 0) {
        setMap((prev) => ({ ...prev, ...next }));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return map;
};

// For "they accepted your request" the person to show is the account that was
// followed, not the requester (that's the viewer themselves).
export const actorForNotif = (kind: string, actor?: FollowActor): FollowProfile | undefined =>
  kind === "follow_accepted" ? actor?.target || actor : actor;
