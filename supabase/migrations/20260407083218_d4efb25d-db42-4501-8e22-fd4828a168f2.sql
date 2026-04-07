
CREATE TABLE public.specials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  business_name TEXT NOT NULL,
  business_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  image_url TEXT,
  deal_label TEXT NOT NULL,
  valid_until DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.specials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active specials are viewable by everyone"
  ON public.specials FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage specials"
  ON public.specials FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_specials_updated_at
  BEFORE UPDATE ON public.specials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
