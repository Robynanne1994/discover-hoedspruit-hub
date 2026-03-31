
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS amenities text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS sleeps integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS km_from_town text DEFAULT NULL;
