-- Make the push dispatcher say something when it cannot dispatch.
--
-- dispatch_push_notification() reads its target URL and service-role key from
-- Vault and, if either is missing, returns silently. That silence was
-- deliberate — applying the original migration must never break inserts into
-- business_notifications — but it also meant a project where the two Vault
-- secrets were never created looked completely healthy: notifications appeared
-- in-app, rows kept inserting, and no phone ever buzzed. Nothing anywhere said
-- why. This project ran that way from July to November.
--
-- Same control flow as before, so inserts still cannot fail. The difference is
-- that every skipped dispatch now writes a WARNING naming the missing piece,
-- which shows up in the Postgres logs and in Logs Explorer.
CREATE OR REPLACE FUNCTION public.dispatch_push_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_url text;
  v_key text;
BEGIN
  IF NEW.push IS DISTINCT FROM true THEN
    RETURN NEW;
  END IF;

  BEGIN
    SELECT decrypted_secret INTO v_url
      FROM vault.decrypted_secrets WHERE name = 'edge_send_push_url' LIMIT 1;
    SELECT decrypted_secret INTO v_key
      FROM vault.decrypted_secrets WHERE name = 'edge_service_role_key' LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'push dispatch skipped for notification %: vault unreadable (%)',
      NEW.id, SQLERRM;
    RETURN NEW;
  END;

  IF v_url IS NULL OR v_key IS NULL THEN
    RAISE WARNING 'push dispatch skipped for notification %: missing vault secret(s): %',
      NEW.id,
      concat_ws(', ',
        CASE WHEN v_url IS NULL THEN 'edge_send_push_url' END,
        CASE WHEN v_key IS NULL THEN 'edge_service_role_key' END);
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url     := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body    := jsonb_build_object('notification_id', NEW.id)
  );

  RETURN NEW;
END;
$$;
