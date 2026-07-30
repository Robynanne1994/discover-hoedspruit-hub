-- Merge duplicate event / special tags.
--
-- The notification filter screens (src/lib/notificationCategories.ts) build
-- their toggle lists from the DISTINCT tags actually in use on events and
-- specials. Because the admin tag field is free text, two near-duplicates crept
-- in and showed up as separate toggles:
--
--   'Fitness'  -> already covered by 'Sports & Fitness'
--   'Wellness' -> already covered by 'Health & Wellness'
--
-- This migration folds the stray tags into the ones we keep, so each concept
-- has a single toggle. The notification triggers match a user's saved selection
-- against the tag string exactly (NEW.tag = ANY(np.*_categories)), so the saved
-- selections are rewritten in step 2 — otherwise anyone who had 'Fitness'
-- ticked would silently stop being notified.
--
-- A BEFORE INSERT/UPDATE trigger (step 3) keeps the merge from undoing itself
-- the next time someone types the short form into the admin tag field.

-- ---------------------------------------------------------------------------
-- 1. Fold the stray tags into the ones we keep.
--    Matched case- and whitespace-insensitively so 'fitness', ' Fitness ' etc.
--    are all caught.
-- ---------------------------------------------------------------------------
UPDATE public.events
   SET tag = 'Sports & Fitness'
 WHERE lower(btrim(tag)) = 'fitness';

UPDATE public.events
   SET tag = 'Health & Wellness'
 WHERE lower(btrim(tag)) = 'wellness';

UPDATE public.specials
   SET tag = 'Sports & Fitness'
 WHERE lower(btrim(tag)) = 'fitness';

UPDATE public.specials
   SET tag = 'Health & Wellness'
 WHERE lower(btrim(tag)) = 'wellness';

-- ---------------------------------------------------------------------------
-- 2. Rewrite the saved per-user selections.
--    These arrays store the tag string itself. NULL means "everything", which
--    needs no rewriting. Rebuilt with DISTINCT so a user who had both 'Fitness'
--    and 'Sports & Fitness' ticked doesn't end up with the same value twice.
-- ---------------------------------------------------------------------------
UPDATE public.notification_preferences np
   SET events_new_categories = sub.tags
  FROM (
    SELECT p.user_id,
           ARRAY(
             SELECT DISTINCT CASE lower(btrim(t))
                               WHEN 'fitness'  THEN 'Sports & Fitness'
                               WHEN 'wellness' THEN 'Health & Wellness'
                               ELSE t
                             END
               FROM unnest(p.events_new_categories) AS t
           ) AS tags
      FROM public.notification_preferences p
     WHERE p.events_new_categories IS NOT NULL
       AND EXISTS (
             SELECT 1 FROM unnest(p.events_new_categories) AS t
              WHERE lower(btrim(t)) IN ('fitness', 'wellness')
           )
  ) AS sub
 WHERE np.user_id = sub.user_id;

UPDATE public.notification_preferences np
   SET specials_new_categories = sub.tags
  FROM (
    SELECT p.user_id,
           ARRAY(
             SELECT DISTINCT CASE lower(btrim(t))
                               WHEN 'fitness'  THEN 'Sports & Fitness'
                               WHEN 'wellness' THEN 'Health & Wellness'
                               ELSE t
                             END
               FROM unnest(p.specials_new_categories) AS t
           ) AS tags
      FROM public.notification_preferences p
     WHERE p.specials_new_categories IS NOT NULL
       AND EXISTS (
             SELECT 1 FROM unnest(p.specials_new_categories) AS t
              WHERE lower(btrim(t)) IN ('fitness', 'wellness')
           )
  ) AS sub
 WHERE np.user_id = sub.user_id;

-- ---------------------------------------------------------------------------
-- 3. Keep the tags canonical from here on.
--    Without this, the next event saved with a 'Fitness' tag reintroduces the
--    duplicate toggle. Only these two aliases are rewritten; every other tag is
--    left exactly as typed.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.canonicalise_content_tag()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.tag IS NOT NULL THEN
    NEW.tag := CASE lower(btrim(NEW.tag))
                 WHEN 'fitness'  THEN 'Sports & Fitness'
                 WHEN 'wellness' THEN 'Health & Wellness'
                 ELSE NEW.tag
               END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_canonicalise_event_tag ON public.events;
CREATE TRIGGER trg_canonicalise_event_tag
BEFORE INSERT OR UPDATE OF tag ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.canonicalise_content_tag();

DROP TRIGGER IF EXISTS trg_canonicalise_special_tag ON public.specials;
CREATE TRIGGER trg_canonicalise_special_tag
BEFORE INSERT OR UPDATE OF tag ON public.specials
FOR EACH ROW
EXECUTE FUNCTION public.canonicalise_content_tag();
