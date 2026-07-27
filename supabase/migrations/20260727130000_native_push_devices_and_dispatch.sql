-- Native push notifications: device registry + automatic dispatch.
--
-- The app already writes an in-app row to public.business_notifications for
-- every alert a user has opted into. This migration turns each of those rows
-- into a real phone push:
--
--   1. public.push_devices        — one row per device token per user (FCM on
--                                    Android, APNs on iOS), written by the app
--                                    through the register_push_device() RPC.
--   2. dispatch_push_notification — AFTER INSERT trigger on
--                                    business_notifications that calls the
--                                    'send-push' edge function (via pg_net) for
--                                    every row whose push flag is true. Because
--                                    rows are only inserted for users who opted
--                                    in, this automatically respects every
--                                    preference toggle — no extra gating needed.
--
-- Configuration (URL + service role key) is read from Supabase Vault so no
-- secret is committed here. See MOBILE_PUSH_SETUP.md for the one-time setup.

-- ---------------------------------------------------------------------------
-- 1. Device registry
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.push_devices (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token      text NOT NULL UNIQUE,
  platform   text NOT NULL DEFAULT 'unknown',   -- 'ios' | 'android' | 'unknown'
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_devices_user ON public.push_devices(user_id);

ALTER TABLE public.push_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_devices_select_own" ON public.push_devices;
CREATE POLICY "push_devices_select_own" ON public.push_devices
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_devices_delete_own" ON public.push_devices;
CREATE POLICY "push_devices_delete_own" ON public.push_devices
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Inserts/updates go through the SECURITY DEFINER RPC below so a device that
-- moves from one signed-in user to another (shared phone) is reassigned
-- cleanly without tripping row-ownership checks.

-- ---------------------------------------------------------------------------
-- 2. Registration RPC (called by the mobile app on launch / token refresh)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_push_device(_token text, _platform text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _token IS NULL OR length(trim(_token)) = 0 THEN
    RAISE EXCEPTION 'Token required';
  END IF;

  INSERT INTO public.push_devices (user_id, token, platform, last_seen)
  VALUES (auth.uid(), _token, COALESCE(NULLIF(_platform, ''), 'unknown'), now())
  ON CONFLICT (token) DO UPDATE
    SET user_id   = auth.uid(),
        platform  = EXCLUDED.platform,
        last_seen = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_push_device(text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Dispatch: new pushable notification -> send-push edge function
-- ---------------------------------------------------------------------------
-- pg_net gives Postgres an async HTTP client. It ships with Supabase; the
-- CREATE is a no-op if it is already installed.
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

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
  -- Only rows explicitly flagged for push (the column defaults to true, and
  -- app-update broadcasts set it per-user from the recipient's preferences).
  IF NEW.push IS DISTINCT FROM true THEN
    RETURN NEW;
  END IF;

  -- Read config from Vault. Until these secrets exist the trigger is inert,
  -- so applying this migration never breaks inserts.
  BEGIN
    SELECT decrypted_secret INTO v_url
      FROM vault.decrypted_secrets WHERE name = 'edge_send_push_url' LIMIT 1;
    SELECT decrypted_secret INTO v_key
      FROM vault.decrypted_secrets WHERE name = 'edge_service_role_key' LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    RETURN NEW;  -- Vault not available yet; skip silently.
  END;

  IF v_url IS NULL OR v_key IS NULL THEN
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

DROP TRIGGER IF EXISTS trg_dispatch_push_notification ON public.business_notifications;
CREATE TRIGGER trg_dispatch_push_notification
AFTER INSERT ON public.business_notifications
FOR EACH ROW
EXECUTE FUNCTION public.dispatch_push_notification();
