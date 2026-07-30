-- Re-ship the phone/email availability RPCs, and keep profiles.email in step
-- with the address Supabase Auth actually holds.
--
-- WHY THIS FILE EXISTS
-- --------------------
-- 20260727120000_is_phone_email_available.sql never reached the database. Two
-- migrations were committed with the *same* version prefix — 20260727120000 —
-- and the migration runner keys its history on that version, so only one of the
-- pair was ever applied. The loser was the availability RPCs, which is why
-- Account Info fails with:
--
--   Could not find the function public.is_email_available(_email, _exclude_id)
--   in the schema cache
--
-- as soon as you try to save a changed email address. This migration carries a
-- unique version, so it applies cleanly, and every statement in it is
-- idempotent — it is safe to run in an environment where the original did land.
-- The colliding file has been deleted, since everything in it is repeated here.
--
-- Keep migration versions unique. `ls supabase/migrations | sed 's/_.*//' |
-- sort | uniq -d` should print nothing.

-- ---------------------------------------------------------------------------
-- 1. Availability RPCs
-- ---------------------------------------------------------------------------
-- RLS only lets a user read their own profile row, so a client-side
-- `.neq("id", user.id)` lookup can never see another account's clash — it comes
-- back empty and duplicates slip through. These SECURITY DEFINER functions run
-- the check server-side and return nothing but a boolean.
--
-- The email check also consults auth.users, which is the real authority on who
-- owns an address: a profile row can lag behind (an unverified email change is
-- pending, an older account never saved its profile), but auth.users cannot.

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
  )
  AND NOT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE _email IS NOT NULL
      AND trim(_email) <> ''
      AND lower(trim(email)) = lower(trim(_email))
      AND (_exclude_id IS NULL OR id <> _exclude_id)
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_phone_available(text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_email_available(text, uuid) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. New profiles carry their email, username and residency from signup
-- ---------------------------------------------------------------------------
-- With email confirmation switched on there is no session until the user has
-- typed the code from their inbox, so the client can no longer write the
-- username and residency straight after signUp(). They ride along in the signup
-- metadata instead and are applied here.
--
-- The username is deliberately NOT claimed while the account is unconfirmed.
-- Someone who mistypes their email at signup has to go back and start again
-- with a working address, and the abandoned attempt must not be sitting on the
-- handle they are trying to re-use. Section 3 claims it the moment the address
-- is confirmed. A username that has been taken in the meantime is dropped
-- rather than failing the confirmation; the user can pick another one in
-- Account Info, and the unique index stays the final guard either way.

CREATE OR REPLACE FUNCTION public.apply_signup_metadata(
  _user_id uuid,
  _metadata jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username text := NULLIF(trim(_metadata->>'username'), '');
  v_location text := NULLIF(trim(_metadata->>'location'), '');
BEGIN
  IF v_username IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(username) = lower(v_username) AND id <> _user_id
  ) THEN
    v_username := NULL;
  END IF;

  UPDATE public.profiles
  SET username = COALESCE(username, v_username),
      location = COALESCE(location, v_location)
  WHERE id = _user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.apply_signup_metadata(uuid, jsonb) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_first text := NULLIF(trim(NEW.raw_user_meta_data->>'first_name'), '');
  v_surname text := NULLIF(trim(NEW.raw_user_meta_data->>'surname'), '');
  v_display text := NULLIF(trim(NEW.raw_user_meta_data->>'display_name'), '');
BEGIN
  INSERT INTO public.profiles (id, first_name, surname, display_name, email)
  VALUES (
    NEW.id,
    v_first,
    v_surname,
    COALESCE(
      v_display,
      NULLIF(trim(concat_ws(' ', v_first, v_surname)), ''),
      split_part(NEW.email, '@', 1)
    ),
    NEW.email
  );

  -- Confirmation off (or an already-confirmed provider signup): nothing to
  -- wait for, so claim the handle straight away.
  IF NEW.email_confirmed_at IS NOT NULL THEN
    PERFORM public.apply_signup_metadata(NEW.id, NEW.raw_user_meta_data);
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Keep profiles in step with auth.users
-- ---------------------------------------------------------------------------
-- Two things to mirror:
--   * A verified email change updates auth.users.email. Copying it across means
--     the profile never shows a stale address even if the app is closed
--     mid-flow, and is_email_available keeps telling the truth.
--   * Confirming the address is what turns a signup attempt into a real
--     account, so that is the moment the chosen username and residency are
--     applied.

CREATE OR REPLACE FUNCTION public.sync_profile_from_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE public.profiles SET email = NEW.email WHERE id = NEW.id;
  END IF;

  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    PERFORM public.apply_signup_metadata(NEW.id, NEW.raw_user_meta_data);
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sync_profile_from_auth_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_email_changed ON auth.users;
CREATE TRIGGER on_auth_user_email_changed
  AFTER UPDATE OF email, email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_from_auth_user();

-- Backfill the profiles that predate any of this, so the uniqueness check can
-- see every address already in use.
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND u.email IS NOT NULL
  AND p.email IS DISTINCT FROM u.email;

-- PostgREST caches the list of callable functions; without this the new RPCs
-- stay invisible until the next automatic reload.
NOTIFY pgrst, 'reload schema';
