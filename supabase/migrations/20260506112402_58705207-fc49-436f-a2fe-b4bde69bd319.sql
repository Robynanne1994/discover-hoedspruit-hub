
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date;

-- Auto-migrate single dates: "2 May 2026"
UPDATE public.events
SET start_date = to_date(date, 'FMDD FMMonth YYYY'),
    end_date   = to_date(date, 'FMDD FMMonth YYYY')
WHERE start_date IS NULL
  AND date ~* '^\s*\d{1,2}\s+[A-Za-z]+\s+\d{4}\s*$';

-- Auto-migrate ranges in same month: "6 - 11 September 2026"
UPDATE public.events e
SET start_date = to_date(
      (regexp_match(e.date, '^\s*(\d{1,2})\s*-\s*\d{1,2}\s+([A-Za-z]+)\s+(\d{4})'))[1]
      || ' ' || (regexp_match(e.date, '^\s*(\d{1,2})\s*-\s*\d{1,2}\s+([A-Za-z]+)\s+(\d{4})'))[2]
      || ' ' || (regexp_match(e.date, '^\s*(\d{1,2})\s*-\s*\d{1,2}\s+([A-Za-z]+)\s+(\d{4})'))[3],
      'FMDD FMMonth YYYY'),
    end_date = to_date(
      (regexp_match(e.date, '^\s*\d{1,2}\s*-\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})'))[1]
      || ' ' || (regexp_match(e.date, '^\s*\d{1,2}\s*-\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})'))[2]
      || ' ' || (regexp_match(e.date, '^\s*\d{1,2}\s*-\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})'))[3],
      'FMDD FMMonth YYYY')
WHERE e.start_date IS NULL
  AND e.date ~* '^\s*\d{1,2}\s*-\s*\d{1,2}\s+[A-Za-z]+\s+\d{4}\s*$';
