SELECT cron.schedule(
  'ratings-catchup',
  '* * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://dgkfsavtyclwkramearr.supabase.co/functions/v1/refresh-google-ratings',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-job-token', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'ratings_job_token')
    ),
    body := '{"mode":"refresh","limit":60}'::jsonb,
    timeout_milliseconds := 55000
  );
  $cron$
);