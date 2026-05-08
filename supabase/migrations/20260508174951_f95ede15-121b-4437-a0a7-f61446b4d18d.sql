ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS specials_new boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS specials_ending boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS events_new_categories text[],
  ADD COLUMN IF NOT EXISTS listings_new_categories text[],
  ADD COLUMN IF NOT EXISTS listings_updates_categories text[],
  ADD COLUMN IF NOT EXISTS specials_new_categories text[];