CREATE OR REPLACE FUNCTION public.notify_new_events_batch()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  r record; v_existing record; v_ids uuid[]; v_first text; v_count int; v_id uuid; v_title text;
BEGIN
  CREATE TEMP TABLE IF NOT EXISTS _fresh_events (id uuid, title text, date text, tags text[]) ON COMMIT DROP;
  DELETE FROM _fresh_events;
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
      WHERE user_id = r.user_id AND kind = 'event_new' AND NOT is_read
        AND created_at > now() - interval '30 minutes'
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
$$;

DROP TRIGGER IF EXISTS trg_notify_new_event ON public.events;
DROP TRIGGER IF EXISTS trg_notify_event_activated ON public.events;
CREATE TRIGGER trg_notify_new_events_batch AFTER INSERT ON public.events
  REFERENCING NEW TABLE AS new_rows FOR EACH STATEMENT EXECUTE FUNCTION public.notify_new_events_batch();
CREATE TRIGGER trg_notify_events_activated_batch AFTER UPDATE ON public.events
  REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows FOR EACH STATEMENT EXECUTE FUNCTION public.notify_new_events_batch();