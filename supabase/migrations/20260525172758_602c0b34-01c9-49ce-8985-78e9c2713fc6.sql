ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS has_wine_list boolean,
  ADD COLUMN IF NOT EXISTS has_cocktails boolean,
  ADD COLUMN IF NOT EXISTS has_craft_beer boolean,
  ADD COLUMN IF NOT EXISTS has_smoothies boolean,
  ADD COLUMN IF NOT EXISTS has_coffee boolean,
  ADD COLUMN IF NOT EXISTS has_champagne boolean;