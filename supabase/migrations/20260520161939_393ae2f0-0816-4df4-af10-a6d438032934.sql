ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS services_offered text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS plant_types text[] DEFAULT '{}'::text[];