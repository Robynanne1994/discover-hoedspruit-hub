ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS wheelchair_car_park boolean DEFAULT NULL;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS wheelchair_entrance boolean DEFAULT NULL;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS wheelchair_seating boolean DEFAULT NULL;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS wheelchair_toilet boolean DEFAULT NULL;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS has_toilet boolean DEFAULT NULL;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS has_wifi boolean DEFAULT NULL;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS has_free_wifi boolean DEFAULT NULL;