-- Username uniqueness check.
--
-- Direct SELECT on public.profiles is locked down by RLS (only owners can read
-- their own row) and column privileges, so the client cannot reliably check
-- whether a username is already taken by *another* user. This SECURITY DEFINER
-- function performs the check server-side and returns only a boolean, so no
-- profile data is exposed. The match is case-insensitive to mirror the
-- profiles_username_unique_ci index on lower(username).

CREATE OR REPLACE FUNCTION public.is_username_available(_username text, _exclude_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE _username IS NOT NULL
      AND trim(_username) <> ''
      AND lower(username) = lower(trim(_username))
      AND (_exclude_id IS NULL OR id <> _exclude_id)
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_username_available(text, uuid) TO anon, authenticated;
