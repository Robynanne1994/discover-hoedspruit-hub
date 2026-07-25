
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS specials_updates boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS specials_updates_scope text NOT NULL DEFAULT 'all';

DO $$ BEGIN
  ALTER TABLE public.notification_preferences
    ADD CONSTRAINT notification_preferences_specials_updates_scope_check
    CHECK (specials_updates_scope IN ('all','saved'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.notify_special_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.title IS NOT DISTINCT FROM OLD.title
     AND NEW.description IS NOT DISTINCT FROM OLD.description
     AND NEW.deal_label IS NOT DISTINCT FROM OLD.deal_label
     AND NEW.price IS NOT DISTINCT FROM OLD.price
     AND NEW.original_price IS NOT DISTINCT FROM OLD.original_price
     AND NEW.valid_from IS NOT DISTINCT FROM OLD.valid_from
     AND NEW.valid_until IS NOT DISTINCT FROM OLD.valid_until
     AND NEW.terms IS NOT DISTINCT FROM OLD.terms
     AND NEW.promo_code IS NOT DISTINCT FROM OLD.promo_code
     AND NEW.tag IS NOT DISTINCT FROM OLD.tag
     AND NEW.is_active IS NOT DISTINCT FROM OLD.is_active THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.business_notifications
    (user_id, kind, status, title, body, link, ref_table, ref_id)
  SELECT
    np.user_id,
    'special_update',
    'unread',
    'Special updated: ' || NEW.title,
    'There has been an update to ' || NEW.title || '. Tap to see what''s changed.',
    '/specials/' || NEW.id::text,
    'specials',
    NEW.id
  FROM public.notification_preferences np
  WHERE np.push_enabled
    AND np.specials_updates
    AND (
      np.specials_updates_scope = 'all'
      OR EXISTS (
        SELECT 1 FROM public.favourites f
        WHERE f.user_id = np.user_id
          AND f.item_type = 'special'
          AND f.item_id = NEW.id
      )
    );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_special_update ON public.specials;
CREATE TRIGGER trg_notify_special_update
AFTER UPDATE ON public.specials
FOR EACH ROW
EXECUTE FUNCTION public.notify_special_update();

-- Keep event update body copy consistent with new spec
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
