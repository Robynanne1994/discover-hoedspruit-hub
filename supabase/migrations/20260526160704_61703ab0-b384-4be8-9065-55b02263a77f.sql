
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS phone_label text,
  ADD COLUMN IF NOT EXISTS email_label text,
  ADD COLUMN IF NOT EXISTS whatsapp_label text,
  ADD COLUMN IF NOT EXISTS additional_phone_labels text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS additional_email_labels text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS additional_whatsapp_labels text[] NOT NULL DEFAULT '{}';
