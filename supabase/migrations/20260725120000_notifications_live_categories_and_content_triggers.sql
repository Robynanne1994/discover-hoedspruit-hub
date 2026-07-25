-- Notifications: use the app's real categories and tags instead of a
-- hand-maintained admin mapping, and actually fire notifications when admins
-- add or edit content.
--
-- 1. Removes the unused admin "assign categories/tags per topic" tables.
-- 2. Resets the per-user category selections so everyone starts from
--    "all live categories/tags" (NULL sentinel). The parent on/off toggles
--    (events_new, listings_new, ...) are boolean columns and are left as-is.
-- 3. Adds triggers so that when a listing / event / special is inserted or
--    edited, every user who has the relevant toggle on (and the matching
--    category or tag selected) gets a business_notifications row.
--
-- Matching model:
--   * Listings  -> real listing categories (public.categories.id, stored as text)
--   * Events    -> the event's real tag (events.tag)
--   * Specials  -> the special's real tag (specials.tag)
-- A NULL selection array means "everything", so the parent toggle alone drives it.

-- ---------------------------------------------------------------------------
-- 1. Drop the unused admin mapping tables.
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS public.notification_item_mappings CASCADE;
DROP TABLE IF EXISTS public.notification_items CASCADE;
DROP TABLE IF EXISTS public.notification_groups CASCADE;

-- ---------------------------------------------------------------------------
-- 2. Reset stale slug-based selections to "all" (NULL).
--    The old arrays held hardcoded slugs that no longer map to anything.
-- ---------------------------------------------------------------------------
UPDATE public.notification_preferences
   SET events_new_categories = NULL,
       listings_new_categories = NULL,
       listings_updates_categories = NULL,
       specials_new_categories = NULL;

-- ---------------------------------------------------------------------------
-- 3a. New event -> events_new
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_new_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.business_notifications
    (user_id, kind, status, title, body, link, ref_table, ref_id)
  SELECT
    np.user_id,
    'event_new',
    'unread',
    'New event: ' || NEW.title,
    COALESCE(NULLIF(NEW.location, ''), 'Tap to see the details.'),
    '/events/' || NEW.id::text,
    'events',
    NEW.id
  FROM public.notification_preferences np
  WHERE np.push_enabled
    AND np.events_new
    AND (
      np.events_new_categories IS NULL
      OR (NEW.tag IS NOT NULL AND NEW.tag = ANY(np.events_new_categories))
    );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_event ON public.events;
CREATE TRIGGER trg_notify_new_event
AFTER INSERT ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_event();

-- ---------------------------------------------------------------------------
-- 3b. Edited event -> events_updates (only when user-facing details change)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_event_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only fire when something a user would care about actually changed.
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
    'Details for this event have changed. Tap to see what''s new.',
    '/events/' || NEW.id::text,
    'events',
    NEW.id
  FROM public.notification_preferences np
  WHERE np.push_enabled
    AND np.events_updates;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_event_update ON public.events;
CREATE TRIGGER trg_notify_event_update
AFTER UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.notify_event_update();

-- ---------------------------------------------------------------------------
-- 3c. New special -> specials_new
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_new_special()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only announce specials that are live.
  IF NOT NEW.is_active THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.business_notifications
    (user_id, kind, status, title, body, link, ref_table, ref_id)
  SELECT
    np.user_id,
    'special_new',
    'unread',
    'New special: ' || NEW.title,
    COALESCE(NULLIF(NEW.deal_label, ''), 'A new deal is live. Tap to see it.'),
    '/specials/' || NEW.id::text,
    'specials',
    NEW.id
  FROM public.notification_preferences np
  WHERE np.push_enabled
    AND np.specials_new
    AND (
      np.specials_new_categories IS NULL
      OR (NEW.tag IS NOT NULL AND NEW.tag = ANY(np.specials_new_categories))
    );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_special ON public.specials;
CREATE TRIGGER trg_notify_new_special
AFTER INSERT ON public.specials
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_special();

-- ---------------------------------------------------------------------------
-- 3d. New listing -> listings_new
--     On insert the listing_categories junction may not be populated yet, so
--     match on the listing's primary category_id (set at insert time).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_new_listing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.business_notifications
    (user_id, kind, status, title, body, link, ref_table, ref_id)
  SELECT
    np.user_id,
    'listing_new',
    'unread',
    'New listing: ' || NEW.title,
    'A new business has been added. Tap to check it out.',
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
$$;

DROP TRIGGER IF EXISTS trg_notify_new_listing ON public.listings;
CREATE TRIGGER trg_notify_new_listing
AFTER INSERT ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_listing();

-- ---------------------------------------------------------------------------
-- 3e. Edited listing -> listings_updates (only when core details change)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_listing_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.title IS NOT DISTINCT FROM OLD.title
     AND NEW.description IS NOT DISTINCT FROM OLD.description
     AND NEW.category_id IS NOT DISTINCT FROM OLD.category_id
     AND NEW.google_maps_link IS NOT DISTINCT FROM OLD.google_maps_link THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.business_notifications
    (user_id, kind, status, title, body, link, ref_table, ref_id)
  SELECT
    np.user_id,
    'listing_update',
    'unread',
    'Listing updated: ' || NEW.title,
    'This business has updated its details. Tap to see what''s changed.',
    '/listing/' || NEW.id::text,
    'listings',
    NEW.id
  FROM public.notification_preferences np
  WHERE np.push_enabled
    AND np.listings_updates
    AND (
      np.listings_updates_categories IS NULL
      OR (NEW.category_id IS NOT NULL AND NEW.category_id::text = ANY(np.listings_updates_categories))
      OR EXISTS (
        SELECT 1 FROM public.listing_categories lc
        WHERE lc.listing_id = NEW.id
          AND lc.category_id::text = ANY(np.listings_updates_categories)
      )
    );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_listing_update ON public.listings;
CREATE TRIGGER trg_notify_listing_update
AFTER UPDATE ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.notify_listing_update();
