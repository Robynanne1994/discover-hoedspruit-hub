
DROP FUNCTION IF EXISTS public.get_public_profiles(uuid[]);
DROP FUNCTION IF EXISTS public.get_following(uuid);
DROP FUNCTION IF EXISTS public.get_followers(uuid);
DROP FUNCTION IF EXISTS public.search_public_profiles(text, integer);
DROP VIEW IF EXISTS public.profiles_public;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS bio;
CREATE VIEW public.profiles_public AS
  SELECT id, display_name, avatar_url, location, created_at, updated_at FROM public.profiles;
GRANT SELECT ON public.profiles_public TO anon, authenticated;

CREATE FUNCTION public.get_public_profiles(_ids uuid[])
 RETURNS TABLE(id uuid, display_name text, avatar_url text, location text, username text, activity_private boolean, is_private boolean)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT id, display_name, avatar_url, location, username, activity_private, is_private
  FROM public.profiles WHERE id = ANY(_ids);
$$;

CREATE FUNCTION public.get_following(_user_id uuid)
 RETURNS TABLE(id uuid, display_name text, avatar_url text, location text, username text, activity_private boolean)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT p.id, p.display_name, p.avatar_url, p.location, p.username, p.activity_private
  FROM public.follows f JOIN public.profiles p ON p.id = f.following_id
  WHERE f.follower_id = _user_id AND f.status = 'accepted'
    AND NOT EXISTS (SELECT 1 FROM public.user_blocks ub
      WHERE (ub.blocker_id = auth.uid() AND ub.blocked_id = p.id)
         OR (ub.blocker_id = p.id AND ub.blocked_id = auth.uid()));
$$;

CREATE FUNCTION public.get_followers(_user_id uuid)
 RETURNS TABLE(id uuid, display_name text, avatar_url text, location text, username text, activity_private boolean)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT p.id, p.display_name, p.avatar_url, p.location, p.username, p.activity_private
  FROM public.follows f JOIN public.profiles p ON p.id = f.follower_id
  WHERE f.following_id = _user_id AND f.status = 'accepted'
    AND NOT EXISTS (SELECT 1 FROM public.user_blocks ub
      WHERE (ub.blocker_id = auth.uid() AND ub.blocked_id = p.id)
         OR (ub.blocker_id = p.id AND ub.blocked_id = auth.uid()));
$$;

CREATE FUNCTION public.search_public_profiles(_term text, _limit integer DEFAULT 50)
 RETURNS TABLE(id uuid, display_name text, avatar_url text, location text, username text, activity_private boolean, is_private boolean)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT id, display_name, avatar_url, location, username, activity_private, is_private
  FROM public.profiles
  WHERE _term IS NULL OR _term = ''
     OR display_name ILIKE '%' || _term || '%'
     OR username ILIKE '%' || _term || '%'
  ORDER BY created_at DESC
  LIMIT GREATEST(_limit, 1);
$$;
