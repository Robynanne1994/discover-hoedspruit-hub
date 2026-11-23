ALTER TABLE public.business_notifications ADD COLUMN IF NOT EXISTS push_sent_at timestamptz;
UPDATE public.business_notifications SET push_sent_at = created_at WHERE push_sent_at IS NULL;
CREATE INDEX IF NOT EXISTS business_notifications_pending_push_idx
  ON public.business_notifications (user_id, kind) WHERE push_sent_at IS NULL;

CREATE OR REPLACE FUNCTION public.is_batched_push_kind(_kind text)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path TO 'public' AS $$
  SELECT _kind IN ('listing_new','event_new','special_new','event_update','special_update')
$$;

CREATE OR REPLACE FUNCTION public.stamp_instant_push()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_batched_push_kind(NEW.kind) THEN NEW.push_sent_at := now(); END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_stamp_instant_push BEFORE INSERT ON public.business_notifications
  FOR EACH ROW EXECUTE FUNCTION public.stamp_instant_push();

DROP TRIGGER IF EXISTS trg_dispatch_push_notification ON public.business_notifications;
CREATE TRIGGER trg_dispatch_push_notification AFTER INSERT ON public.business_notifications
  FOR EACH ROW WHEN (NOT public.is_batched_push_kind(NEW.kind))
  EXECUTE FUNCTION public.dispatch_push_notification();
CREATE TRIGGER trg_dispatch_batched_push AFTER UPDATE OF push_sent_at ON public.business_notifications
  FOR EACH ROW WHEN (OLD.push_sent_at IS NULL AND NEW.push_sent_at IS NOT NULL AND public.is_batched_push_kind(NEW.kind))
  EXECUTE FUNCTION public.dispatch_push_notification();

CREATE OR REPLACE FUNCTION public.dispatch_pending_pushes()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE n int;
BEGIN
  UPDATE public.business_notifications SET push_sent_at = now()
  WHERE push_sent_at IS NULL AND public.is_batched_push_kind(kind);
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;
REVOKE ALL ON FUNCTION public.dispatch_pending_pushes() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE f text; d text;
BEGIN
  FOREACH f IN ARRAY ARRAY['notify_new_listings_batch','notify_new_events_batch','notify_new_specials_batch'] LOOP
    d := pg_get_functiondef(('public.' || f)::regproc);
    d := replace(d, E'AND NOT is_read\n        AND created_at > now() - interval ''30 minutes''', 'AND push_sent_at IS NULL');
    IF position('push_sent_at IS NULL' IN d) = 0 THEN RAISE EXCEPTION 'grouping window not found in %', f; END IF;
    EXECUTE d;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.notify_event_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT NEW.is_active OR (NOT OLD.is_active AND NEW.is_active) THEN RETURN NEW; END IF;
  IF NEW.title IS NOT DISTINCT FROM OLD.title AND NEW.description IS NOT DISTINCT FROM OLD.description
     AND NEW.date IS NOT DISTINCT FROM OLD.date AND NEW.start_time IS NOT DISTINCT FROM OLD.start_time
     AND NEW.end_time IS NOT DISTINCT FROM OLD.end_time AND NEW.location IS NOT DISTINCT FROM OLD.location
     AND NEW.tag IS NOT DISTINCT FROM OLD.tag THEN RETURN NEW; END IF;

  CREATE TEMP TABLE IF NOT EXISTS _upd_users (user_id uuid) ON COMMIT DROP;
  DELETE FROM _upd_users;
  INSERT INTO _upd_users SELECT np.user_id FROM public.notification_preferences np
  WHERE np.push_enabled AND np.events_updates
    AND (np.events_updates_scope = 'all' OR EXISTS (SELECT 1 FROM public.favourites f
      WHERE f.user_id = np.user_id AND f.item_type = 'event' AND f.item_id = NEW.id));

  UPDATE public.business_notifications b SET title = 'Event updated: ' || NEW.title,
    body = 'There has been an update to ' || NEW.title || '. Tap to see what''s changed.', created_at = now(), is_read = false
  WHERE b.kind = 'event_update' AND b.ref_id = NEW.id AND b.push_sent_at IS NULL
    AND b.user_id IN (SELECT user_id FROM _upd_users);

  INSERT INTO public.business_notifications (user_id, kind, status, title, body, link, ref_table, ref_id)
  SELECT u.user_id, 'event_update', 'unread', 'Event updated: ' || NEW.title,
    'There has been an update to ' || NEW.title || '. Tap to see what''s changed.', '/events/' || NEW.id::text, 'events', NEW.id
  FROM _upd_users u
  WHERE NOT EXISTS (SELECT 1 FROM public.business_notifications b WHERE b.user_id = u.user_id
    AND b.kind = 'event_update' AND b.ref_id = NEW.id AND b.push_sent_at IS NULL);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_special_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT NEW.is_active OR (NOT OLD.is_active AND NEW.is_active) THEN RETURN NEW; END IF;
  IF NEW.title IS NOT DISTINCT FROM OLD.title AND NEW.description IS NOT DISTINCT FROM OLD.description
     AND NEW.badge_override IS NOT DISTINCT FROM OLD.badge_override AND NEW.price IS NOT DISTINCT FROM OLD.price
     AND NEW.original_price IS NOT DISTINCT FROM OLD.original_price AND NEW.valid_from IS NOT DISTINCT FROM OLD.valid_from
     AND NEW.valid_until IS NOT DISTINCT FROM OLD.valid_until AND NEW.terms IS NOT DISTINCT FROM OLD.terms
     AND NEW.promo_code IS NOT DISTINCT FROM OLD.promo_code AND NEW.tag IS NOT DISTINCT FROM OLD.tag
     AND NEW.discount_type IS NOT DISTINCT FROM OLD.discount_type AND NEW.discount_value IS NOT DISTINCT FROM OLD.discount_value
     AND NEW.day_of_week IS NOT DISTINCT FROM OLD.day_of_week AND NEW.freebie_text IS NOT DISTINCT FROM OLD.freebie_text
     AND NEW.is_active IS NOT DISTINCT FROM OLD.is_active THEN RETURN NEW; END IF;

  CREATE TEMP TABLE IF NOT EXISTS _upd_users (user_id uuid) ON COMMIT DROP;
  DELETE FROM _upd_users;
  INSERT INTO _upd_users SELECT np.user_id FROM public.notification_preferences np
  WHERE np.push_enabled AND np.specials_updates
    AND (np.specials_updates_scope = 'all' OR EXISTS (SELECT 1 FROM public.favourites f
      WHERE f.user_id = np.user_id AND f.item_type = 'special' AND f.item_id = NEW.id));

  UPDATE public.business_notifications b SET title = 'Special updated: ' || NEW.title,
    body = 'There has been an update to ' || NEW.title || '. Tap to see what''s changed.', created_at = now(), is_read = false
  WHERE b.kind = 'special_update' AND b.ref_id = NEW.id AND b.push_sent_at IS NULL
    AND b.user_id IN (SELECT user_id FROM _upd_users);

  INSERT INTO public.business_notifications (user_id, kind, status, title, body, link, ref_table, ref_id)
  SELECT u.user_id, 'special_update', 'unread', 'Special updated: ' || NEW.title,
    'There has been an update to ' || NEW.title || '. Tap to see what''s changed.', '/specials/' || NEW.id::text, 'specials', NEW.id
  FROM _upd_users u
  WHERE NOT EXISTS (SELECT 1 FROM public.business_notifications b WHERE b.user_id = u.user_id
    AND b.kind = 'special_update' AND b.ref_id = NEW.id AND b.push_sent_at IS NULL);
  RETURN NEW;
END;
$$;