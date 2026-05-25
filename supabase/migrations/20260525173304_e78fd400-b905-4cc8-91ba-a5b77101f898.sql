ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS has_milkshakes boolean,
  ADD COLUMN IF NOT EXISTS has_mocktails boolean,
  ADD COLUMN IF NOT EXISTS has_beers_ciders boolean;