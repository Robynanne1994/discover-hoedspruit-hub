ALTER TABLE public.events ADD COLUMN social_media_link text DEFAULT NULL;
ALTER TABLE public.events ADD COLUMN contact_email text DEFAULT NULL;
ALTER TABLE public.events ADD COLUMN contact_phone text DEFAULT NULL;
ALTER TABLE public.events ADD COLUMN gallery_images text[] DEFAULT '{}'::text[];