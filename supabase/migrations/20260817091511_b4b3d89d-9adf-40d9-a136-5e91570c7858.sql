ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS homepage_image_url text, ADD COLUMN IF NOT EXISTS search_image_url text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS search_image_url text;
ALTER TABLE public.specials ADD COLUMN IF NOT EXISTS search_image_url text;
ALTER TABLE public.bush_telegraph_resources ADD COLUMN IF NOT EXISTS search_image_url text;