CREATE OR REPLACE FUNCTION public.notify_new_specials_batch()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  r record; v_existing record; v_ids uuid[]; v_first text; v_count int; v_id uuid; v_title text;
BEGIN
  CREATE TEMP TABLE IF NOT EXISTS _fresh_specials (id uuid, title text, badge text, tags text[]) ON COMMIT DROP;
  DELETE FROM _fresh_specials;
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
      WHERE user_id = r.user_id AND kind = 'special_new' AND NOT is_read
        AND created_at > now() - interval '30 minutes'
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
$$;

DROP TRIGGER IF EXISTS trg_notify_new_special ON public.specials;
DROP TRIGGER IF EXISTS trg_notify_special_activated ON public.specials;
CREATE TRIGGER trg_notify_new_specials_batch AFTER INSERT ON public.specials
  REFERENCING NEW TABLE AS new_rows FOR EACH STATEMENT EXECUTE FUNCTION public.notify_new_specials_batch();
CREATE TRIGGER trg_notify_specials_activated_batch AFTER UPDATE ON public.specials
  REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows FOR EACH STATEMENT EXECUTE FUNCTION public.notify_new_specials_batch();