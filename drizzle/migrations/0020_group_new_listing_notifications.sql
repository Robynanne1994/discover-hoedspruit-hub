ALTER TABLE public.business_notifications ADD COLUMN IF NOT EXISTS ref_ids uuid[] NOT NULL DEFAULT '{}';

CREATE OR REPLACE FUNCTION public.notify_new_listings_batch()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  r record;
  v_existing record;
  v_ids uuid[];
  v_first text;
  v_count int;
  v_id uuid;
  v_title text;
BEGIN
  CREATE TEMP TABLE IF NOT EXISTS _fresh_listings (id uuid, title text, category_id uuid, location text) ON COMMIT DROP;
  DELETE FROM _fresh_listings;
  IF TG_OP = 'INSERT' THEN
    INSERT INTO _fresh_listings SELECT n.id, n.title, n.category_id, n.location FROM new_rows n WHERE n.is_active;
  ELSE
    INSERT INTO _fresh_listings SELECT n.id, n.title, n.category_id, n.location
      FROM new_rows n JOIN old_rows o ON o.id = n.id WHERE n.is_active AND o.is_active = false;
  END IF;

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
      WHERE user_id = r.user_id AND kind = 'listing_new' AND NOT is_read
        AND created_at > now() - interval '30 minutes'
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
$$;

DROP TRIGGER IF EXISTS trg_notify_new_listing ON public.listings;
DROP TRIGGER IF EXISTS trg_notify_listing_activated ON public.listings;

CREATE TRIGGER trg_notify_new_listings_batch AFTER INSERT ON public.listings
  REFERENCING NEW TABLE AS new_rows FOR EACH STATEMENT EXECUTE FUNCTION public.notify_new_listings_batch();
CREATE TRIGGER trg_notify_listings_activated_batch AFTER UPDATE ON public.listings
  REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows FOR EACH STATEMENT EXECUTE FUNCTION public.notify_new_listings_batch();

REVOKE EXECUTE ON FUNCTION public.notify_new_listings_batch() FROM PUBLIC, anon, authenticated;