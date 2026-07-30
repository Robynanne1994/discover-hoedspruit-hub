-- "No account for that email" on the log-in screen.
--
-- supabase.auth.signInWithPassword() deliberately returns one opaque
-- "Invalid login credentials" error for a wrong password AND for an email that
-- has no account, so the sign-in screen cannot tell the two apart on its own.
-- This function answers that single question — and nothing else — so the app
-- can say "we couldn't find an account for this email" instead of leaving
-- someone retrying a password for an account that was never created.
--
-- It has to read auth.users, because that is the only source of truth for
-- "this email can log in":
--
--   * public.profiles.email is NOT written at signup — handle_new_user() only
--     stores names — so it stays NULL for everyone who never edited their
--     profile. is_email_available() alone would therefore report almost every
--     real log-in address as unused.
--   * auth.users is also what account deletion removes. Both delete paths (the
--     delete-account function a user runs on themselves, and admin-delete-user)
--     call auth.admin.deleteUser(), so the moment an account goes away its
--     email stops being associated with one and this returns false again.
--     Supabase's soft-delete (deleted_at) is excluded for the same reason.
--
-- Only a bare boolean crosses the wire; no user data is exposed. This does make
-- "is this address registered?" discoverable — a deliberate product trade-off,
-- and one is_email_available() already made. The check only runs after a failed
-- password attempt, which Supabase's own auth rate limiting governs.
CREATE OR REPLACE FUNCTION public.account_exists_for_email(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE _email IS NOT NULL
      AND trim(_email) <> ''
      AND lower(u.email) = lower(trim(_email))
      AND u.deleted_at IS NULL
  );
$$;

GRANT EXECUTE ON FUNCTION public.account_exists_for_email(text) TO anon, authenticated;

-- While we are here: teach the profile-side email check about auth.users too.
-- It previously looked at public.profiles alone, which (per the note above) is
-- blank for most accounts — so "that email is already in use" could never fire
-- against someone whose address only exists as their log-in email. Now both
-- places count, keeping "associated with an account" one consistent idea across
-- the app. _exclude_id still exempts the caller's own account on both sides, so
-- re-saving your own email is never flagged.
CREATE OR REPLACE FUNCTION public.is_email_available(_email text, _exclude_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE _email IS NOT NULL
      AND trim(_email) <> ''
      AND lower(trim(p.email)) = lower(trim(_email))
      AND (_exclude_id IS NULL OR p.id <> _exclude_id)
  )
  AND NOT EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE _email IS NOT NULL
      AND trim(_email) <> ''
      AND lower(u.email) = lower(trim(_email))
      AND u.deleted_at IS NULL
      AND (_exclude_id IS NULL OR u.id <> _exclude_id)
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_email_available(text, uuid) TO anon, authenticated;
