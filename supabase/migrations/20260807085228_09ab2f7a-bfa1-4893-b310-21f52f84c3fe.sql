ALTER TABLE public.specials RENAME COLUMN deal_label TO badge_override;
ALTER TABLE public.specials ALTER COLUMN badge_override DROP NOT NULL;

ALTER TABLE public.specials
  ADD COLUMN IF NOT EXISTS deal_type text,
  ADD COLUMN IF NOT EXISTS day_of_week text,
  ADD COLUMN IF NOT EXISTS discount_type text,
  ADD COLUMN IF NOT EXISTS discount_value numeric,
  ADD COLUMN IF NOT EXISTS freebie_text text,
  ADD COLUMN IF NOT EXISTS redemption_note text;

ALTER TABLE public.specials
  ADD CONSTRAINT specials_deal_type_check
  CHECK (deal_type IS NULL OR deal_type IN ('weekly','date_range','monthly','ongoing'));

ALTER TABLE public.specials
  ADD CONSTRAINT specials_discount_type_check
  CHECK (discount_type IS NULL OR discount_type IN ('percent_off','amount_off','fixed_price','buy_x_get_y','freebie'));

ALTER TABLE public.specials
  ADD CONSTRAINT specials_day_of_week_check
  CHECK (day_of_week IS NULL OR day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'));

CREATE OR REPLACE FUNCTION public.notify_new_special()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
    COALESCE(NULLIF(NEW.badge_override, ''), 'A new deal is live. Tap to see it.'),
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

CREATE OR REPLACE FUNCTION public.notify_special_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
$$;