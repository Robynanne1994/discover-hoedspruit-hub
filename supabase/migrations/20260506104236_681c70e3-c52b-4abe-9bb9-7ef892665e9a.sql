ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS hosted_by_name TEXT,
  ADD COLUMN IF NOT EXISTS hosted_by_subtitle TEXT,
  ADD COLUMN IF NOT EXISTS hosted_by_image_url TEXT;