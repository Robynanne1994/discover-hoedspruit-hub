ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS contact_whatsapp text,
  ADD COLUMN IF NOT EXISTS sub_tag_1 text,
  ADD COLUMN IF NOT EXISTS sub_tag_2 text,
  ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.listings(id) ON DELETE SET NULL;