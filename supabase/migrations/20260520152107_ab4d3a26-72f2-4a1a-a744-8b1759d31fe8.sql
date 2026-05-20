ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS business_started_year integer,
  ADD COLUMN IF NOT EXISTS after_hours_available boolean,
  ADD COLUMN IF NOT EXISTS callout_fee boolean,
  ADD COLUMN IF NOT EXISTS specialities text;