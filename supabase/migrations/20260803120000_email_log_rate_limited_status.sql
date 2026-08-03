-- Allow 'rate_limited' in email_send_log.status.
--
-- process-email-queue writes this status when the provider answers 429, and it
-- deliberately does NOT write 'failed' for that case: the retry budget counts
-- 'failed' rows, and being throttled is not the message's fault. Burning a
-- retry on it would send good email to the dead-letter queue.
--
-- The CHECK constraint never listed the value, so every one of those inserts
-- was rejected. The return value wasn't checked, so it failed silently: no row,
-- no error in the logs, and a rate-limit episode left no trace anywhere.
ALTER TABLE public.email_send_log DROP CONSTRAINT IF EXISTS email_send_log_status_check;

ALTER TABLE public.email_send_log ADD CONSTRAINT email_send_log_status_check
  CHECK (status IN (
    'pending',
    'sent',
    'suppressed',
    'failed',
    'rate_limited',
    'bounced',
    'complained',
    'dlq'
  ));
