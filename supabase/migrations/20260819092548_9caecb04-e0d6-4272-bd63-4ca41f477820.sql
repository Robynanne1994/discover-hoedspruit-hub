ALTER TABLE public.listings DROP COLUMN IF EXISTS years_in_business;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS opening_hours_label text;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS additional_hours jsonb;