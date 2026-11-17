ALTER TABLE public.events
  ADD COLUMN is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN auto_activate_on_image boolean NOT NULL DEFAULT false;

ALTER TABLE public.listings
  ADD COLUMN is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN auto_activate_on_image boolean NOT NULL DEFAULT false;

ALTER TABLE public.bush_telegraph_resources
  ADD COLUMN is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN auto_activate_on_image boolean NOT NULL DEFAULT false;

ALTER TABLE public.specials
  ADD COLUMN auto_activate_on_image boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.events.auto_activate_on_image IS 'INTERNAL: true only for an image-free draft that should activate when its first display image arrives';
COMMENT ON COLUMN public.listings.auto_activate_on_image IS 'INTERNAL: true only for an image-free draft that should activate when its first display image arrives';
COMMENT ON COLUMN public.bush_telegraph_resources.auto_activate_on_image IS 'INTERNAL: true only for an image-free draft that should activate when its first display image arrives';
COMMENT ON COLUMN public.specials.auto_activate_on_image IS 'INTERNAL: true only for an image-free draft that should activate when its first display image arrives';

CREATE INDEX events_public_active_idx ON public.events (is_active) WHERE is_active;
CREATE INDEX listings_public_active_idx ON public.listings (is_active) WHERE is_active;
CREATE INDEX bush_telegraph_resources_public_active_idx ON public.bush_telegraph_resources (is_active) WHERE is_active;
CREATE INDEX specials_public_active_idx ON public.specials (is_active) WHERE is_active;

CREATE OR REPLACE FUNCTION public.apply_content_activation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_fields text[];
  v_old_has_image boolean := false;
  v_new_has_image boolean := false;
  v_field text;
BEGIN
  v_fields := CASE TG_TABLE_NAME
    WHEN 'listings' THEN ARRAY['image_url','detail_image_url','card_image_url','homepage_image_url','saved_image_url','search_image_url']
    WHEN 'events' THEN ARRAY['image_url','poster_image_url','detail_image_url','homepage_image_url','saved_image_url','search_image_url']
    WHEN 'specials' THEN ARRAY['image_url','detail_image_url','homepage_image_url','saved_image_url','featured_image_url','search_image_url']
    WHEN 'bush_telegraph_resources' THEN ARRAY['image_url','detail_image_url','homepage_image_url','saved_image_url','search_image_url']
    ELSE ARRAY[]::text[]
  END;

  FOREACH v_field IN ARRAY v_fields LOOP
    IF NULLIF(btrim(to_jsonb(NEW) ->> v_field), '') IS NOT NULL THEN
      v_new_has_image := true;
      EXIT;
    END IF;
  END LOOP;

  IF TG_OP = 'UPDATE' THEN
    FOREACH v_field IN ARRAY v_fields LOOP
      IF NULLIF(btrim(to_jsonb(OLD) ->> v_field), '') IS NOT NULL THEN
        v_old_has_image := true;
        EXIT;
      END IF;
    END LOOP;
  END IF;

  NEW.is_active := COALESCE(NEW.is_active, true);
  NEW.auto_activate_on_image := COALESCE(NEW.auto_activate_on_image, false);

  -- Nothing newly created or edited may be publicly active without a display
  -- image. A requested TRUE becomes an auto-activating draft; an explicit
  -- FALSE stays deliberately inactive and does not auto-activate.
  IF NOT v_new_has_image THEN
    IF NEW.is_active THEN
      NEW.auto_activate_on_image := true;
    END IF;
    NEW.is_active := false;
    RETURN NEW;
  END IF;

  IF NEW.is_active THEN
    NEW.auto_activate_on_image := false;
  ELSIF TG_OP = 'UPDATE'
    AND NOT v_old_has_image
    AND OLD.auto_activate_on_image
    AND NEW.auto_activate_on_image THEN
    -- Only a genuine image-free draft activates automatically. A CSV or admin
    -- FALSE clears the marker, so adding or changing images cannot override it.
    NEW.is_active := true;
    NEW.auto_activate_on_image := false;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_active AND NOT NEW.is_active THEN
    NEW.auto_activate_on_image := false;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER apply_content_activation
BEFORE INSERT OR UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.apply_content_activation();

CREATE TRIGGER apply_content_activation
BEFORE INSERT OR UPDATE ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.apply_content_activation();

CREATE TRIGGER apply_content_activation
BEFORE INSERT OR UPDATE ON public.specials
FOR EACH ROW EXECUTE FUNCTION public.apply_content_activation();

CREATE TRIGGER apply_content_activation
BEFORE INSERT OR UPDATE ON public.bush_telegraph_resources
FOR EACH ROW EXECUTE FUNCTION public.apply_content_activation();

DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;
CREATE POLICY "Events are viewable by everyone"
ON public.events FOR SELECT TO anon, authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Listings are viewable by everyone" ON public.listings;
CREATE POLICY "Listings are viewable by everyone"
ON public.listings FOR SELECT TO anon, authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Resources are viewable by everyone" ON public.bush_telegraph_resources;
CREATE POLICY "Resources are viewable by everyone"
ON public.bush_telegraph_resources FOR SELECT TO public
USING (is_active = true);

CREATE OR REPLACE FUNCTION public.notify_new_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT NEW.is_active THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.business_notifications
    (user_id, kind, status, title, body, link, ref_table, ref_id)
  SELECT
    np.user_id,
    'event_new',
    'unread',
    'New event: ' || NEW.title,
    COALESCE(NULLIF(NEW.date, ''), 'A new event is live. Tap to see it.'),
    '/events/' || NEW.id::text,
    'events',
    NEW.id
  FROM public.notification_preferences np
  WHERE np.push_enabled
    AND np.events_new
    AND (
      np.events_new_categories IS NULL
      OR (NEW.tag IS NOT NULL AND NEW.tag = ANY(np.events_new_categories))
      OR (NEW.sub_tag_1 IS NOT NULL AND NEW.sub_tag_1 = ANY(np.events_new_categories))
      OR (NEW.sub_tag_2 IS NOT NULL AND NEW.sub_tag_2 = ANY(np.events_new_categories))
    );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_new_listing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT NEW.is_active THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.business_notifications
    (user_id, kind, status, title, body, link, ref_table, ref_id)
  SELECT
    np.user_id,
    'listing_new',
    'unread',
    'New listing: ' || NEW.title,
    COALESCE(NULLIF(NEW.location, ''), 'A new place is live. Tap to see it.'),
    '/listing/' || NEW.id::text,
    'listings',
    NEW.id
  FROM public.notification_preferences np
  WHERE np.push_enabled
    AND np.listings_new
    AND (
      np.listings_new_categories IS NULL
      OR (NEW.category_id IS NOT NULL AND NEW.category_id::text = ANY(np.listings_new_categories))
      OR EXISTS (
        SELECT 1 FROM public.listing_categories lc
        WHERE lc.listing_id = NEW.id
          AND lc.category_id::text = ANY(np.listings_new_categories)
      )
    );
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_notify_new_event
AFTER INSERT ON public.events
FOR EACH ROW EXECUTE FUNCTION public.notify_new_event();

CREATE TRIGGER trg_notify_event_activated
AFTER UPDATE OF is_active ON public.events
FOR EACH ROW WHEN (OLD.is_active = false AND NEW.is_active = true)
EXECUTE FUNCTION public.notify_new_event();

CREATE TRIGGER trg_notify_new_listing
AFTER INSERT ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.notify_new_listing();

CREATE TRIGGER trg_notify_listing_activated
AFTER UPDATE OF is_active ON public.listings
FOR EACH ROW WHEN (OLD.is_active = false AND NEW.is_active = true)
EXECUTE FUNCTION public.notify_new_listing();

CREATE TRIGGER trg_notify_new_special
AFTER INSERT ON public.specials
FOR EACH ROW EXECUTE FUNCTION public.notify_new_special();

CREATE TRIGGER trg_notify_special_activated
AFTER UPDATE OF is_active ON public.specials
FOR EACH ROW WHEN (OLD.is_active = false AND NEW.is_active = true)
EXECUTE FUNCTION public.notify_new_special();

CREATE OR REPLACE FUNCTION public.notify_event_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT NEW.is_active OR (NOT OLD.is_active AND NEW.is_active) THEN
    RETURN NEW;
  END IF;

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
$function$;

CREATE OR REPLACE FUNCTION public.notify_special_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT NEW.is_active OR (NOT OLD.is_active AND NEW.is_active) THEN
    RETURN NEW;
  END IF;

  IF NEW.title IS NOT DISTINCT FROM OLD.title
     AND NEW.description IS NOT DISTINCT FROM OLD.description
     AND NEW.badge_override IS NOT DISTINCT FROM OLD.badge_override
     AND NEW.price IS NOT DISTINCT FROM OLD.price
     AND NEW.original_price IS NOT DISTINCT FROM OLD.original_price
     AND NEW.valid_from IS NOT DISTINCT FROM OLD.valid_from
     AND NEW.valid_until IS NOT DISTINCT FROM OLD.valid_until
     AND NEW.terms IS NOT DISTINCT FROM OLD.terms
     AND NEW.promo_code IS NOT DISTINCT FROM OLD.promo_code
     AND NEW.tag IS NOT DISTINCT FROM OLD.tag
     AND NEW.discount_type IS NOT DISTINCT FROM OLD.discount_type
     AND NEW.discount_value IS NOT DISTINCT FROM OLD.discount_value
     AND NEW.day_of_week IS NOT DISTINCT FROM OLD.day_of_week
     AND NEW.freebie_text IS NOT DISTINCT FROM OLD.freebie_text
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
$function$;