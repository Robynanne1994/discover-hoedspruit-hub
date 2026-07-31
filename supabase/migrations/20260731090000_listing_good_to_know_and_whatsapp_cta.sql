-- Listing detail page: "Good to know" highlights + a friendlier WhatsApp row.
--
-- good_to_know      — short highlight chips shown under the About tab
--                     (e.g. "Self-catering", "Rim-flow pool", "Pet friendly").
--                     Left empty the card simply doesn't render.
-- whatsapp_cta_label — the text shown in place of the WhatsApp number on the
--                     Contact tab. Blank falls back to "Chat on WhatsApp" in
--                     the app, so existing listings need no backfill.

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS good_to_know text[],
  ADD COLUMN IF NOT EXISTS whatsapp_cta_label text;

COMMENT ON COLUMN public.listings.good_to_know IS
  'Short "Good to know" highlight chips shown on the listing detail About tab.';
COMMENT ON COLUMN public.listings.whatsapp_cta_label IS
  'Overrides the WhatsApp contact row text. Blank renders the "Chat on WhatsApp" default.';
