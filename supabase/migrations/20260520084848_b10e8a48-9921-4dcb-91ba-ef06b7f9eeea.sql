ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS detail_image_url text,
  ADD COLUMN IF NOT EXISTS business_ids uuid[] DEFAULT '{}'::uuid[];