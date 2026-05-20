ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS additional_emails text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS additional_phones text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS additional_whatsapps text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS additional_emails text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS additional_phones text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS additional_whatsapps text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.specials
  ADD COLUMN IF NOT EXISTS additional_emails text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS additional_phones text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS additional_whatsapps text[] NOT NULL DEFAULT '{}';