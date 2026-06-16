-- Let reporters see the reports they submitted, including the admin's status
-- updates and any feedback the admin leaves specifically for the reporter.

-- User-facing feedback the admin can write back to the person who reported.
ALTER TABLE public.user_reports
  ADD COLUMN IF NOT EXISTS reporter_feedback text;

-- Reporters can read their own reports (so the app can show status + feedback).
-- This is additive to the existing admin SELECT policy (policies are OR'd).
DROP POLICY IF EXISTS "Reporters can view their own reports" ON public.user_reports;
CREATE POLICY "Reporters can view their own reports"
  ON public.user_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_user_id);
