CREATE TABLE public.event_hosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image_url text,
  link text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX event_hosts_name_key ON public.event_hosts (lower(btrim(name)));
GRANT SELECT ON public.event_hosts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.event_hosts TO authenticated;
GRANT ALL ON public.event_hosts TO service_role;
ALTER TABLE public.event_hosts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view event hosts" ON public.event_hosts FOR SELECT USING (true);
CREATE POLICY "Admins manage event hosts" ON public.event_hosts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_event_hosts_updated_at BEFORE UPDATE ON public.event_hosts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();