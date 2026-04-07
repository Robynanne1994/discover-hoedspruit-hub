ALTER TABLE public.specials
  ADD COLUMN special_type text,
  ADD COLUMN day_of_week text[],
  ADD COLUMN valid_from date,
  ADD COLUMN price text,
  ADD COLUMN original_price text,
  ADD COLUMN booking_required boolean NOT NULL DEFAULT false,
  ADD COLUMN booking_link text,
  ADD COLUMN promo_code text,
  ADD COLUMN contact_phone text,
  ADD COLUMN contact_whatsapp text,
  ADD COLUMN terms text,
  ADD COLUMN category text;