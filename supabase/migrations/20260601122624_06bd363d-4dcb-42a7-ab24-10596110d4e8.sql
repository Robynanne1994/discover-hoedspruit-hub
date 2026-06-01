ALTER TABLE public.events
  ALTER COLUMN notes DROP DEFAULT,
  ALTER COLUMN notes TYPE text[] USING (
    CASE
      WHEN notes IS NULL OR btrim(notes) = '' THEN ARRAY[]::text[]
      ELSE string_to_array(notes, '|')
    END
  );

UPDATE public.events
SET notes = ARRAY(SELECT btrim(x) FROM unnest(notes) AS x WHERE btrim(x) <> '');

ALTER TABLE public.events
  ALTER COLUMN notes SET DEFAULT '{}'::text[],
  ALTER COLUMN notes SET NOT NULL;