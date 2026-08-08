-- The multi-day check was meant to reject an empty day list — "{}" reads as
-- "no days" while still looking like a schedule, and absence is spelled NULL.
-- It did not: array_length(ARRAY[]::text[], 1) is NULL, not 0, so the whole
-- CHECK evaluated to NULL and Postgres let the row through. cardinality()
-- returns 0 for an empty array, which is what the range test needs.

-- Nothing in the app writes an empty list, but a row that predates this fix
-- would block the constraint, so normalise before re-adding it.
UPDATE public.specials
   SET day_of_week = NULL
 WHERE day_of_week IS NOT NULL
   AND cardinality(day_of_week) = 0;

ALTER TABLE public.specials DROP CONSTRAINT IF EXISTS specials_day_of_week_check;

ALTER TABLE public.specials
  ADD CONSTRAINT specials_day_of_week_check
  CHECK (
    day_of_week IS NULL
    OR (
      cardinality(day_of_week) BETWEEN 1 AND 7
      AND day_of_week <@ ARRAY[
        'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'
      ]::text[]
    )
  );
