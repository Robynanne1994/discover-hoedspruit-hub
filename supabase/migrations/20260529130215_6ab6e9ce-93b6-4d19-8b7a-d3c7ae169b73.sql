ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS venue_onsite_accommodation boolean,
  ADD COLUMN IF NOT EXISTS venue_accommodation_sleeps integer,
  ADD COLUMN IF NOT EXISTS venue_guest_capacity integer,
  ADD COLUMN IF NOT EXISTS venue_indoor_outdoor text,
  ADD COLUMN IF NOT EXISTS venue_style_tags text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS venue_setting_types text[] NOT NULL DEFAULT '{}'::text[];