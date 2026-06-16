-- Remove the profile "bio" field entirely: column, public view, RPCs and grants.

-- 1) Drop dependent RPCs first (their return types include bio)
DROP FUNCTION IF EXISTS public.get_public_profiles(uuid[]);
DROP FUNCTION IF EXISTS public.search_public_profiles(text, integer);
DROP FUNCTION IF EXISTS public.get_followers(uuid);
DROP FUNCTION IF EXISTS public.get_following(uuid);

-- 2) Drop the public-safe view that exposes bio (it depends on the column)
DROP VIEW IF EXISTS public.profiles_public;

-- 3) Drop the column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS bio;

-- 4) Recreate the public-safe view without bio
CREATE VIEW public.profiles_public
WITH (security_invoker = true)
AS
SELECT id, display_name, avatar_url, location, created_at, updated_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO authenticated, anon;

-- 5) Re-grant column-level privileges without bio
GRANT SELECT (id, display_name, avatar_url, location, created_at, updated_at)
  ON public.profiles TO authenticated, anon;

-- 6) Recreate the RPCs without bio
CREATE FUNCTION public.get_public_profiles(_ids uuid[])
RETURNS TABLE(id uuid, display_name text, avatar_url text, location text, username text, activity_private boolean, is_private boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, display_name, avatar_url, location, username, activity_private, is_private
  FROM public.profiles WHERE id = ANY(_ids);
$$;

CREATE FUNCTION public.search_public_profiles(_term text, _limit integer DEFAULT 50)
RETURNS TABLE(id uuid, display_name text, avatar_url text, location text, username text, activity_private boolean, is_private boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, display_name, avatar_url, location, username, activity_private, is_private
  FROM public.profiles
  WHERE _term IS NULL OR _term = ''
     OR display_name ILIKE '%' || _term || '%'
     OR username ILIKE '%' || _term || '%'
  ORDER BY created_at DESC
  LIMIT GREATEST(_limit, 1);
$$;

CREATE FUNCTION public.get_followers(_user_id uuid)
RETURNS TABLE(id uuid, display_name text, avatar_url text, location text, username text, activity_private boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.display_name, p.avatar_url, p.location, p.username, p.activity_private
  FROM public.follows f
  JOIN public.profiles p ON p.id = f.follower_id
  WHERE f.following_id = _user_id AND f.status = 'accepted'
    AND NOT EXISTS (
      SELECT 1 FROM public.user_blocks ub
      WHERE (ub.blocker_id = auth.uid() AND ub.blocked_id = p.id)
         OR (ub.blocker_id = p.id AND ub.blocked_id = auth.uid())
    );
$$;

CREATE FUNCTION public.get_following(_user_id uuid)
RETURNS TABLE(id uuid, display_name text, avatar_url text, location text, username text, activity_private boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.display_name, p.avatar_url, p.location, p.username, p.activity_private
  FROM public.follows f
  JOIN public.profiles p ON p.id = f.following_id
  WHERE f.follower_id = _user_id AND f.status = 'accepted'
    AND NOT EXISTS (
      SELECT 1 FROM public.user_blocks ub
      WHERE (ub.blocker_id = auth.uid() AND ub.blocked_id = p.id)
         OR (ub.blocker_id = p.id AND ub.blocked_id = auth.uid())
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.search_public_profiles(text, integer) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_followers(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_following(uuid) TO authenticated;
