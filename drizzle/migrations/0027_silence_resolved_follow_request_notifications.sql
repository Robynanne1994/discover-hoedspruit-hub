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
      -- Declining or withdrawing a request needs no notification. Remove the
      -- original pending-request card for either resolution.
      DELETE FROM public.business_notifications
       WHERE user_id = OLD.following_id
         AND ref_table = 'follows'
         AND ref_id = OLD.id
         AND kind IN ('follow_request', 'follow_request_declined', 'follow_request_withdrawn');
    END IF;
    RETURN OLD;

  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    SELECT COALESCE(display_name, username, 'Someone')
      INTO v_follower_name
      FROM public.profiles WHERE id = NEW.follower_id;
    v_follower_name := COALESCE(v_follower_name, 'Someone');

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
    DELETE FROM public.business_notifications
     WHERE user_id = NEW.following_id
       AND ref_table = 'follows'
       AND ref_id = NEW.id
       AND kind IN ('follow_request', 'follow_request_declined', 'follow_request_withdrawn');
  END IF;

  RETURN NEW;
END;
$$;