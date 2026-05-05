-- Storage bucket for custom app icons
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-icons', 'app-icons', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "App icons are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'app-icons');

-- Admin write (uses existing has_role function)
CREATE POLICY "Admins can upload app icons"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'app-icons' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update app icons"
ON storage.objects FOR UPDATE
USING (bucket_id = 'app-icons' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete app icons"
ON storage.objects FOR DELETE
USING (bucket_id = 'app-icons' AND public.has_role(auth.uid(), 'admin'));

-- Table mapping icon slot names to uploaded image URLs
CREATE TABLE public.icon_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slot TEXT NOT NULL UNIQUE,
  image_url TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

ALTER TABLE public.icon_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Icon overrides are viewable by everyone"
ON public.icon_overrides FOR SELECT
USING (true);

CREATE POLICY "Admins can insert icon overrides"
ON public.icon_overrides FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update icon overrides"
ON public.icon_overrides FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete icon overrides"
ON public.icon_overrides FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_icon_overrides_updated_at
BEFORE UPDATE ON public.icon_overrides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();