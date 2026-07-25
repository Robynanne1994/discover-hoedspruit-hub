ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS events_updates_scope text NOT NULL DEFAULT 'all'
  CHECK (events_updates_scope IN ('all','saved'));

CREATE OR REPLACE FUNCTION public.notify_event_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.title IS NOT DISTINCT FROM OLD.title
     AND NEW.description IS NOT DISTINCT FROM OLD.description
     AND NEW.date IS NOT DISTINCT FROM OLD.date
     AND NEW.start_time IS NOT DISTINCT FROM OLD.start_time
     AND NEW.end_time IS NOT DISTINCT FROM OLD.end_time
     AND NEW.location IS NOT DISTINCT FROM OLD.location
     AND NEW.tag IS NOT DISTINCT FROM OLD.tag THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.business_notifications
    (user_id, kind, status, title, body, link, ref_table, ref_id)
  SELECT
    np.user_id,
    'event_update',
    'unread',
    'Event updated: ' || NEW.title,
    'There has been an update to ' || NEW.title || '. Tap to see what''s changed.',
    '/events/' || NEW.id::text,
    'events',
    NEW.id
  FROM public.notification_preferences np
  WHERE np.push_enabled
    AND np.events_updates
    AND (
      np.events_updates_scope = 'all'
      OR EXISTS (
        SELECT 1 FROM public.favourites f
        WHERE f.user_id = np.user_id
          AND f.item_type = 'event'
          AND f.item_id = NEW.id
      )
    );
  RETURN NEW;
END;
$$;