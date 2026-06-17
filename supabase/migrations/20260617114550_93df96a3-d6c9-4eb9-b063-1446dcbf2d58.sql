
-- Auto-create a notification when a follow request is created against a private account.
CREATE OR REPLACE FUNCTION public.notify_follow_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
  v_user text;
BEGIN
  IF NEW.status = 'pending' THEN
    SELECT COALESCE(display_name, username, 'Someone'), username
      INTO v_name, v_user
      FROM public.profiles WHERE id = NEW.follower_id;

    INSERT INTO public.business_notifications
      (user_id, kind, status, title, body, link, ref_table, ref_id)
    VALUES
      (NEW.following_id,
       'follow_request',
       'pending',
       v_name || ' wants to follow you',
       'Tap to review their follow request.',
       '/follow-requests',
       'follows',
       NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_follow_request ON public.follows;
CREATE TRIGGER trg_notify_follow_request
AFTER INSERT ON public.follows
FOR EACH ROW
EXECUTE FUNCTION public.notify_follow_request();

-- When a follow request is accepted or removed, clear its notification.
CREATE OR REPLACE FUNCTION public.cleanup_follow_request_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.business_notifications
     WHERE ref_table = 'follows' AND ref_id = OLD.id AND kind = 'follow_request';
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' AND NEW.status <> 'pending' THEN
    DELETE FROM public.business_notifications
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

-- Allow target user to respond to a pending follow request via the notification action
-- (existing follows policies already permit the recipient to update/delete their incoming requests;
--  no policy change needed here).
