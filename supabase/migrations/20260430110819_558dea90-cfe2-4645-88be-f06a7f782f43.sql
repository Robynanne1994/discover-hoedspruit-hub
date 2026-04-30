ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS custom_title_1 text,
  ADD COLUMN IF NOT EXISTS custom_text_1 text,
  ADD COLUMN IF NOT EXISTS custom_title_2 text,
  ADD COLUMN IF NOT EXISTS custom_text_2 text,
  ADD COLUMN IF NOT EXISTS custom_title_3 text,
  ADD COLUMN IF NOT EXISTS custom_text_3 text;