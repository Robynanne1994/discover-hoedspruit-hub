
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS has_restaurant boolean DEFAULT null,
  ADD COLUMN IF NOT EXISTS has_bar boolean DEFAULT null,
  ADD COLUMN IF NOT EXISTS has_room_service boolean DEFAULT null,
  ADD COLUMN IF NOT EXISTS has_breakfast boolean DEFAULT null,
  ADD COLUMN IF NOT EXISTS breakfast_included boolean DEFAULT null,
  ADD COLUMN IF NOT EXISTS has_swimming_pool boolean DEFAULT null,
  ADD COLUMN IF NOT EXISTS has_laundry boolean DEFAULT null,
  ADD COLUMN IF NOT EXISTS child_friendly boolean DEFAULT null,
  ADD COLUMN IF NOT EXISTS has_spa boolean DEFAULT null,
  ADD COLUMN IF NOT EXISTS has_fitness_centre boolean DEFAULT null,
  ADD COLUMN IF NOT EXISTS has_airport_shuttle boolean DEFAULT null,
  ADD COLUMN IF NOT EXISTS has_aircon boolean DEFAULT null,
  ADD COLUMN IF NOT EXISTS has_wifi_accom boolean DEFAULT null,
  ADD COLUMN IF NOT EXISTS has_free_parking boolean DEFAULT null,
  ADD COLUMN IF NOT EXISTS has_secure_parking boolean DEFAULT null;
