
CREATE OR REPLACE FUNCTION public.search_public_profiles(_term text, _limit int DEFAULT 50)
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
  WHERE _term IS NULL
     OR _term = ''
     OR display_name ILIKE '%' || _term || '%'
     OR username ILIKE '%' || _term || '%'
  ORDER BY created_at DESC
  LIMIT GREATEST(_limit, 1);
$$;

REVOKE EXECUTE ON FUNCTION public.search_public_profiles(text, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_public_profiles(text, int) TO anon, authenticated;
