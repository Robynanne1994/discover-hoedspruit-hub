ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS kids_menu boolean DEFAULT NULL;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS high_chairs boolean DEFAULT NULL;