ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS hosted_by_name_2 TEXT,
  ADD COLUMN IF NOT EXISTS hosted_by_subtitle_2 TEXT,
  ADD COLUMN IF NOT EXISTS hosted_by_image_url_2 TEXT,
  ADD COLUMN IF NOT EXISTS hosted_by_name_3 TEXT,
  ADD COLUMN IF NOT EXISTS hosted_by_subtitle_3 TEXT,
  ADD COLUMN IF NOT EXISTS hosted_by_image_url_3 TEXT;