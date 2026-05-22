
-- ============ PROFILES ============
DROP POLICY IF EXISTS "Authenticated users can view public profile fields" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.get_public_profiles(_ids uuid[])
RETURNS TABLE (
  id uuid,
  display_name text,
  avatar_url text,
  location text,
  username text,
  bio text,
  activity_private boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, display_name, avatar_url, location, username, bio, activity_private
  FROM public.profiles
  WHERE id = ANY(_ids);
$$;

REVOKE EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) TO anon, authenticated;

-- ============ BEEN_HERE ============
DROP POLICY IF EXISTS "Been here counts are public" ON public.been_here;

CREATE POLICY "Admins can view all been_here"
ON public.been_here
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.get_been_here_count(_listing_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::int FROM public.been_here WHERE listing_id = _listing_id;
$$;

REVOKE EXECUTE ON FUNCTION public.get_been_here_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_been_here_count(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_user_been_here(_user_id uuid)
RETURNS TABLE (listing_id uuid, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT bh.listing_id, bh.created_at
  FROM public.been_here bh
  JOIN public.profiles p ON p.id = bh.user_id
  WHERE bh.user_id = _user_id
    AND COALESCE(p.activity_private, false) = false;
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_been_here(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_been_here(uuid) TO anon, authenticated;

-- ============ SECURITY DEFINER hardening ============
-- has_role is only used inside RLS expressions (evaluated by the table owner); no client needs to call it.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
-- handle_new_user only runs as an auth trigger
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
