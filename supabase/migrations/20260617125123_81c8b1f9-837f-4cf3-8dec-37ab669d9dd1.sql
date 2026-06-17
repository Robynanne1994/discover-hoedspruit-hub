
CREATE OR REPLACE FUNCTION public.cleanup_follow_request_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_name text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.business_notifications
     WHERE ref_table = 'follows' AND ref_id = OLD.id AND kind = 'follow_request';
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' AND NEW.status <> 'pending' THEN
    DELETE FROM public.business_notifications
     WHERE ref_table = 'follows' AND ref_id = NEW.id AND kind = 'follow_request';

    -- Notify the original requester when the follow request is accepted
    IF NEW.status = 'accepted' AND COALESCE(OLD.status, '') = 'pending' THEN
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
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
