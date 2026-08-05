-- The nightly ratings sync sent its own limit in the request body
-- ('{"mode":"refresh","limit":32}'), which overrode the edge function's
-- DEFAULT_LIMIT. Raising the default in supabase/functions/refresh-google-ratings
-- therefore changed nothing about the scheduled run — only manual invocations.
--
-- The body now carries the mode alone, so the function's default governs and the
-- batch size lives in one place: the code. Changing it again is a code change,
-- not another migration.
--
-- cron.schedule() upserts on job name, so this replaces the existing job in place
-- and keeps its 02:00 UTC (04:00 SAST) schedule and job token header.
SELECT cron.schedule(
  'refresh-google-ratings-nightly',
  '0 2 * * *',
  $job$
  SELECT net.http_post(
    url := 'https://dgkfsavtyclwkramearr.supabase.co/functions/v1/refresh-google-ratings',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-job-token', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'ratings_job_token')
    ),
    body := '{"mode":"refresh"}'::jsonb,
    timeout_milliseconds := 300000
  );
  $job$
);
