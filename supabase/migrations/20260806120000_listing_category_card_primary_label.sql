-- Per-category card label for listings that sit in more than one category.
--
-- A listing can belong to e.g. both "Home & Garden" and "Building & Renovation".
-- The detail page is identical either way, but the card eyebrow should read
-- differently depending on which category page the visitor is browsing from.
-- This column stores the label chosen for that listing *within that category*
-- (either the category title itself, or one of the listing's subcategories in
-- that category). NULL = automatic (first populated subcategory, then the
-- category title).
ALTER TABLE public.listing_categories
  ADD COLUMN IF NOT EXISTS card_primary_subcategory text;

-- Seed from the existing listing-level choice, but only for the category that
-- actually owns that subcategory — so the old single global value keeps working
-- where it made sense and leaves the other categories on automatic.
UPDATE public.listing_categories lc
SET card_primary_subcategory = l.card_primary_subcategory
FROM public.listings l
WHERE lc.listing_id = l.id
  AND lc.card_primary_subcategory IS NULL
  AND l.card_primary_subcategory IS NOT NULL
  AND btrim(l.card_primary_subcategory) <> ''
  AND EXISTS (
    SELECT 1
    FROM public.subcategories s
    WHERE s.category_id = lc.category_id
      AND lower(btrim(s.title)) = lower(btrim(l.card_primary_subcategory))
  );
