-- Second (and third, …) sets of opening hours for a listing.
--
-- A listing can sit in more than one category and trade on more than one
-- clock: Sleepers is a restaurant *and* a bar, and the kitchen closing at
-- 21:00 says nothing about the bar still pouring until midnight. One
-- opening_hours column can only tell one of those two stories, so the app
-- ends up stating the wrong one.
--
-- opening_hours_label — what the existing opening_hours block is the hours
--                       *of* ("Kitchen", "Restaurant", "Shop"). Blank keeps
--                       today's plain "Opening Hours" heading, so nothing
--                       already captured needs touching.
-- additional_hours    — the extra schedules, in the order they should show:
--                       [{"label":"Bar","hours":{"monday":"16:00 - 00:00", …}}]
--                       Same day keys and same value grammar as opening_hours
--                       ("closed", "Always Open", "08:00 - 17:00"), so every
--                       reader that already understands one understands both.
--                       NULL / [] means this listing keeps a single schedule,
--                       which is nearly all of them.

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS opening_hours_label text,
  ADD COLUMN IF NOT EXISTS additional_hours jsonb;

COMMENT ON COLUMN public.listings.opening_hours_label IS
  'Names what opening_hours covers when a listing keeps more than one schedule (e.g. "Kitchen"). Blank renders the plain "Opening Hours" heading.';
COMMENT ON COLUMN public.listings.additional_hours IS
  'Extra opening-hours schedules: [{"label":"Bar","hours":{"monday":"16:00 - 00:00", ...}}]. Day keys and value grammar match opening_hours. NULL or [] = single schedule.';

-- Anything stored here has to be a list of schedules, so a bad CSV cell or a
-- stray API write fails loudly at the door instead of quietly rendering an
-- empty hours card. Shape only — the day values stay free text, exactly as
-- opening_hours always has been.
ALTER TABLE public.listings
  DROP CONSTRAINT IF EXISTS listings_additional_hours_is_array;
ALTER TABLE public.listings
  ADD CONSTRAINT listings_additional_hours_is_array
  CHECK (
    additional_hours IS NULL
    OR (
      jsonb_typeof(additional_hours) = 'array'
      AND NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(additional_hours) AS entry
        WHERE jsonb_typeof(entry) <> 'object'
           OR jsonb_typeof(COALESCE(entry -> 'hours', '{}'::jsonb)) <> 'object'
      )
    )
  );
