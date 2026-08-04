-- Six-digit verification codes the app issues and checks itself.
--
-- WHY THIS EXISTS
-- ---------------
-- Until now both "prove your new email address" flows leant on Supabase Auth's
-- own one-time codes, delivered by whatever email template the project happens
-- to have. That is a dependency on a dashboard setting no code in this repo can
-- reach, and when it is wrong the failure is silent and total: the stock
-- template is link-only, so the email arrives with a button and no code at all,
-- while the app sits on a screen asking for six digits that were never sent.
-- Worse, the button in that email is a generic `/auth/v1/verify` redirect — it
-- comes back into the app looking exactly like a password-reset link.
--
-- So the app now mints, stores and checks the codes itself, and sends them
-- through the same email sender the rest of the app uses. The email always
-- contains the code, because the code is the only thing in it.
--
-- Only the service role ever touches this table: codes are issued and redeemed
-- inside the `account-email` edge function, never from the client.

CREATE TABLE IF NOT EXISTS public.email_verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- The account the code belongs to. Cascade: an abandoned signup that gets
  -- cleaned up should not leave its codes behind.
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- The address being proved. For a change of email this is the NEW address,
  -- which is deliberately not yet on the account.
  email text NOT NULL,
  purpose text NOT NULL CHECK (purpose IN ('signup', 'email_change')),
  -- SHA-256 of the code with a server-side pepper. The code itself is never
  -- stored: six digits is little enough entropy that a leaked table would
  -- otherwise be a leaked set of codes.
  code_hash text NOT NULL,
  -- Wrong guesses so far. A code is burnt once this passes the cap, so the
  -- 10^6 space can't be walked.
  attempts integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  -- When the code was last emailed, for the one-a-minute send limit.
  last_sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.email_verification_codes TO service_role;

ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;

-- No policy for anon or authenticated: a client that could read this table
-- could read the codes' metadata, and one that could write it could confirm an
-- address it does not own. Everything goes through the edge function.
DO $$ BEGIN
  CREATE POLICY "Service role manages verification codes"
    ON public.email_verification_codes FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- The lookup every verify does: the live code for this account and purpose.
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_open
  ON public.email_verification_codes (user_id, purpose, created_at DESC)
  WHERE consumed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_email_verification_codes_email
  ON public.email_verification_codes (lower(email));

CREATE INDEX IF NOT EXISTS idx_email_verification_codes_expires
  ON public.email_verification_codes (expires_at);

-- ---------------------------------------------------------------------------
-- Looking an address up in auth.users
-- ---------------------------------------------------------------------------
-- The signup flow has to answer three questions before it does anything:
-- does this address already have an account, has that account confirmed
-- itself, and what is its id. auth.users is the only place that knows, and the
-- admin REST API cannot filter by email without paging the whole user list.
--
-- service_role only. This returns strictly more than the public
-- `account_exists_for_email` (which is a bare boolean by design), so it must
-- never be reachable from a browser.
CREATE OR REPLACE FUNCTION public.auth_user_for_email(_email text)
RETURNS TABLE (user_id uuid, is_confirmed boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.email_confirmed_at IS NOT NULL
  FROM auth.users u
  WHERE _email IS NOT NULL
    AND trim(_email) <> ''
    AND lower(u.email) = lower(trim(_email))
    AND u.deleted_at IS NULL
  ORDER BY u.created_at
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.auth_user_for_email(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auth_user_for_email(text) TO service_role;

-- ---------------------------------------------------------------------------
-- Housekeeping
-- ---------------------------------------------------------------------------
-- Spent and expired codes are of no further use; the edge function calls this
-- on every issue so the table stays small without needing a scheduled job.
CREATE OR REPLACE FUNCTION public.purge_expired_verification_codes()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.email_verification_codes
  WHERE expires_at < now() - interval '1 day'
     OR (consumed_at IS NOT NULL AND consumed_at < now() - interval '1 day');
$$;

REVOKE EXECUTE ON FUNCTION public.purge_expired_verification_codes() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_expired_verification_codes() TO service_role;

NOTIFY pgrst, 'reload schema';
