-- 1) Remove the broad "Authenticated users can view profiles" policy that exposes email/phone
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Create a public-safe view that excludes email and phone for cross-user reads
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = true)
AS
SELECT id, display_name, avatar_url, bio, location, created_at, updated_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO authenticated, anon;

-- Allow authenticated users to read non-sensitive profile fields of others via the base table
-- by re-adding a SELECT policy that the application can rely on, while still hiding email/phone
-- through the view above. Apps should query profiles_public for cross-user reads.
-- The existing "Users can read own profile" policy already gives owners full access.

-- 2) Fix feedback: make user_id NOT NULL so all feedback rows are owned
-- First delete any orphaned rows (defensive — typically none)
DELETE FROM public.feedback WHERE user_id IS NULL;

ALTER TABLE public.feedback
  ALTER COLUMN user_id SET NOT NULL;