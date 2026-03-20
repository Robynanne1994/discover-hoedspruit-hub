
ALTER TABLE public.listings
  ADD COLUMN good_for_kids boolean DEFAULT null,
  ADD COLUMN pets_allowed boolean DEFAULT null,
  ADD COLUMN wheelchair_friendly boolean DEFAULT null,
  ADD COLUMN price_level integer DEFAULT null,
  ADD COLUMN show_attributes boolean NOT NULL DEFAULT false;
