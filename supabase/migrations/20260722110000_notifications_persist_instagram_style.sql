-- Notifications are permanent history (Instagram-style): rows in
-- business_notifications are never deleted when the underlying follow row
-- changes. Instead they are converted to an inert record and marked read,
-- so the notifications tab keeps a full history.
CREATE OR REPLACE FUNCTION public.cleanup_follow_request_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  ELSIF TG_OP = 'UPDATE' AND NEW.status <> 'pending' THEN
    IF NEW.status = 'accepted' AND COALESCE(OLD.status,'') = 'pending' THEN
      SELECT COALESCE(display_name, username, 'Someone')
        INTO v_follower_name
        FROM public.profiles WHERE id = NEW.follower_id;

      -- Convert the recipient's follow_request notification into an accepted state
      UPDATE public.business_notifications
         SET kind = 'follow_request_accepted',
             title = 'You accepted ' || v_follower_name || '''s follow request',
             body = 'They are now following you.',
             link = '/profile/' || NEW.follower_id::text,
             status = 'unread',
             is_read = false
       WHERE ref_table = 'follows'
         AND ref_id = NEW.id
         AND kind = 'follow_request';

      -- Notify the original requester that their request was accepted
      SELECT COALESCE(display_name, username, 'Someone')
        INTO v_name
        FROM public.profiles WHERE id = NEW.following_id;
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
    ELSE
      -- Any other non-pending status (e.g. rejected): keep the notification,
      -- converted to a declined record.
      SELECT COALESCE(display_name, username, 'Someone')
        INTO v_follower_name
        FROM public.profiles WHERE id = NEW.follower_id;
      UPDATE public.business_notifications
         SET kind = 'follow_request_declined',
             title = 'You declined ' || COALESCE(v_follower_name, 'Someone') || '''s follow request',
             body = 'Their follow request was declined.',
             link = '/profile/' || NEW.follower_id::text,
             status = 'read',
             is_read = true
       WHERE ref_table = 'follows' AND ref_id = NEW.id AND kind = 'follow_request';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
