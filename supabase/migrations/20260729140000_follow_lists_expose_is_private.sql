-- The Connections screen needs to know whether each person in a follower /
-- following list has a private profile, so the unfollow confirmation can warn
-- that following them again means sending a new request. RLS hides other users'
-- profile rows from the client, so the flag has to come out of these
-- SECURITY DEFINER helpers alongside the rest of the row.
--
-- Changing a function's return type requires dropping it first.

DROP FUNCTION IF EXISTS public.get_followers(uuid);
DROP FUNCTION IF EXISTS public.get_following(uuid);

CREATE FUNCTION public.get_followers(_user_id uuid)
 RETURNS TABLE(
   id uuid,
   display_name text,
   avatar_url text,
   location text,
   username text,
   activity_private boolean,
   is_private boolean
 )
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT p.id, p.display_name, p.avatar_url, p.location, p.username,
         p.activity_private, COALESCE(p.is_private, false)
  FROM public.follows f JOIN public.profiles p ON p.id = f.follower_id
  WHERE f.following_id = _user_id AND f.status = 'accepted'
    AND COALESCE(p.moderation_status,'active') <> 'banned'
    AND NOT EXISTS (SELECT 1 FROM public.user_blocks ub
      WHERE (ub.blocker_id = auth.uid() AND ub.blocked_id = p.id)
         OR (ub.blocker_id = p.id AND ub.blocked_id = auth.uid()));
$$;

CREATE FUNCTION public.get_following(_user_id uuid)
 RETURNS TABLE(
   id uuid,
   display_name text,
   avatar_url text,
   location text,
   username text,
   activity_private boolean,
   is_private boolean
 )
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT p.id, p.display_name, p.avatar_url, p.location, p.username,
         p.activity_private, COALESCE(p.is_private, false)
  FROM public.follows f JOIN public.profiles p ON p.id = f.following_id
  WHERE f.follower_id = _user_id AND f.status = 'accepted'
    AND COALESCE(p.moderation_status,'active') <> 'banned'
    AND NOT EXISTS (SELECT 1 FROM public.user_blocks ub
      WHERE (ub.blocker_id = auth.uid() AND ub.blocked_id = p.id)
         OR (ub.blocker_id = p.id AND ub.blocked_id = auth.uid()));
$$;

REVOKE EXECUTE ON FUNCTION public.get_followers(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_following(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_followers(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_following(uuid) TO authenticated;
