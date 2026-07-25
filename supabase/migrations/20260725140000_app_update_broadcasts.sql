-- Admin "App Updates & Notifications" broadcasts.
--
-- Robyn (admin) can compose an app update / announcement and send it to every
-- app user. The model matches how the rest of the app works: a row in
-- business_notifications IS the in-app notification (it drives the red dot and
-- shows in the Notifications tab).
--
-- Rules the admin feature enforces:
--   * EVERY user always gets a business_notifications row for a broadcast, so
--     the announcement always shows in their Notifications section with the
--     unread red dot -- regardless of their preferences.
--   * Whether the announcement is ALSO pushed to their phone is governed by the
--     user's "App Updates & News" toggle (notification_preferences.hh_app_updates)
--     together with their master push toggle (push_enabled). That intent is
--     recorded on the notification row via the new business_notifications.push
--     column so the device-push layer can honour it.
--
-- "App Updates & News" is on by default from now on.

-- ---------------------------------------------------------------------------
-- 1. "App Updates & News" defaults ON.
-- ---------------------------------------------------------------------------
ALTER TABLE public.notification_preferences
  ALTER COLUMN hh_app_updates SET DEFAULT true;

-- Bring existing users in line with the new default. This is a brand-new
-- channel (no app updates have ever been sent), so everyone starts opted in;
-- users can still turn it off on the Notification Preferences screen.
UPDATE public.notification_preferences
   SET hh_app_updates = true
 WHERE hh_app_updates = false;

-- ---------------------------------------------------------------------------
-- 2. Record push intent on each notification row.
--    Defaults to true so all existing / content-driven notifications keep
--    their current behaviour; app-update broadcasts set it per-user.
-- ---------------------------------------------------------------------------
ALTER TABLE public.business_notifications
  ADD COLUMN IF NOT EXISTS push boolean NOT NULL DEFAULT true;

-- ---------------------------------------------------------------------------
-- 3. Broadcast history so the admin screen can list what has been sent.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_update_broadcasts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  body text,
  link text,
  sent_by uuid,
  recipient_count integer NOT NULL DEFAULT 0,
  pushed_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_update_broadcasts_created_at
  ON public.app_update_broadcasts(created_at DESC);

ALTER TABLE public.app_update_broadcasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage app update broadcasts" ON public.app_update_broadcasts;
CREATE POLICY "Admins manage app update broadcasts"
  ON public.app_update_broadcasts FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
