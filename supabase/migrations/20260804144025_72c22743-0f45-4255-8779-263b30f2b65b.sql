ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS google_place_id text,
  ADD COLUMN IF NOT EXISTS google_place_name text,
  ADD COLUMN IF NOT EXISTS google_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS google_sync_status text,
  ADD COLUMN IF NOT EXISTS refresh_priority text NOT NULL DEFAULT 'normal';

CREATE INDEX IF NOT EXISTS listings_google_sync_idx
  ON public.listings (refresh_priority, google_synced_at NULLS FIRST)
  WHERE google_place_id IS NOT NULL;