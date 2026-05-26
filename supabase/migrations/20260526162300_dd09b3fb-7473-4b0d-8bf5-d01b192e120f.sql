
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS additional_websites text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS additional_website_labels text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS action_phone_index smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS action_email_index smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS action_whatsapp_index smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS action_website_index smallint NOT NULL DEFAULT 0;
