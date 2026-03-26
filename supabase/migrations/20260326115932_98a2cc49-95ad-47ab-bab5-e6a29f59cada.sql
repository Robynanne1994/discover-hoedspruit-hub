ALTER TABLE public.listings ADD COLUMN google_rating numeric(2,1) DEFAULT NULL;
ALTER TABLE public.listings ADD COLUMN google_reviews_count integer DEFAULT NULL;