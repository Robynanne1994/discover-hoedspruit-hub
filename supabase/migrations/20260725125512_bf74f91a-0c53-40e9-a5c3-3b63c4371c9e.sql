
CREATE TABLE public.app_update_broadcasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  pushed_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.app_update_broadcasts TO authenticated;
GRANT ALL ON public.app_update_broadcasts TO service_role;

ALTER TABLE public.app_update_broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view broadcasts"
  ON public.app_update_broadcasts
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
