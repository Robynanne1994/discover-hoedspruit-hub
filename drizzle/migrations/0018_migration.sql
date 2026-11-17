CREATE OR REPLACE FUNCTION public.notify_new_event() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _tags text[];
BEGIN
  IF NOT NEW.is_active THEN RETURN NEW; END IF;
  SELECT coalesce(array_agg(t), '{}') INTO _tags FROM (
    SELECT btrim(x) t FROM unnest(string_to_array(coalesce(NEW.tag,''),'|') || ARRAY[NEW.sub_tag_1, NEW.sub_tag_2]) x
  ) s WHERE t IS NOT NULL AND t <> '' AND t <> '-';
  INSERT INTO public.business_notifications (user_id, kind, status, title, body, link, ref_table, ref_id)
  SELECT np.user_id, 'event_new', 'unread', 'New event: ' || NEW.title,
    COALESCE(NULLIF(NEW.date, ''), 'A new event is live. Tap to see it.'),
    '/events/' || NEW.id::text, 'events', NEW.id
  FROM public.notification_preferences np
  WHERE np.push_enabled AND np.events_new
    AND (np.events_new_categories IS NULL OR _tags && np.events_new_categories);
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_new_special() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _tags text[];
BEGIN
  IF NOT NEW.is_active THEN RETURN NEW; END IF;
  SELECT coalesce(array_agg(t), '{}') INTO _tags FROM (
    SELECT btrim(x) t FROM unnest(string_to_array(coalesce(NEW.tag,''),'|') || coalesce(NEW.tags, '{}')) x
  ) s WHERE t IS NOT NULL AND t <> '' AND t <> '-';
  INSERT INTO public.business_notifications (user_id, kind, status, title, body, link, ref_table, ref_id)
  SELECT np.user_id, 'special_new', 'unread', 'New special: ' || NEW.title,
    COALESCE(NULLIF(NEW.badge_override, ''), 'A new deal is live. Tap to see it.'),
    '/specials/' || NEW.id::text, 'specials', NEW.id
  FROM public.notification_preferences np
  WHERE np.push_enabled AND np.specials_new
    AND (np.specials_new_categories IS NULL OR _tags && np.specials_new_categories);
  RETURN NEW;
END; $$;