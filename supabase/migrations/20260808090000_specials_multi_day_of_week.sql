-- Weekly specials are not always a single night: "every Wednesday and Thursday"
-- is as common as "every Tuesday". day_of_week becomes a list of day names.
-- Existing single-day rows are wrapped into a one-element array, so nothing is
-- lost and every reader keeps seeing the same day.

ALTER TABLE public.specials DROP CONSTRAINT IF EXISTS specials_day_of_week_check;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'specials'
      AND column_name = 'day_of_week'
      AND data_type <> 'ARRAY'
  ) THEN
    ALTER TABLE public.specials
      ALTER COLUMN day_of_week TYPE text[]
      USING (
        CASE
          WHEN day_of_week IS NULL OR btrim(day_of_week) = '' THEN NULL
          ELSE ARRAY[btrim(day_of_week)]
        END
      );
  END IF;
END $$;

-- Same seven names as before, now checked per element. An empty array would
-- read as "no days" while looking like a schedule, so it is rejected: absence
-- is spelled NULL.
ALTER TABLE public.specials
  ADD CONSTRAINT specials_day_of_week_check
  CHECK (
    day_of_week IS NULL
    OR (
      array_length(day_of_week, 1) BETWEEN 1 AND 7
      AND day_of_week <@ ARRAY[
        'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'
      ]::text[]
    )
  );
