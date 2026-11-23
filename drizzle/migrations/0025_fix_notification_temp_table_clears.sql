CREATE OR REPLACE FUNCTION public.notify_event_update()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT NEW.is_active OR (NOT OLD.is_active AND NEW.is_active) THEN RETURN NEW; END IF;
  IF NEW.title IS NOT DISTINCT FROM OLD.title AND NEW.description IS NOT DISTINCT FROM OLD.description
     AND NEW.date IS NOT DISTINCT FROM OLD.date AND NEW.start_time IS NOT DISTINCT FROM OLD.start_time
     AND NEW.end_time IS NOT DISTINCT FROM OLD.end_time AND NEW.location IS NOT DISTINCT FROM OLD.location
     AND NEW.tag IS NOT DISTINCT FROM OLD.tag THEN RETURN NEW; END IF;

  UPDATE public.business_notifications b SET title = 'Event updated: ' || NEW.title,
    body = 'There has been an update to ' || NEW.title || '. Tap to see what''s changed.', created_at = now(), is_read = false
  WHERE b.kind = 'event_update' AND b.ref_id = NEW.id AND b.push_sent_at IS NULL
    AND b.user_id IN (SELECT np.user_id FROM public.notification_preferences np
      WHERE np.push_enabled AND np.events_updates
        AND (np.events_updates_scope = 'all' OR EXISTS (SELECT 1 FROM public.favourites f
          WHERE f.user_id = np.user_id AND f.item_type = 'event' AND f.item_id = NEW.id)));

  INSERT INTO public.business_notifications (user_id, kind, status, title, body, link, ref_table, ref_id)
  SELECT np.user_id, 'event_update', 'unread', 'Event updated: ' || NEW.title,
    'There has been an update to ' || NEW.title || '. Tap to see what''s changed.', '/events/' || NEW.id::text, 'events', NEW.id
  FROM public.notification_preferences np
  WHERE np.push_enabled AND np.events_updates
    AND (np.events_updates_scope = 'all' OR EXISTS (SELECT 1 FROM public.favourites f
      WHERE f.user_id = np.user_id AND f.item_type = 'event' AND f.item_id = NEW.id))
    AND NOT EXISTS (SELECT 1 FROM public.business_notifications b WHERE b.user_id = np.user_id
      AND b.kind = 'event_update' AND b.ref_id = NEW.id AND b.push_sent_at IS NULL);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_special_update()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
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

  UPDATE public.business_notifications b SET title = 'Special updated: ' || NEW.title,
    body = 'There has been an update to ' || NEW.title || '. Tap to see what''s changed.', created_at = now(), is_read = false
  WHERE b.kind = 'special_update' AND b.ref_id = NEW.id AND b.push_sent_at IS NULL
    AND b.user_id IN (SELECT np.user_id FROM public.notification_preferences np
      WHERE np.push_enabled AND np.specials_updates
        AND (np.specials_updates_scope = 'all' OR EXISTS (SELECT 1 FROM public.favourites f
          WHERE f.user_id = np.user_id AND f.item_type = 'special' AND f.item_id = NEW.id)));

  INSERT INTO public.business_notifications (user_id, kind, status, title, body, link, ref_table, ref_id)
  SELECT np.user_id, 'special_update', 'unread', 'Special updated: ' || NEW.title,
    'There has been an update to ' || NEW.title || '. Tap to see what''s changed.', '/specials/' || NEW.id::text, 'specials', NEW.id
  FROM public.notification_preferences np
  WHERE np.push_enabled AND np.specials_updates
    AND (np.specials_updates_scope = 'all' OR EXISTS (SELECT 1 FROM public.favourites f
      WHERE f.user_id = np.user_id AND f.item_type = 'special' AND f.item_id = NEW.id))
    AND NOT EXISTS (SELECT 1 FROM public.business_notifications b WHERE b.user_id = np.user_id
      AND b.kind = 'special_update' AND b.ref_id = NEW.id AND b.push_sent_at IS NULL);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_new_listings_batch()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  r record; v_existing record; v_ids uuid[]; v_first text; v_count int; v_id uuid; v_title text;
BEGIN
  CREATE TEMP TABLE IF NOT EXISTS _fresh_listings (id uuid, title text, category_id uuid, location text) ON COMMIT DROP;
  DELETE FROM _fresh_listings WHERE id IS NOT NULL OR id IS NULL;
  IF TG_OP = 'INSERT' THEN
    INSERT INTO _fresh_listings SELECT n.id, n.title, n.category_id, n.location
      FROM new_rows n WHERE n.is_active AND n.first_live_at IS NOT NULL;
  ELSE
    INSERT INTO _fresh_listings SELECT n.id, n.title, n.category_id, n.location
      FROM new_rows n JOIN old_rows o ON o.id = n.id
      WHERE n.is_active AND o.first_live_at IS NULL AND n.first_live_at IS NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM _fresh_listings) THEN RETURN NULL; END IF;

  FOR r IN
    SELECT np.user_id, array_agg(f.id ORDER BY f.title) AS ids, (array_agg(f.title ORDER BY f.title))[1] AS first_title,
           (array_agg(f.location ORDER BY f.title))[1] AS first_location
    FROM public.notification_preferences np
    JOIN _fresh_listings f ON (
      np.listings_new_categories IS NULL
      OR (f.category_id IS NOT NULL AND f.category_id::text = ANY(np.listings_new_categories))
      OR EXISTS (SELECT 1 FROM public.listing_categories lc WHERE lc.listing_id = f.id AND lc.category_id::text = ANY(np.listings_new_categories))
    )
    WHERE np.push_enabled AND np.listings_new
    GROUP BY np.user_id
  LOOP
    SELECT id, ref_id, ref_ids, title INTO v_existing
      FROM public.business_notifications
      WHERE user_id = r.user_id AND kind = 'listing_new' AND push_sent_at IS NULL
      ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
    IF FOUND THEN
      v_ids := COALESCE(NULLIF(v_existing.ref_ids, '{}'), ARRAY[v_existing.ref_id]);
      SELECT array_agg(DISTINCT x) INTO v_ids FROM unnest(v_ids || r.ids) x WHERE x IS NOT NULL;
      v_count := array_length(v_ids, 1);
      SELECT l.title INTO v_first FROM public.listings l WHERE l.id = COALESCE(v_existing.ref_id, r.ids[1]);
      v_first := COALESCE(v_first, r.first_title);
      UPDATE public.business_notifications SET
        ref_ids = v_ids,
        title = 'New listings: ' || v_first || ' & ' || (v_count - 1) || CASE WHEN v_count - 1 = 1 THEN ' other' ELSE ' others' END,
        body = 'Tap to see them all.',
        link = '/my-notifications/listings/' || v_existing.id::text,
        created_at = now()
      WHERE id = v_existing.id;
    ELSE
      v_id := gen_random_uuid();
      v_count := array_length(r.ids, 1);
      IF v_count = 1 THEN
        v_title := 'New listing: ' || r.first_title;
      ELSE
        v_title := 'New listings: ' || r.first_title || ' & ' || (v_count - 1) || CASE WHEN v_count - 1 = 1 THEN ' other' ELSE ' others' END;
      END IF;
      INSERT INTO public.business_notifications (id, user_id, kind, status, title, body, link, ref_table, ref_id, ref_ids)
      VALUES (v_id, r.user_id, 'listing_new', 'unread', v_title,
        CASE WHEN v_count = 1 THEN COALESCE(NULLIF(r.first_location, ''), 'A new place is live. Tap to see it.') ELSE 'Tap to see them all.' END,
        CASE WHEN v_count = 1 THEN '/listing/' || r.ids[1]::text ELSE '/my-notifications/listings/' || v_id::text END,
        'listings', r.ids[1], r.ids);
    END IF;
  END LOOP;
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_new_events_batch()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  r record; v_existing record; v_ids uuid[]; v_first text; v_count int; v_id uuid; v_title text;
BEGIN
  CREATE TEMP TABLE IF NOT EXISTS _fresh_events (id uuid, title text, date text, tags text[]) ON COMMIT DROP;
  DELETE FROM _fresh_events WHERE id IS NOT NULL OR id IS NULL;
  IF TG_OP = 'INSERT' THEN
    INSERT INTO _fresh_events SELECT n.id, n.title, n.date,
      ARRAY(SELECT btrim(x) FROM unnest(string_to_array(coalesce(n.tag,''),'|') || ARRAY[n.sub_tag_1, n.sub_tag_2]) x
            WHERE x IS NOT NULL AND btrim(x) NOT IN ('', '-'))
      FROM new_rows n WHERE n.is_active;
  ELSE
    INSERT INTO _fresh_events SELECT n.id, n.title, n.date,
      ARRAY(SELECT btrim(x) FROM unnest(string_to_array(coalesce(n.tag,''),'|') || ARRAY[n.sub_tag_1, n.sub_tag_2]) x
            WHERE x IS NOT NULL AND btrim(x) NOT IN ('', '-'))
      FROM new_rows n JOIN old_rows o ON o.id = n.id WHERE n.is_active AND NOT o.is_active;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM _fresh_events) THEN RETURN NULL; END IF;

  FOR r IN
    SELECT np.user_id, array_agg(f.id ORDER BY f.title) AS ids,
           (array_agg(f.title ORDER BY f.title))[1] AS first_title,
           (array_agg(f.date ORDER BY f.title))[1] AS first_date
    FROM public.notification_preferences np
    JOIN _fresh_events f ON (np.events_new_categories IS NULL OR f.tags && np.events_new_categories)
    WHERE np.push_enabled AND np.events_new
    GROUP BY np.user_id
  LOOP
    SELECT id, ref_id, ref_ids INTO v_existing
      FROM public.business_notifications
      WHERE user_id = r.user_id AND kind = 'event_new' AND push_sent_at IS NULL
      ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
    IF FOUND THEN
      v_ids := COALESCE(NULLIF(v_existing.ref_ids, '{}'), ARRAY[v_existing.ref_id]);
      SELECT array_agg(DISTINCT x) INTO v_ids FROM unnest(v_ids || r.ids) x WHERE x IS NOT NULL;
      v_count := array_length(v_ids, 1);
      SELECT e.title INTO v_first FROM public.events e WHERE e.id = COALESCE(v_existing.ref_id, r.ids[1]);
      v_first := COALESCE(v_first, r.first_title);
      UPDATE public.business_notifications SET
        ref_ids = v_ids,
        title = 'New events: ' || v_first || ' & ' || (v_count - 1) || CASE WHEN v_count - 1 = 1 THEN ' other' ELSE ' others' END,
        body = 'Tap to see them all.',
        link = '/my-notifications/events/' || v_existing.id::text,
        created_at = now()
      WHERE id = v_existing.id;
    ELSE
      v_id := gen_random_uuid();
      v_count := array_length(r.ids, 1);
      IF v_count = 1 THEN
        v_title := 'New event: ' || r.first_title;
      ELSE
        v_title := 'New events: ' || r.first_title || ' & ' || (v_count - 1) || CASE WHEN v_count - 1 = 1 THEN ' other' ELSE ' others' END;
      END IF;
      INSERT INTO public.business_notifications (id, user_id, kind, status, title, body, link, ref_table, ref_id, ref_ids)
      VALUES (v_id, r.user_id, 'event_new', 'unread', v_title,
        CASE WHEN v_count = 1 THEN COALESCE(NULLIF(r.first_date, ''), 'A new event is live. Tap to see it.') ELSE 'Tap to see them all.' END,
        CASE WHEN v_count = 1 THEN '/events/' || r.ids[1]::text ELSE '/my-notifications/events/' || v_id::text END,
        'events', r.ids[1], r.ids);
    END IF;
  END LOOP;
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_new_specials_batch()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  r record; v_existing record; v_ids uuid[]; v_first text; v_count int; v_id uuid; v_title text;
BEGIN
  CREATE TEMP TABLE IF NOT EXISTS _fresh_specials (id uuid, title text, badge text, tags text[]) ON COMMIT DROP;
  DELETE FROM _fresh_specials WHERE id IS NOT NULL OR id IS NULL;
  IF TG_OP = 'INSERT' THEN
    INSERT INTO _fresh_specials SELECT n.id, n.title, n.badge_override,
      ARRAY(SELECT btrim(x) FROM unnest(string_to_array(coalesce(n.tag,''),'|') || coalesce(n.tags, '{}')) x
            WHERE x IS NOT NULL AND btrim(x) NOT IN ('', '-'))
      FROM new_rows n WHERE n.is_active;
  ELSE
    INSERT INTO _fresh_specials SELECT n.id, n.title, n.badge_override,
      ARRAY(SELECT btrim(x) FROM unnest(string_to_array(coalesce(n.tag,''),'|') || coalesce(n.tags, '{}')) x
            WHERE x IS NOT NULL AND btrim(x) NOT IN ('', '-'))
      FROM new_rows n JOIN old_rows o ON o.id = n.id WHERE n.is_active AND NOT o.is_active;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM _fresh_specials) THEN RETURN NULL; END IF;

  FOR r IN
    SELECT np.user_id, array_agg(f.id ORDER BY f.title) AS ids,
           (array_agg(f.title ORDER BY f.title))[1] AS first_title,
           (array_agg(f.badge ORDER BY f.title))[1] AS first_badge
    FROM public.notification_preferences np
    JOIN _fresh_specials f ON (np.specials_new_categories IS NULL OR f.tags && np.specials_new_categories)
    WHERE np.push_enabled AND np.specials_new
    GROUP BY np.user_id
  LOOP
    SELECT id, ref_id, ref_ids INTO v_existing
      FROM public.business_notifications
      WHERE user_id = r.user_id AND kind = 'special_new' AND push_sent_at IS NULL
      ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
    IF FOUND THEN
      v_ids := COALESCE(NULLIF(v_existing.ref_ids, '{}'), ARRAY[v_existing.ref_id]);
      SELECT array_agg(DISTINCT x) INTO v_ids FROM unnest(v_ids || r.ids) x WHERE x IS NOT NULL;
      v_count := array_length(v_ids, 1);
      SELECT s.title INTO v_first FROM public.specials s WHERE s.id = COALESCE(v_existing.ref_id, r.ids[1]);
      v_first := COALESCE(v_first, r.first_title);
      UPDATE public.business_notifications SET
        ref_ids = v_ids,
        title = 'New specials: ' || v_first || ' & ' || (v_count - 1) || CASE WHEN v_count - 1 = 1 THEN ' other' ELSE ' others' END,
        body = 'Tap to see them all.',
        link = '/my-notifications/specials/' || v_existing.id::text,
        created_at = now()
      WHERE id = v_existing.id;
    ELSE
      v_id := gen_random_uuid();
      v_count := array_length(r.ids, 1);
      IF v_count = 1 THEN
        v_title := 'New special: ' || r.first_title;
      ELSE
        v_title := 'New specials: ' || r.first_title || ' & ' || (v_count - 1) || CASE WHEN v_count - 1 = 1 THEN ' other' ELSE ' others' END;
      END IF;
      INSERT INTO public.business_notifications (id, user_id, kind, status, title, body, link, ref_table, ref_id, ref_ids)
      VALUES (v_id, r.user_id, 'special_new', 'unread', v_title,
        CASE WHEN v_count = 1 THEN COALESCE(NULLIF(r.first_badge, ''), 'A new deal is live. Tap to see it.') ELSE 'Tap to see them all.' END,
        CASE WHEN v_count = 1 THEN '/specials/' || r.ids[1]::text ELSE '/my-notifications/specials/' || v_id::text END,
        'specials', r.ids[1], r.ids);
    END IF;
  END LOOP;
  RETURN NULL;
END;
$function$;