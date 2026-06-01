-- Repurpose the events `notes` column as Price Notes (array), and add a new
-- general `notes` column.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS price_notes text[] NOT NULL DEFAULT '{}'::text[];

-- Migrate the existing single-text `notes` value into the new `price_notes` array
-- so previously-entered price info is preserved as a single price-note item.
UPDATE public.events
SET price_notes = ARRAY[notes]
WHERE notes IS NOT NULL
  AND btrim(notes) <> ''
  AND (price_notes IS NULL OR array_length(price_notes, 1) IS NULL);

-- Clear out the old text so `notes` can be reused as the new General Notes field.
UPDATE public.events
SET notes = NULL
WHERE notes IS NOT NULL;
