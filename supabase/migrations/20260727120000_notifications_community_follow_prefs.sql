-- Make the "Community" notification toggles on the preferences screen actually
-- do something. Two settings were shipped in the UI but had no backing logic:
--
--   * "Follower Requests" (community_follow_requests) — the trigger that creates
--     the follow-request notification never looked at this toggle (or the master
--     push_enabled toggle), so it always fired regardless of the user's choice.
--
--   * "New Followers" (community_followers) — nothing ever created a
--     notification when someone followed you, so the toggle controlled nothing.
--
-- This migration:
--   1. Gates notify_follow_request() on the recipient's push_enabled AND
--      community_follow_requests preferences (defaulting to enabled when the
--      user has no preferences row yet, matching the rest of the system).
--   2. Adds notify_new_follower(): when a public account gains a follower (the
--      follow row is inserted directly as 'accepted'), the followed user gets a
--      'new_follower' notification, gated on push_enabled AND community_followers.
--      Private-account follows are UPDATEd from 'pending' to 'accepted' on
--      acceptance (not inserted as 'accepted'), so this does not double-fire —
--      the owner already actioned that request themselves.

-- ---------------------------------------------------------------------------
-- 1. Follow requests -> respect community_follow_requests + push_enabled
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_follow_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
  v_allowed boolean;
BEGIN
  IF NEW.status = 'pending' THEN
    SELECT (COALESCE(push_enabled, true) AND COALESCE(community_follow_requests, true))
      INTO v_allowed
      FROM public.notification_preferences
      WHERE user_id = NEW.following_id;
    -- No preferences row yet => fall back to the column defaults (enabled).
    IF NOT FOUND THEN
      v_allowed := true;
    END IF;

    IF v_allowed THEN
      SELECT COALESCE(display_name, username, 'Someone')
        INTO v_name
        FROM public.profiles WHERE id = NEW.follower_id;

      INSERT INTO public.business_notifications
        (user_id, kind, status, title, body, link, ref_table, ref_id)
      VALUES
        (NEW.following_id,
         'follow_request',
         'pending',
         COALESCE(v_name, 'Someone') || ' wants to follow you',
         'Tap to review their follow request.',
         '/follow-requests',
         'follows',
         NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger already exists (trg_notify_follow_request); leaving it in place.

-- ---------------------------------------------------------------------------
-- 2. New followers (public accounts) -> respect community_followers + push_enabled
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_new_follower()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
  v_allowed boolean;
BEGIN
  -- Only public accounts auto-accept on insert. Private-account requests arrive
  -- as 'pending' and are handled by the follow-request / accept flow instead.
  IF NEW.status = 'accepted' THEN
    SELECT (COALESCE(push_enabled, true) AND COALESCE(community_followers, true))
      INTO v_allowed
      FROM public.notification_preferences
      WHERE user_id = NEW.following_id;
    IF NOT FOUND THEN
      v_allowed := true;
    END IF;

    IF v_allowed THEN
      SELECT COALESCE(display_name, username, 'Someone')
        INTO v_name
        FROM public.profiles WHERE id = NEW.follower_id;

      INSERT INTO public.business_notifications
        (user_id, kind, status, title, body, link, ref_table, ref_id)
      VALUES
        (NEW.following_id,
         'new_follower',
         'unread',
         COALESCE(v_name, 'Someone') || ' started following you',
         'Tap to view their profile.',
         '/profile/' || NEW.follower_id::text,
         'follows',
         NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_follower ON public.follows;
CREATE TRIGGER trg_notify_new_follower
AFTER INSERT ON public.follows
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_follower();
