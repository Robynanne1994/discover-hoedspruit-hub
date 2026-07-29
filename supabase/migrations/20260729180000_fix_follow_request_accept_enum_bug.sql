-- Accepting a follow request was impossible: every accept aborted with a
-- Postgres error before the follows row could change.
--
-- The AFTER UPDATE trigger cleanup_follow_request_notification() contained:
--
--     IF NEW.status = 'accepted' AND COALESCE(OLD.status,'') = 'pending' THEN
--
-- OLD.status is of enum type public.follow_status, so the '' literal in the
-- COALESCE is coerced to that enum. Postgres folds that constant while planning
-- the expression, which raises
--
--     22P02: invalid input value for enum follow_status: ""
--
-- unconditionally — the branch never even gets a chance to run. The exception
-- propagated out of the trigger, rolled back respond_to_follow_request()'s
-- UPDATE, and came back to the client as a plain RPC error. All three
-- accept/decline call sites swallow errors silently (`if (error) return`), so
-- from the user's side the Accept button simply did nothing: the request stayed
-- pending, the follower count never moved, and the requester was never told.
--
-- The COALESCE was pointless to begin with (follows.status is NOT NULL). This
-- migration rewrites the trigger without it, and while here brings the live
-- database in line with the two migrations that were committed but never
-- applied to it:
--
--   * 20260722110000 — notifications are permanent history: a resolved follow
--     request is converted into a 'follow_request_accepted' /
--     'follow_request_declined' / 'follow_request_withdrawn' record instead of
--     being deleted outright.
--   * 20260727120000 — notify_follow_request() respects the recipient's
--     push_enabled + community_follow_requests toggles, and notify_new_follower()
--     posts a 'new_follower' notification when a public account gains a follower.
--
-- Also hardens respond_to_follow_request(): it now locks the row, treats an
-- already-resolved request as a harmless no-op (double-tap / stale card) and
-- raises typed errors the client can surface.

-- ---------------------------------------------------------------------------
-- 1. The actual bug: follow request resolution trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_follow_request_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
  v_follower_name text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'pending' THEN
      SELECT COALESCE(display_name, username, 'Someone')
        INTO v_follower_name
        FROM public.profiles WHERE id = OLD.follower_id;
      v_follower_name := COALESCE(v_follower_name, 'Someone');

      IF auth.uid() = OLD.following_id THEN
        -- Recipient declined the request: keep the notification as history.
        UPDATE public.business_notifications
           SET kind = 'follow_request_declined',
               title = 'You declined ' || v_follower_name || '''s follow request',
               body = 'Their follow request was declined.',
               link = '/profile/' || OLD.follower_id::text,
               status = 'read',
               is_read = true
         WHERE ref_table = 'follows' AND ref_id = OLD.id AND kind = 'follow_request';
      ELSE
        -- Requester withdrew the request before it was answered.
        UPDATE public.business_notifications
           SET kind = 'follow_request_withdrawn',
               title = v_follower_name || '''s follow request was withdrawn',
               body = 'They withdrew their follow request.',
               link = NULL,
               status = 'read',
               is_read = true
         WHERE ref_table = 'follows' AND ref_id = OLD.id AND kind = 'follow_request';
      END IF;
    END IF;
    -- Accepted-follow history (follow_request_accepted / follow_accepted)
    -- stays in place even when the follow is later removed.
    RETURN OLD;

  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    SELECT COALESCE(display_name, username, 'Someone')
      INTO v_follower_name
      FROM public.profiles WHERE id = NEW.follower_id;
    v_follower_name := COALESCE(v_follower_name, 'Someone');

    -- Convert the recipient's own follow_request notification into an accepted record.
    UPDATE public.business_notifications
       SET kind = 'follow_request_accepted',
           title = 'You accepted ' || v_follower_name || '''s follow request',
           body = 'They are now following you.',
           link = '/profile/' || NEW.follower_id::text,
           status = 'read',
           is_read = true
     WHERE ref_table = 'follows'
       AND ref_id = NEW.id
       AND kind = 'follow_request';

    -- Tell the original requester their request went through.
    SELECT COALESCE(display_name, username, 'Someone')
      INTO v_name
      FROM public.profiles WHERE id = NEW.following_id;
    v_name := COALESCE(v_name, 'Someone');

    INSERT INTO public.business_notifications
      (user_id, kind, status, title, body, link, ref_table, ref_id)
    VALUES
      (NEW.follower_id,
       'follow_accepted',
       'unread',
       v_name || ' accepted your follow request',
       'You are now following them.',
       '/profile/' || NEW.following_id::text,
       'follows',
       NEW.id);

  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status <> 'pending' THEN
    -- Any other resolution of a pending request: keep it as a declined record.
    SELECT COALESCE(display_name, username, 'Someone')
      INTO v_follower_name
      FROM public.profiles WHERE id = NEW.follower_id;
    v_follower_name := COALESCE(v_follower_name, 'Someone');

    UPDATE public.business_notifications
       SET kind = 'follow_request_declined',
           title = 'You declined ' || v_follower_name || '''s follow request',
           body = 'Their follow request was declined.',
           link = '/profile/' || NEW.follower_id::text,
           status = 'read',
           is_read = true
     WHERE ref_table = 'follows' AND ref_id = NEW.id AND kind = 'follow_request';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cleanup_follow_request_notification ON public.follows;
CREATE TRIGGER trg_cleanup_follow_request_notification
AFTER UPDATE OR DELETE ON public.follows
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_follow_request_notification();

-- ---------------------------------------------------------------------------
-- 2. Follow-request notification honours the recipient's preferences
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

DROP TRIGGER IF EXISTS trg_notify_follow_request ON public.follows;
CREATE TRIGGER trg_notify_follow_request
AFTER INSERT ON public.follows
FOR EACH ROW
EXECUTE FUNCTION public.notify_follow_request();

-- ---------------------------------------------------------------------------
-- 3. New follower notification for public accounts
-- ---------------------------------------------------------------------------
-- Private-account follows arrive as 'pending' and become 'accepted' via UPDATE,
-- so this AFTER INSERT trigger cannot double-fire for them.
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

-- ---------------------------------------------------------------------------
-- 4. Harden the accept/decline RPC
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.respond_to_follow_request(_request_id uuid, _accept boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_following_id uuid;
  v_status public.follow_status;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT following_id, status
    INTO v_following_id, v_status
    FROM public.follows
    WHERE id = _request_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Follow request not found' USING ERRCODE = 'P0002';
  END IF;

  -- Only the account being followed may respond to its own incoming request.
  IF v_following_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to respond to this follow request' USING ERRCODE = '42501';
  END IF;

  -- Already resolved (double-tap, or a stale card from another device):
  -- harmless no-op rather than firing the resolution trigger a second time.
  IF v_status <> 'pending' THEN
    RETURN;
  END IF;

  IF _accept THEN
    UPDATE public.follows
       SET status = 'accepted', responded_at = now()
     WHERE id = _request_id;
  ELSE
    DELETE FROM public.follows WHERE id = _request_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.respond_to_follow_request(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.respond_to_follow_request(uuid, boolean) TO authenticated;
