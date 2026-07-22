-- Which subcategory to show under the title on listing cards (explore category pages).
-- Stores the subcategory title; when null the card falls back to the first populated subcategory.
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS card_primary_subcategory text;
