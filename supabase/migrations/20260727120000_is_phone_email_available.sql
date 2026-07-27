-- Phone and email uniqueness checks.
--
-- Same problem as is_username_available: a direct SELECT on public.profiles is
-- locked down by RLS (only owners can read their own row), so the client can
-- never see whether a phone number or email already belongs to *another* user.
-- The old client-side check queried profiles with .neq("id", user.id) — every
-- row it wanted was hidden by RLS, so the "already in use" branch was dead code
-- that could never fire and duplicate phone numbers slipped through.
--
-- These SECURITY DEFINER functions run the check server-side and return only a
-- boolean, so no profile data is exposed. Matching is case-insensitive on the
-- trimmed value to mirror the client's exact-string comparison.

CREATE OR REPLACE FUNCTION public.is_phone_available(_phone text, _exclude_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE _phone IS NOT NULL
      AND trim(_phone) <> ''
      AND lower(trim(phone)) = lower(trim(_phone))
      AND (_exclude_id IS NULL OR id <> _exclude_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_email_available(_email text, _exclude_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE _email IS NOT NULL
      AND trim(_email) <> ''
      AND lower(trim(email)) = lower(trim(_email))
      AND (_exclude_id IS NULL OR id <> _exclude_id)
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_phone_available(text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_email_available(text, uuid) TO anon, authenticated;
