
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS meal text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS vibe text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cuisine text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS seating text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS kids_playground boolean DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS smoking_allowed boolean DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS service_type text[] DEFAULT '{}';
