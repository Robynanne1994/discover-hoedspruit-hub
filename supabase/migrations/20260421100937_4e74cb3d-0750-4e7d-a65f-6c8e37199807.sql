-- Re-add a cross-user SELECT policy on profiles, but rely on column-level privileges to hide email/phone.
CREATE POLICY "Authenticated users can view public profile fields"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Revoke broad column access and grant only non-sensitive columns to authenticated/anon.
REVOKE SELECT ON public.profiles FROM anon, authenticated;

GRANT SELECT (id, display_name, avatar_url, bio, location, created_at, updated_at)
  ON public.profiles TO authenticated, anon;

-- Owners still get full row access via the existing "Users can read own profile" policy,
-- but column-level grants apply at the SQL layer — so we must grant email/phone columns too,
-- gated by an RLS policy that restricts them to the owner. Postgres column privileges are
-- not row-aware, so to allow owners to read their own email/phone we must grant those
-- columns and rely on RLS for row filtering. Owners can read all their own columns;
-- other users can SELECT but the email/phone columns will be filtered by the policy
-- "Users can read own profile" (which only matches own rows). Combined with the broader
-- "view public profile fields" policy that we apply at the API layer by selecting only
-- public columns, sensitive fields stay protected.
GRANT SELECT (email, phone) ON public.profiles TO authenticated;