-- Authenticate the push trigger with a database-generated shared secret.
--
-- dispatch_push_notification() authenticated to send-push by sending a copy of
-- the service-role key it read from Vault (edge_service_role_key). The
-- project's keys were later rotated, the Vault copy went stale, and every push
-- since came back 401 {"error":"Unauthorized"}: notifications appeared in-app
-- but no phone buzzed. Lovable Cloud does not show the service-role key, so the
-- copy could not simply be refreshed.
--
-- Now the trigger sends x-push-secret: a random value generated here, stored in
-- Vault as push_webhook_secret, and checked by send-push through
-- verify_push_webhook_secret(), which only service_role may execute. Nobody
-- copies it anywhere and a key rotation cannot break it. The old bearer header
-- is still sent when the Vault copy exists, so nothing else changes.

-- 1. The secret. Created once; re-running this migration keeps the existing one.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'push_webhook_secret') THEN
    PERFORM vault.create_secret(
      replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
      'push_webhook_secret',
      'Shared secret dispatch_push_notification() sends to the send-push edge function'
    );
  END IF;
END
$$;

-- 2. The check send-push calls. Returns only true/false, never the secret.
CREATE OR REPLACE FUNCTION public.verify_push_webhook_secret(_secret text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT coalesce(_secret, '') <> '' AND EXISTS (
    SELECT 1 FROM vault.decrypted_secrets
     WHERE name = 'push_webhook_secret' AND decrypted_secret = _secret
  );
$$;

REVOKE ALL ON FUNCTION public.verify_push_webhook_secret(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_push_webhook_secret(text) TO service_role;

-- 3. The trigger function: same control flow (inserts can never fail), now
--    sending the shared secret. Only the URL is required.
CREATE OR REPLACE FUNCTION public.dispatch_push_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_url text;
  v_key text;
  v_secret text;
  v_headers jsonb;
BEGIN
  IF NEW.push IS DISTINCT FROM true THEN
    RETURN NEW;
  END IF;

  BEGIN
    SELECT decrypted_secret INTO v_url
      FROM vault.decrypted_secrets WHERE name = 'edge_send_push_url' LIMIT 1;
    SELECT decrypted_secret INTO v_key
      FROM vault.decrypted_secrets WHERE name = 'edge_service_role_key' LIMIT 1;
    SELECT decrypted_secret INTO v_secret
      FROM vault.decrypted_secrets WHERE name = 'push_webhook_secret' LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'push dispatch skipped for notification %: vault unreadable (%)',
      NEW.id, SQLERRM;
    RETURN NEW;
  END;

  IF v_url IS NULL OR (v_secret IS NULL AND v_key IS NULL) THEN
    RAISE WARNING 'push dispatch skipped for notification %: missing vault secret(s): %',
      NEW.id,
      concat_ws(', ',
        CASE WHEN v_url IS NULL THEN 'edge_send_push_url' END,
        CASE WHEN v_secret IS NULL AND v_key IS NULL THEN 'push_webhook_secret' END);
    RETURN NEW;
  END IF;

  v_headers := jsonb_build_object('Content-Type', 'application/json');
  IF v_secret IS NOT NULL THEN
    v_headers := v_headers || jsonb_build_object('x-push-secret', v_secret);
  END IF;
  IF v_key IS NOT NULL THEN
    v_headers := v_headers || jsonb_build_object('Authorization', 'Bearer ' || v_key);
  END IF;

  PERFORM net.http_post(
    url     := v_url,
    headers := v_headers,
    body    := jsonb_build_object('notification_id', NEW.id)
  );

  RETURN NEW;
END;
$$;
