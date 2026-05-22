CREATE TABLE public.user_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_user_id uuid NOT NULL,
  reporter_user_id uuid,
  reporter_name text,
  reporter_email text,
  reason text NOT NULL,
  detail text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  is_read boolean NOT NULL DEFAULT false,
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a user report"
ON public.user_reports
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Admins can view user reports"
ON public.user_reports
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update user reports"
ON public.user_reports
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete user reports"
ON public.user_reports
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX user_reports_status_idx ON public.user_reports(status, is_read, created_at DESC);
CREATE INDEX user_reports_reported_user_idx ON public.user_reports(reported_user_id);