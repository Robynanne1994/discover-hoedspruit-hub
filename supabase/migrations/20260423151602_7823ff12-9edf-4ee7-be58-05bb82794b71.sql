ALTER TABLE public.specials ADD COLUMN IF NOT EXISTS booking_link_label TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS booking_link_label TEXT;