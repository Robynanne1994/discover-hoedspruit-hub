-- Exact map coordinates for the Location tab.
--
-- Until now the Location tab worked out where a listing was at render time:
-- read the Google Maps link if it happened to contain coordinates, otherwise
-- geocode the written address, otherwise fall back to the middle of town.
-- Anything that fell through pinned an empty patch of bushveld.
--
-- latitude / longitude let a listing carry its real position. They are filled
-- by the Google Places sync (supabase/functions/refresh-google-ratings), which
-- already resolves each listing to a place ID, and can also be set by hand for
-- the places Google does not know about.

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

COMMENT ON COLUMN public.listings.latitude IS
  'Map pin latitude. Populated by the Google Places sync; overrides the address geocode on the Location tab.';
COMMENT ON COLUMN public.listings.longitude IS
  'Map pin longitude. Populated by the Google Places sync; overrides the address geocode on the Location tab.';
COMMENT ON COLUMN public.events.latitude IS
  'Map pin latitude for the event venue. Overrides the address geocode on the Location tab.';
COMMENT ON COLUMN public.events.longitude IS
  'Map pin longitude for the event venue. Overrides the address geocode on the Location tab.';

-- Guard against a bad import putting a pin in the Atlantic or on another
-- continent: coordinates must be a valid pair inside southern Africa.
ALTER TABLE public.listings
  DROP CONSTRAINT IF EXISTS listings_coordinates_sane;
ALTER TABLE public.listings
  ADD CONSTRAINT listings_coordinates_sane CHECK (
    (latitude IS NULL AND longitude IS NULL)
    OR (latitude BETWEEN -35 AND -20 AND longitude BETWEEN 25 AND 35)
  );

ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_coordinates_sane;
ALTER TABLE public.events
  ADD CONSTRAINT events_coordinates_sane CHECK (
    (latitude IS NULL AND longitude IS NULL)
    OR (latitude BETWEEN -35 AND -20 AND longitude BETWEEN 25 AND 35)
  );
