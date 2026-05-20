ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS title_override text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS title_override text;
ALTER TABLE public.specials ADD COLUMN IF NOT EXISTS title_override text;