
ALTER TABLE public.specials
  ADD COLUMN IF NOT EXISTS price_label text,
  ADD COLUMN IF NOT EXISTS offer_headline text,
  ADD COLUMN IF NOT EXISTS offer_sublabel text,
  ADD COLUMN IF NOT EXISTS duration_headline text,
  ADD COLUMN IF NOT EXISTS duration_sublabel text,
  ADD COLUMN IF NOT EXISTS eyebrow_categories text[];
