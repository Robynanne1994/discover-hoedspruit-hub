
CREATE TABLE public.business_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  kind text NOT NULL,
  status text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  ref_table text,
  ref_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_business_notifications_user ON public.business_notifications(user_id, created_at DESC);

ALTER TABLE public.business_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view own notifications"
  ON public.business_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owners update own notifications"
  ON public.business_notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage notifications"
  ON public.business_notifications FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
