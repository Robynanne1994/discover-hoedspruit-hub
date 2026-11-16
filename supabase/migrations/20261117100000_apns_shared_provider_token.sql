-- One APNs provider token shared by every send-push call.
--
-- Apple wants the provider (JWT) token reused for 20–60 minutes and answers
-- 429 TooManyProviderTokenUpdates when it changes more often. send-push signed
-- a fresh token on every call, and since each notification is its own call, a
-- broadcast fired dozens at once: in a 21-notification burst test Apple refused
-- 14. claim_apns_token() lets all calls agree on a single token.
--
-- Only service_role (the edge function) can read or write any of this.

CREATE TABLE IF NOT EXISTS public.apns_token_cache (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  token text NOT NULL,
  key_id text NOT NULL,
  issued_at timestamptz NOT NULL
);

ALTER TABLE public.apns_token_cache ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.apns_token_cache FROM PUBLIC, anon, authenticated;

-- Offer a freshly signed candidate. It is stored only when there is no token
-- yet, the stored one is older than _max_age_seconds, or it was signed by a
-- different key (APNS_KEY_ID changed). Returns the token everyone should use.
-- The conditional upsert takes a row lock, so concurrent callers serialise and
-- all but the first get the winner's token back.
CREATE OR REPLACE FUNCTION public.claim_apns_token(
  _candidate text,
  _key_id text,
  _max_age_seconds integer DEFAULT 2400
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_token text;
BEGIN
  INSERT INTO public.apns_token_cache AS c (id, token, key_id, issued_at)
  VALUES (1, _candidate, _key_id, now())
  ON CONFLICT (id) DO UPDATE
    SET token = excluded.token, key_id = excluded.key_id, issued_at = excluded.issued_at
    WHERE c.key_id IS DISTINCT FROM excluded.key_id
       OR c.issued_at < now() - make_interval(secs => _max_age_seconds)
  RETURNING c.token INTO v_token;

  IF v_token IS NULL THEN
    SELECT token INTO v_token FROM public.apns_token_cache WHERE id = 1;
  END IF;
  RETURN v_token;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_apns_token(text, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_apns_token(text, text, integer) TO service_role;
