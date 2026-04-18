-- Drop the overly permissive public SELECT policy that exposes email/phone
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.profiles;

-- Keep the existing "Users can read own profile" policy, and add a policy
-- so authenticated users can view other profiles (needed for community features
-- like People page, follower lists, user profiles).
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);