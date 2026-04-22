CREATE TABLE public.bush_telegraph_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  platform TEXT NOT NULL,
  meta TEXT,
  description TEXT,
  url TEXT NOT NULL,
  tone TEXT NOT NULL DEFAULT 'warm',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bush_telegraph_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Resources are viewable by everyone"
ON public.bush_telegraph_resources FOR SELECT
USING (true);

CREATE POLICY "Admins can manage resources"
ON public.bush_telegraph_resources FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_bush_telegraph_resources_updated_at
BEFORE UPDATE ON public.bush_telegraph_resources
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();