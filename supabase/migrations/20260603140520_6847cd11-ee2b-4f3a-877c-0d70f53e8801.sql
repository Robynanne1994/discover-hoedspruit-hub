
-- Add tag/sub_tag columns to specials (mirroring events)
ALTER TABLE public.specials
  ADD COLUMN IF NOT EXISTS tag text,
  ADD COLUMN IF NOT EXISTS sub_tag_1 text,
  ADD COLUMN IF NOT EXISTS sub_tag_2 text;

-- Migrate existing data: prefer category for tag, then fill sub_tags from eyebrow_categories
UPDATE public.specials
SET
  tag = COALESCE(
    NULLIF(trim(category), ''),
    NULLIF(trim(eyebrow_categories[1]), '')
  ),
  sub_tag_1 = CASE
    WHEN NULLIF(trim(category), '') IS NOT NULL THEN NULLIF(trim(eyebrow_categories[1]), '')
    ELSE NULLIF(trim(eyebrow_categories[2]), '')
  END,
  sub_tag_2 = CASE
    WHEN NULLIF(trim(category), '') IS NOT NULL THEN NULLIF(trim(eyebrow_categories[2]), '')
    ELSE NULLIF(trim(eyebrow_categories[3]), '')
  END
WHERE tag IS NULL;

-- Drop fields the user no longer wants
ALTER TABLE public.specials
  DROP COLUMN IF EXISTS sort_order,
  DROP COLUMN IF EXISTS eyebrow_categories,
  DROP COLUMN IF EXISTS category,
  DROP COLUMN IF EXISTS offer_headline,
  DROP COLUMN IF EXISTS offer_sublabel,
  DROP COLUMN IF EXISTS duration_headline,
  DROP COLUMN IF EXISTS duration_sublabel,
  DROP COLUMN IF EXISTS special_type,
  DROP COLUMN IF EXISTS day_of_week;
