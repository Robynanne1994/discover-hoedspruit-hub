-- Allow listings to choose an icon for each custom detail row shown on the
-- listing detail page's Details tab. Stores a lucide icon key (see
-- src/lib/customIcons.tsx); NULL falls back to the default note icon.

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS custom_icon_1 text,
  ADD COLUMN IF NOT EXISTS custom_icon_2 text,
  ADD COLUMN IF NOT EXISTS custom_icon_3 text;
