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
    DELETE FROM public.business_notifications
     WHERE ref_table = 'follows' AND ref_id = OLD.id AND kind IN ('follow_request','follow_request_accepted');
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
      -- Any other non-pending status (e.g., rejected): remove the request notification
      DELETE FROM public.business_notifications
       WHERE ref_table = 'follows' AND ref_id = NEW.id AND kind = 'follow_request';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;