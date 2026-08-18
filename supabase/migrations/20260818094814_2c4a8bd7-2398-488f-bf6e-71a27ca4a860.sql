ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

UPDATE public.listings
   SET google_sync_status = 'matched'
 WHERE google_sync_status = 'error'
   AND google_place_id IS NOT NULL;